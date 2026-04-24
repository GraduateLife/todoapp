# Request Flow

这份文档描述两件事：

1. 这个 app 在理想状态下，请求应该如何流动
2. `share` 功能当前已经落地的实际流向是什么

它刻意区分“理想目标”和“当前实现”，因为仓库里还保留了一些历史直连路径。

## 一句话原则

理想状态下，这个 app 的请求拓扑应该是：

`Browser -> same-origin app server (TanStack Start / Nitro BFF) -> domain backend / external service`

也就是说：

- 浏览器只关心当前站点自己的接口
- 业务路由、鉴权、路由选择、上游切换，都在同源 BFF 完成
- 真正的后端可以是 Node API、Cloudflare Worker、AI provider，甚至将来的其他服务

浏览器应当只直接做两类事情：

- 纯本地能力：`IndexedDB`、`localStorage`、`clipboard`、`MediaRecorder`、文件选择
- 页面导航：打开 app 页面或分享页面

除了这些，浏览器不应直接知道外部服务地址。

## 理想状态下的请求分层

### 1. 页面与 SSR

页面请求的理想流向：

`Browser -> TanStack Start SSR -> HTML -> Hydration -> client interactions`

说明：

- 浏览器先请求页面路由，比如 `/`、`/share`
- TanStack Start + Nitro 负责 SSR 和资源输出
- hydration 之后，客户端再绑定交互逻辑

这一层负责“页面壳”和“同源入口”，不应承载业务上游地址判断。

### 2. Todo / Folder 业务数据

理想状态下，`todos` / `folders` 相关请求应该是：

`UI action -> store -> same-origin BFF/server fn -> backend API -> database`

更具体地说：

- 用户在 UI 中创建、编辑、删除 todo / folder
- Zustand store 负责本地状态更新
- 若需要联网，同源接口负责把变更转发到真正后端
- 后端负责持久化和返回最新数据

理想上，浏览器只调用：

- `/api/todos`
- `/api/folders`
- 或 TanStack server function 的同源封装

而不应该直接调用：

- `http://localhost:8000`
- `http://localhost:8787`
- `https://xxx.workers.dev`

### 3. AI 请求

理想状态下，AI 请求应该是：

`Browser input/audio -> same-origin AI endpoint/server fn -> OpenAI / Anthropic / Ollama`

说明：

- 浏览器负责采集文本、音频、上下文
- 同源服务端负责拼装 provider request
- API key、provider base URL、model 选择，都应在服务端

理想模型里，浏览器不应直接持有任何 AI provider 密钥。

### 4. Share 请求

理想状态下，share 的写路径应该是：

`Browser -> /api/share -> share backend -> share storage/render source`

而 share 的读路径应该是：

`Browser opens share URL -> public share renderer -> rendered page`

重点是两条链：

- 发布链：应用内点击 `share`
- 打开链：用户点开分享链接

这两条链不一定必须由同一个运行时提供，但对浏览器来说应该尽量稳定、可预测。

## 当前仓库里的实际状态

当前实现已经接近“同源 BFF + 后端分发”的模型，但还没有全量收口。

### 已经符合目标的部分

`share` 已经走同源 BFF：

- 浏览器发布 share 时只请求 `/api/share`
- Nitro BFF 再转发到 `SHARE_TARGET_URL`
- `SHARE_TARGET_URL` 指向真正的 share backend，比如 Cloudflare Worker

相关代码：

- [src/lib/share/api.ts](/Users/zhangyuntao/Desktop/code/todoapp/src/lib/share/api.ts:1)
- [server/api/share.post.ts](/Users/zhangyuntao/Desktop/code/todoapp/server/api/share.post.ts:1)
- [server/api/share/[id].delete.ts](/Users/zhangyuntao/Desktop/code/todoapp/server/api/share/[id].delete.ts:1)
- [server/api/share/health.get.ts](/Users/zhangyuntao/Desktop/code/todoapp/server/api/share/health.get.ts:1)
- [server/utils/shareProxy.ts](/Users/zhangyuntao/Desktop/code/todoapp/server/utils/shareProxy.ts:1)

### 仍然是历史直连的部分

`todos` / `folders` 目前还保留浏览器直连 API 的路径：

- [src/lib/drivers/api.ts](/Users/zhangyuntao/Desktop/code/todoapp/src/lib/drivers/api.ts:1)
- [src/lib/strategies/auto.ts](/Users/zhangyuntao/Desktop/code/todoapp/src/lib/strategies/auto.ts:1)

它们直接使用 `VITE_API_BASE_URL`，也就是浏览器知道真实 backend 地址。

AI 目前也还是浏览器直连 provider：

- [src/lib/ai/providers/openai.ts](/Users/zhangyuntao/Desktop/code/todoapp/src/lib/ai/providers/openai.ts:1)
- [src/lib/ai/providers/anthropic.ts](/Users/zhangyuntao/Desktop/code/todoapp/src/lib/ai/providers/anthropic.ts:1)
- [src/lib/ai/providers/ollama.ts](/Users/zhangyuntao/Desktop/code/todoapp/src/lib/ai/providers/ollama.ts:1)

这就是为什么仓库里还残留较多 `VITE_*` 配置。

## 当前 app 的请求分类

从“会不会发请求”角度看，当前 app 主要有 4 类流量：

### A. 页面请求

- `GET /`
- `GET /share?id=...`
- 静态资源、SSR 资源、hydration 资源

### B. 业务数据请求

- `GET /todos`
- `PUT /todos/:id`
- `DELETE /todos/:id`
- `GET /folders`
- `PUT /folders/:id`
- `DELETE /folders/:id`

这些目前主要由 storage strategy 触发。

### C. Share 请求

- `POST /api/share`
- `DELETE /api/share/:id`
- `GET /api/share/health`
- `GET /s/:id` 或 share public URL

### D. AI 请求

- provider completion
- provider transcription

这些目前仍是前端直连。

## Share 的专门流向

下面只看 share。

### 1. 发布 share

当前实际流向：

`Share page -> useShareState -> ApiShareStrategy -> POST /api/share -> Nitro BFF -> SHARE_TARGET_URL/share -> backend createShare -> share URL`

对应代码链路：

- 页面触发发布：
  [src/routes/share.tsx](/Users/zhangyuntao/Desktop/code/todoapp/src/routes/share.tsx:101)
- 状态管理与 publish 调用：
  [src/features/share/hooks/useShareState.ts](/Users/zhangyuntao/Desktop/code/todoapp/src/features/share/hooks/useShareState.ts:31)
- 客户端 share API：
  [src/lib/share/api.ts](/Users/zhangyuntao/Desktop/code/todoapp/src/lib/share/api.ts:21)
- Nitro BFF：
  [server/api/share.post.ts](/Users/zhangyuntao/Desktop/code/todoapp/server/api/share.post.ts:11)
- 上游目标解析：
  [server/utils/shareProxy.ts](/Users/zhangyuntao/Desktop/code/todoapp/server/utils/shareProxy.ts:24)
- 后端 share 业务：
  [backend/http/routes/shares.ts](/Users/zhangyuntao/Desktop/code/todoapp/backend/http/routes/shares.ts:41)
  [backend/application/shares.ts](/Users/zhangyuntao/Desktop/code/todoapp/backend/application/shares.ts:15)

### 2. share health 检查

当前实际流向：

`Share diagnostics -> GET /api/share/health -> Nitro BFF -> probe SHARE_TARGET_URL/todos`

这里的 health probe 不是检查“分享页 HTML 是否可打开”，而是轻量检查上游 share backend 是否活着。

对应代码：

- [src/features/share/components/ShareDiagnostics.tsx](/Users/zhangyuntao/Desktop/code/todoapp/src/features/share/components/ShareDiagnostics.tsx:1)
- [src/lib/share/api.ts](/Users/zhangyuntao/Desktop/code/todoapp/src/lib/share/api.ts:90)
- [server/api/share/health.get.ts](/Users/zhangyuntao/Desktop/code/todoapp/server/api/share/health.get.ts:1)
- [server/utils/shareProxy.ts](/Users/zhangyuntao/Desktop/code/todoapp/server/utils/shareProxy.ts:40)

### 3. 打开 share 链接

当前实际流向：

`Browser opens returned URL -> share backend /s/:id -> backend loads share record -> render HTML response`

这里和发布链不同：

- 发布链先经过 app 自己的 `/api/share`
- 打开链直接去分享链接本身

只要最终链接可打开、能渲染页面，用户不需要关心它背后到底是 Worker、Pages 还是别的运行时。

对应代码：

- [backend/http/routes/shares.ts](/Users/zhangyuntao/Desktop/code/todoapp/backend/http/routes/shares.ts:67)

### 4. 当前 share 的稳定模型

可以把它理解成：

`App frontend`
-> `same-origin share BFF (/api/share)`
-> `share backend (configured by SHARE_TARGET_URL)`
-> `public share page`

这是当前仓库里请求流动最接近理想状态的一块。

## 推荐的终局形态

如果把整个 app 都收口到理想模型，最终应当是：

- 页面层：TanStack Start SSR
- 浏览器层：只调同源接口
- BFF 层：按领域拆分 `todos/folders/share/ai`
- 后端层：Node API、Cloudflare Worker、AI provider
- 本地层：IndexedDB / Media / Clipboard

换句话说：

- `share` 已经基本走在正确方向上
- `todos/folders` 还在历史直连阶段
- `AI` 还在历史直连阶段

所以当前最适合作为“模板”的，不是旧的 storage API，而是 `share` 这条链路。
