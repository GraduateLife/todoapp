# 后端迁移指南

当前应用是纯本地应用，数据存储在 `localStorage`，由 Zustand `persist` middleware 管理。
本文档描述如何在不改动 UI 层的前提下，将应用迁移到有后端 API 的状态。

---

## 当前架构

```
UI Components (StickyNote, SubTaskList, StackFan, ...)
      ↓ props / callbacks
Containers (StickyNoteContainer, StickyNoteCanvas, ...)
      ↓ zustand hooks
Stores (todoStore, folderStore, uiStore)
      ↓ persist middleware
localStorage
```

目标迁移后：

```
UI Components        ← 完全不动
      ↓
Containers           ← 完全不动
      ↓
Stores               ← 只改 action 实现（不改接口）
      ↓
api.ts               ← 填入真实 fetch 调用
      ↓
Backend API
```

---

## 第一步：设置环境变量

`.env.production`（新建，不提交到 git）：

```
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=https://your-api-domain.com
```

本地开发保持 `.env`：

```
VITE_DATA_SOURCE=local
```

---

## 第二步：完善 `src/lib/api.ts`

目前每个方法都有 stub，只需把 `request()` 函数保持不动，它已经封装了 fetch 逻辑。

如果需要认证，在 `request()` 里加 token header：

```ts
async function request<T>(method, path, body?) {
  if (DATA_SOURCE !== 'api') throw notReady(`${method} ${path}`)

  const token = localStorage.getItem('auth_token') // 或从 authStore 读
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`[api] ${method} ${path} → ${res.status}`)
  return res.json() as Promise<T>
}
```

---

## 第三步：改造 `todoStore.ts`

### 3a. 移除 persist middleware

```ts
// 改前
export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'todoai-storage', version: 4, migrate: ... }
  )
)

// 改后
export const useTodoStore = create<TodoState>()(
  (set, get) => ({ ... })
)
```

### 3b. 应用启动时拉取初始数据

在 `src/routes/__root.tsx` 的 `beforeLoad` 或根组件的 `useEffect` 里：

```ts
useEffect(() => {
  if (DATA_SOURCE === 'api') {
    Promise.all([todoApi.getAll(), folderApi.getAll()])
      .then(([todos, folders]) => {
        useTodoStore.setState({ todos })
        useFolderStore.setState({ folders })
      })
  }
}, [])
```

### 3c. 每个 action 改成「乐观更新 + API 同步」

以 `addTodo` 为例：

```ts
addTodo: (title, attachments, color) => {
  const todo = createTodo(title, attachments, color)

  // 乐观更新 — UI 立刻响应，不等服务器
  set((state) => ({ todos: [todo, ...state.todos] }))

  if (DATA_SOURCE === 'api') {
    todoApi.create(title, attachments, color)
      .then((serverTodo) => {
        // 用服务器返回的真实数据（含服务器生成的 id）替换临时数据
        set((state) => ({
          todos: state.todos.map((t) => t.id === todo.id ? serverTodo : t)
        }))
      })
      .catch(() => {
        // 网络失败则回滚
        set((state) => ({ todos: state.todos.filter((t) => t.id !== todo.id) }))
      })
  }
},
```

`deleteTodo` 类似：

```ts
deleteTodo: (id) => {
  // 先保存备份用于回滚
  const backup = useTodoStore.getState().todos.find((t) => t.id === id)

  set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }))

  if (DATA_SOURCE === 'api') {
    todoApi.delete(id).catch(() => {
      // 回滚
      if (backup) set((state) => ({ todos: [...state.todos, backup] }))
    })
  }
},
```

其余 action（`toggleTodo`, `updateTitle`, `setPriority`, `moveTodo` 等）按同样模式处理：
1. 先 `set()` 修改本地状态
2. 如果 `DATA_SOURCE === 'api'`，调用 `todoApi.*` 对应方法
3. catch 里回滚

---

## 第四步：改造 `folderStore.ts`

与 todoStore 完全一致的模式：
- 移除 `persist`
- `createFolder` / `deleteFolder` / `renameFolder` / `appendToFolder` / `removeFromFolder` 等 action 都加乐观更新 + `folderApi.*` 调用

---

## 第五步（可选）：加认证

新建 `src/features/auth/store/authStore.ts`：

```ts
interface AuthState {
  token: string | null
  user: { id: string; email: string } | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}
```

在 `src/routes/__root.tsx` 加路由守卫：

```ts
beforeLoad: ({ location }) => {
  if (DATA_SOURCE === 'api' && !useAuthStore.getState().token) {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }
}
```

---

## 文件改动范围总结

| 文件 | 改动 |
|------|------|
| `.env.production` | 新建，设置 `VITE_DATA_SOURCE=api` |
| `src/lib/api.ts` | 填入真实 fetch 调用，加 token header |
| `src/features/todo/store/todoStore.ts` | 移除 persist，action 加乐观更新 + API 调用 |
| `src/features/todo/store/folderStore.ts` | 同上 |
| `src/routes/__root.tsx` | 加启动数据拉取，可选加认证守卫 |
| `src/features/auth/` | 可选，新建认证模块 |

**以下文件完全不需要改动：**
- 所有 `components/` 下的 UI 组件
- 所有 `containers/` 下的容器组件
- `uiStore.ts`（纯 UI 状态，永远本地）
- `types.ts`
- 路由文件（除 `__root.tsx`）

---

## 推荐后端技术栈

| 选项 | 语言 | 适合场景 |
|------|------|----------|
| FastAPI | Python | 快速原型，熟悉 Python |
| Hono | TypeScript | 全栈 TS，可部署到 Cloudflare Workers |
| Express / Fastify | TypeScript | 传统 Node.js |
| Supabase | — | 不想自己写后端，直接用 BaaS |

数据库推荐 PostgreSQL（通过 Prisma ORM）或 SQLite（轻量本地部署）。
