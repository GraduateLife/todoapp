# Share 页改造：CRT 监控墙

## 心智定位

- **首页 = 桌面图钉板**：自由漂浮、扔牌动画、sticky-note 隐喻、活泼。
- **Share 页 = 机柜监控墙**：磁吸网格、每格一个 CRT 小屏幕、整齐对齐、工业感。
- 用 **截然不同的排布规则** 来区分"工作区" vs "已发布物档案"，避免用户困惑（"我速记的东西怎么跑出来 share 出去的东西"）。

## 视觉概念："2040 想象 1990 CRT"

每个网格瓦片 = 一个 mac 风格 chrome 包裹的 CRT 小屏幕：

```
┌──────────────────────────┐
│ ●  ●  ●          [CH-07] │   <- 三色灯 + 频道号
│ ┌──────────────────────┐ │
│ │                      │ │
│ │        200           │ │   <- 黑屏 + status code（默认）
│ │                      │ │      或快照（V2）
│ │                      │ │
│ └──────────────────────┘ │
│ jf-10IVG · html · 04/27  │   <- 底部状态栏：短 ID / 格式 / 日期
└──────────────────────────┘
```

### 三色灯（mac traffic lights，但语义重映射）

- 🔴 **红** = revoke share（弹窗确认 + 0.5s 长按触发，避免误触关闭窗口的肌肉记忆）
- 🟡 **黄** = 进入这个 todo 的 share 编辑页
- 🟢 **绿** = 在新标签打开 URL
- 默认显示三个圆点；hover 时该灯放大并显示文字 tooltip（`[ revoke ]` / `[ edit ]` / `[ open ]`）

### CRT 显示区

- 默认：纯黑底 + 大号等宽 status code 文字（200 / 404 / 503 / `??`）。颜色按状态：2xx 绿、4xx/5xx 红、未知琥珀。
- 鱼眼 / CRT bulge 特效**只作用于背景层**（黑底 + 扫描线 + 微微的 vignette），status code 文字在最前层不参与畸变（保证小字可读）。
- 扫描线复用 `--rf-scanline` 变量。
- V2：编辑页可勾选"发布时快照"或"实时缩略图"，勾上后显示截图替代黑屏。

### 排布规则

- CSS Grid `repeat(auto-fill, minmax(240px, 1fr))`，固定瓦片高度（约 160px）。
- 端正、对齐，**无旋转、无随机偏移**。
- 没有空槽，N 张卡排 N 个位置。
- 默认按 `sharedAt` 倒序（最新发布的在左上角）。
- V2：拖动吸附到最近槽位重排（先不做）。
- 列数随窗口宽度自动变化，触发轻量 layout 动画（不要 motion 飞行）。

## 实施分期

### V1（本次工程范围）

1. **新组件 `ShareMonitorTile`**（`src/features/share/components/ShareMonitorTile.tsx`）
   - Props：`{ todo, share, statusCode, isStatusLoading }` + 三个回调 `onRevoke / onEdit / onOpen`
   - 内部包含 `MacTrafficLights` 子组件（hover 放大 + tooltip）
   - 内部包含 `CrtScreen` 子组件（黑底 + 扫描线 + 鱼眼背景 + status code 文字）
   - 长按 + 弹窗确认走 revoke

2. **新组件 `ShareMonitorGrid`**（`src/features/share/components/ShareMonitorGrid.tsx`）
   - 接收 `Array<{ todo, share }>`，CSS Grid 布局
   - 内部用 `useShareStatusBatch(shares)` 拉取每个 share 的 status code（懒加载）

3. **新 hook `useShareStatusBatch`**（`src/features/share/hooks/useShareStatusBatch.ts`）
   - 用 `useQueries` 对每个 share URL 发 HEAD（或 GET + range:0-0）请求
   - 走 react-query 缓存（`staleTime` ~5min）
   - 用 `IntersectionObserver` 包一层，只拉取**视口内**的 tile（避免 N 个请求一波冲）
   - 失败 → status = `null`（显示 `??`）

4. **替换 `EmptyShareState` 的列表部分** → 渲染 `ShareMonitorGrid`
   - 列表为空时仍显示提示文案（用现有终端腔写法 `> no active shares yet`）
   - 列表非空时不再显示原来的 cyan 按钮卡

5. **修复主题 token**
   - 全部硬编码 `rgba(0,245,255,...)` / `#ffb800` 替换为 `var(--rf-text)` / `var(--rf-text-dim)` / `var(--rf-border)` / 状态色变量
   - 新增 status 颜色 token（如果还没有）：`--rf-status-ok` / `--rf-status-err` / `--rf-status-warn`

6. **文案改造为终端腔**
   - `EXPORTED` → `[ exported ]`
   - `click to inspect any shared todo.` → `> click any monitor to inspect`
   - `no active shares yet` → `> no active shares yet`
   - `loading shared todos...` → `> scanning channels...`

7. **CRT 鱼眼实现**
   - SVG `<filter>` + `feDisplacementMap` 或 CSS `border-radius: 30% / 18%` + 内嵌伪 vignette
   - 选 CSS 路线（无 SVG 滤镜性能负担），鱼眼只作用于"屏幕"伪元素背景
   - 可在 `globals.css` 加 `.rf-crt-screen` 工具类供其他地方复用

### V2（后续工程，本次不做）

- 编辑页加"快照"开关（发布时快照 / 实时缩略图 / 黑屏）
- 快照存储：先尝试 IndexedDB（`idb-keyval`），share 服务端不动
- 拖动吸附排序
- 顶部搜索框过滤 title / URL（>10 张卡时显示）
- 频道号 `CH-07` 是否要做（视 V1 完成后视觉密度决定）

## 文件改动清单（V1）

**新增**
- `src/features/share/components/ShareMonitorTile.tsx`
- `src/features/share/components/ShareMonitorGrid.tsx`
- `src/features/share/components/MacTrafficLights.tsx`（如果觉得拆出来更清爽）
- `src/features/share/components/CrtScreen.tsx`（如果觉得拆出来更清爽）
- `src/features/share/hooks/useShareStatusBatch.ts`
- `server/api/share/status/[id].get.ts` — 新 BFF endpoint
- `.chats/share-page-monitor-wall.md`（本文件）

**修改**
- `src/features/share/components/EmptyShareState.tsx` — 替换列表区，文案改造
- `src/styles/globals.css` — 新增 status 色 token + `.rf-crt-screen` 工具类（可选）
- `src/lib/share/api.ts` — 加 `fetchShareStatus(id)` 客户端封装
- `server/utils/shareProxy.ts` — 加 `probeShareStatus(id)` 工具函数

**不动**
- `src/features/share/components/SharePage.tsx`（路由分发不变）
- `src/features/share/components/ShareWorkspace.tsx`（编辑页 V2 才碰）
- `src/lib/share/*`（status 探测复用现有 `probeShareHealth` 思路或新增）

## 设计风险与决策

- **status code 探测走 BFF（同源）**：实测上游已开 CORS，浏览器直连可行，但根据 [docs/request-flow.md](../docs/request-flow.md) 架构信条（"浏览器只调同源接口"），share 已经是仓库里最接近理想模型的一条链，新功能不要破坏它。**新增 `GET /api/share/status/:id` BFF endpoint**，服务端 fetch 上游 `/s/:id` 拿状态码返回 `{ id, status, checkedAt }`。现有 `/api/share/health` 是整体探活（fetch `/todos`），不能复用。
  - 实现位置：`server/api/share/status/[id].get.ts` + `server/utils/shareProxy.ts` 加 `probeShareStatus(id)`
  - 客户端调用：`src/lib/share/api.ts` 加 `fetchShareStatus(id)`，类型 `{ status: number | null, checkedAt: number, error: string | null }`
- **鱼眼性能**：用 CSS `transform` 模拟而非 SVG filter，避免每帧重绘。
- **长按 revoke**：用 `pointerdown` + `setTimeout(500ms)` + `pointerup` 取消的简单实现，不引入新依赖。
- **频道号**：可以从 `share.id` 哈希出来一个两位数字，纯装饰，不重要。

## 验收标准

- 多张已发布 share 时，share 页显示磁吸网格，每格 mac chrome + CRT 屏 + status code。
- 三色灯 hover 有放大 + tooltip，红色长按 + 弹窗才会真正 revoke。
- 视口缩放时网格列数自动变化，无 layout 跳动。
- 全部颜色走主题 token，亮/暗模式都好看。
- 视口外的 tile 不发起 status 请求；滚动到视口内才探测。
- 不再出现硬编码 cyan/amber RGBA。
