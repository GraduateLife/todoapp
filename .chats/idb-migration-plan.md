# IndexedDB 离线优先迁移计划

## 目标

把当前的 localStorage 方案替换成 IndexedDB，同时建立好离线优先的基础设施，让未来接入后端同步只需要填入网络层逻辑。

---

## 怎么干

分三层建设：

1. **适配器接口层** — 定义统一契约，store 只认接口
2. **IndexedDB 层** — 用 `idb` 替换 localStorage，存数据 + 存同步队列
3. **Store 层** — 移除 `persist` middleware，改为调用适配器

---

## 代码变动

**新增文件：**
```
src/lib/adapters/
  types.ts          ← DataAdapter 接口定义
  idb.ts            ← IndexedDBAdapter 实现（主力）
  api.ts            ← ApiAdapter 实现（wraps 现有 api.ts，暂时 stub）
  local.ts          ← LocalStorageAdapter（降级备用）
  index.ts          ← 工厂函数，根据 DATA_SOURCE 返回对应适配器
```

**修改文件：**
```
package.json              ← 加 idb 依赖
.env                      ← VITE_DATA_SOURCE=local 保持不变，行为变了
src/lib/env.ts            ← DataSource 类型加 sync
todoStore.ts              ← 移除 persist，action 改调 adapter
folderStore.ts            ← 同上
```

**不动的文件：**
```
所有 components/
所有 containers/
uiStore.ts
types.ts
路由文件
现有 src/lib/api.ts      ← 被 ApiAdapter 包装，本身不动
```

---

## IndexedDB 的数据库设计

三张表：
```
todos          ← 所有 todo 数据
folders        ← 所有 folder 数据
sync_queue     ← 待同步的操作记录（未来接后端用）
               { id, op, payload, createdAt, synced }
```

---

## sync_queue 的作用

现在写入但不消费（没有后端），相当于先把"欠条"记下来。未来后端就绪后，只需要加一个"网络恢复时消费队列"的逻辑，数据层完全不用再改。

---

## 这轮结束后的状态

```
DATA_SOURCE=local  → IndexedDB（离线可用，容量大）
DATA_SOURCE=api    → ApiAdapter（stub，等后端）
sync_queue         → 已建好，等后端来消费
```
