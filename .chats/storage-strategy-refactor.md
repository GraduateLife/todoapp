# Storage Strategy 重构计划

> 创建日期: 2026-04-17
> 状态: 待讨论，尚未动手

---

## 一、为什么要重构

### 1.1 现状的问题

当前 `src/lib/strategies/` 下有 4 个 strategy class：

```
OfflineStrategy   → 只用 IDB
OnlineStrategy    → 只用 API（没有本地缓存，网络抖一下数据就丢）
DualStrategy      → 先写 IDB，再写 API（fire-and-forget）
AutoStrategy      → IDB + API，启动时双向合并
```

问题是 **"用哪个介质"和"怎么同步"被揉进了同一个 class**。
这是两个正交的轴，平铺成 4 个文件导致：

- 新增一种本地介质（比如 Electron 的 SQLite）需要复制粘贴 4 个 strategy 的大部分逻辑
- 新增一种同步模式（比如 CRDT）也需要改 4 个文件
- `OnlineStrategy` 没有本地写入，这是架构 bug 不是 feature——local-first 是数据安全的下界
- 测试困难：每个 strategy 内部耦合了 IDB 或 API 的具体实现

### 1.2 未来需求

- **Electron 版**：本地存储从 IndexedDB 换成 SQLite（通过 preload bridge）
- **Share 功能**：需要新的存储通道（share metadata + blob），如果还往 strategy 里塞会更乱
- **离线容错**：remote 写失败时需要 retry 队列，这个逻辑不该散落在每个 strategy 里

---

## 二、核心思路

### 2.1 拆成三层

| 层 | 职责 | 选项 |
|---|---|---|
| **Store**（介质） | 读写一种具体存储 | `IdbStore`, `SqliteStore`, `ApiStore`, `MemoryStore` |
| **SyncEngine**（同步策略） | 决定 local 写完之后远端怎么搞 | `NoneSync`, `RelaySync`, `FullSync` |
| **StorageFacade**（门面） | 组合 local + remote + sync，对外暴露跟现在一模一样的接口 | 唯一实现 |

### 2.2 数据流

```
用户操作
  → Zustand action（同步更新内存态，UI 立刻响应）
  → facade.saveTodo(todo)
      → local.saveTodo(todo)          // 永远本地先
      → sync.onWrite('todo', todo)    // 按策略决定远端行为
          → none:  什么都不做
          → relay: remote.saveTodo(todo), 失败入 retry 队列
          → full:  入 outbox, 后台 flush + 冲突解决
```

### 2.3 Zustand 的定位

**Zustand 不是 storage，不是 interface，是内存中的 reactive cache。**

```
┌──────────────────────────────┐
│  UI (React components)       │  ← 只读 Zustand
├──────────────────────────────┤
│  Zustand Store               │  ← 内存态，app 运行期唯一真源
│  (todos, folders, ui state)  │     纯同步，极快
├──────────────────────────────┤
│  StorageFacade               │  ← 持久化门面
│  ┌────────┐ ┌────────────┐   │
│  │ local  │ │ remote     │   │
│  │ IDB    │ │ API / null │   │
│  └────────┘ └────────────┘   │
│       ↕ SyncEngine           │
└──────────────────────────────┘
```

两个平台（web / electron）共享同一个 Zustand store，只换 local Store 实现。

---

## 三、不动的东西（影响范围锁定）

| 模块 | 动不动 | 原因 |
|---|---|---|
| Zustand store (`todoStore` / `uiStore` / `folderStore`) | 不动 | 调 `getStrategy()` 的签名不变 |
| AI (`src/lib/ai/`, services, hooks) | 不动 | 跟 storage 零交叉：AI 走 HTTP 直连 provider，不碰 store 也不碰 persistence |
| 全部 UI 组件和容器 | 不动 | 只看 Zustand |
| 后端 (`backend/`) | 不动 | 前端 `ApiStore` 调的 REST 接口没变 |
| Export 模板 | 不动 | |
| 拖拽 / 动画 / glow / drag zones | 不动 | |

**动的只有 `src/lib/strategies/` + `src/lib/drivers/`**，搬到 `src/lib/storage/` 下重组。

---

## 四、目标文件结构

```
src/lib/storage/
├─ index.ts                  ← initStrategy() / getStrategy()，签名不变
├─ facade.ts                 ← StorageFacade class
├─ stores/
│  ├─ types.ts               ← Store interface（从 drivers/types.ts 演变）
│  ├─ local/
│  │  ├─ idb.ts              ← 现有 IdbDriver，改名
│  │  ├─ sqlite.ts           ← Electron 用（未来）
│  │  └─ memory.ts           ← 测试 / 极端隐私模式
│  └─ remote/
│     └─ api.ts              ← 现有 ApiDriver，改名
├─ sync/
│  ├─ types.ts               ← SyncEngine interface
│  ├─ none.ts                ← 不同步
│  ├─ relay.ts               ← 写穿透 + 失败队列
│  └─ full.ts                ← 双向合并（留后面做）
└─ (删除 src/lib/strategies/ 和 src/lib/drivers/)
```

---

## 五、关键接口定义

### 5.1 Store（介质）

```ts
// src/lib/storage/stores/types.ts
interface Store {
  init(): Promise<{ todos: Todo[]; folders: Folder[] }>
  saveTodo(todo: Todo): Promise<void>
  deleteTodo(id: string): Promise<void>
  saveFolder(folder: Folder): Promise<void>
  deleteFolder(id: string): Promise<void>
}
```

跟现有 `StorageDriver` 签名一致，只改名。

### 5.2 SyncEngine（同步策略）

```ts
// src/lib/storage/sync/types.ts
interface SyncEngine {
  // 启动时：可选的远端数据拉取 + 合并
  onInit(local: Store, remote: Store): Promise<void>
  // 写操作后：决定远端怎么处理
  onWrite(kind: 'todo' | 'folder', data: Todo | Folder, remote: Store): Promise<void>
  // 删除操作后
  onDelete(kind: 'todo' | 'folder', id: string, remote: Store): Promise<void>
}
```

### 5.3 StorageFacade（门面）

```ts
// src/lib/storage/facade.ts
class StorageFacade implements StorageStrategy {
  constructor(
    private local: Store,
    private remote: Store | null,
    private sync: SyncEngine,
  ) {}

  async init() {
    const data = await this.local.init()
    if (this.remote) await this.sync.onInit(this.local, this.remote)
    return data
  }

  async saveTodo(todo: Todo) {
    await this.local.saveTodo(todo)
    if (this.remote) await this.sync.onWrite('todo', todo, this.remote)
  }

  async deleteTodo(id: string) {
    await this.local.deleteTodo(id)
    if (this.remote) await this.sync.onDelete('todo', id, this.remote)
  }

  // saveFolder / deleteFolder 同理
}
```

---

## 六、现有 4 种策略的映射

| 旧 Strategy | 新组合 `{ local, remote, sync }` | 备注 |
|---|---|---|
| `OfflineStrategy` | `{ IdbStore, null, NoneSync }` | 干净 |
| `OnlineStrategy` | `{ IdbStore, ApiStore, RelaySync }` | 修正：强制加了本地缓存 |
| `DualStrategy` | `{ IdbStore, ApiStore, RelaySync }` | 跟修正后的 online 等价 |
| `AutoStrategy` | `{ IdbStore, ApiStore, FullSync }` | full 暂降级为 relay |

环境变量 `STORAGE_STRATEGY` 保留作为快捷预设，内部展开成三个底层值。
未来可拆成 `STORAGE_LOCAL=idb|sqlite|memory`、`STORAGE_REMOTE=api|none`、`STORAGE_SYNC=none|relay|full`。

---

## 七、实施步骤

### 步骤 1：纯搬家（零行为变化）

- 创建 `src/lib/storage/` 目录结构
- 把 `IdbDriver` → `stores/local/idb.ts`，`ApiDriver` → `stores/remote/api.ts`
- 把 `StorageDriver` interface → `stores/types.ts`，重命名为 `Store`
- `index.ts` 保持 `initStrategy()` / `getStrategy()` 签名不变
- 删掉旧 `src/lib/strategies/` 和 `src/lib/drivers/`
- **验证**：全量 tsc + build + 手动测试 CRUD，确认行为完全不变

### 步骤 2：加 facade + sync engine（none + relay）

- 实现 `StorageFacade`
- 实现 `NoneSync`（全 noop）和 `RelaySync`（写穿透 + console.warn on failure）
- `index.ts` 用 facade 重组 4 种策略
- **验证**：offline 模式下跟步骤 1 行为一致；dual 模式下写远端行为一致

### 步骤 3：relay 加 retry 队列

- 远端写失败时入 localStorage 队列
- 下次 init 时 flush
- 这是 `OnlineStrategy` 缺失的容错，也是 dual 的加强

### 步骤 4：Electron 适配（择期）

- 新增 `stores/local/sqlite.ts`
- 通过 `window.electronAPI.db` 桥接 main process 的 better-sqlite3
- `index.ts` 里 `isElectron() ? new SqliteStore() : new IdbStore()`
- facade / sync / remote 代码零改动

### 步骤 5：FullSync（择期）

- 需要 tombstone 表、LWW 冲突解决器、后台 pull / SSE
- 工程量最大，但被隔离在 `sync/full.ts` 一个文件里
- 其余代码零改动

---

## 八、跟 Share 功能的关系

Share 是一条**平行通道**，不走 `StorageStrategy`。

Share 的后端设计也遵循同样的 port/adapter 拆分：
- `ShareMetaStore`（metadata: id → title, format, createdAt, expiresAt）
- `ShareBlobStore`（content: id → 渲染好的 HTML/MD）
- Node adapter: 两个 port 都打到 sqlite
- CF adapter: metadata → D1, blob → R2

前端新增 `src/lib/share/` 目录（`ShareStrategy` interface + `ApiShareStrategy` + `NoopShareStrategy`），
跟 storage 重构是独立的——可以先做 share，也可以先做 storage 重构，互不阻塞。

---

## 九、风险和注意事项

1. **IDB schema 不变**：搬家只改 TypeScript 代码，不改 IndexedDB 的 object store 结构，不需要数据迁移
2. **import path 全局替换**：`src/lib/strategies` → `src/lib/storage`，`src/lib/drivers` → `src/lib/storage/stores`。受影响的文件大约 5-8 个（store 文件 + StickyNoteCanvas 的 init 调用）
3. **`OnlineStrategy` 行为变化**：重构后 online 模式会多出本地 IDB 写入——这是刻意修正，不是 regression。如果有用户依赖"online = 不留本地痕迹"的行为，需要用 `MemoryStore` 替代 `IdbStore`
4. **FullSync 降级**：步骤 2 中 `AutoStrategy` 暂时降级为 relay（丢失启动时的双向合并）。如果当前有用户在用 auto 模式并依赖此行为，需要提前沟通
5. **测试覆盖**：facade + sync engine 应该有单元测试（用 MemoryStore mock），确保组合行为正确
