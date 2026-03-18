# 文件夹功能开发复盘

**日期**: 2026-03-18
**功能**: Todo 文件夹系统（从 Overlay 模式重构为 Drawer 模式）

---

## 一、最终实现方案概览

- 主画布过滤：有 `folderId` 的 todo 不再出现在主画布
- 文件夹以左侧 Drawer 形式打开（Framer Motion spring 动画）
- Drawer 内显示紧凑卡片（`FolderTodoCard`），flex-wrap 流式布局
- 卡片支持拖拽排序（Framer Motion `Reorder`）
- 右键菜单：`[ move to main ]` / `[ delete ]`
- 排序顺序持久化于 `folderStore.orderedTodoIds`

---

## 二、开发过程与踩坑

### 阶段 1：第一版 Overlay 方案（已废弃）

**初始思路**：所有 StickyNote 始终挂在同一个 DOM 父节点，文件夹打开时叠加一个视觉 overlay（backdrop + frame），将属于该文件夹的卡片重定位到 grid 布局坐标。

**核心问题**：
- Backdrop 的 `z-index: 90` 高于普通卡片（`z-index: ~10-50`），导致文件夹卡片被遮挡、不可见
- 临时修复：在 `StickyNoteCanvas` 中将文件夹卡片单独渲染在 `<FolderOverlay />` 之后，并注入 `zIndexOverride={200 + todo.zIndex}`

**为什么最终放弃**：用户反馈体验不符合预期——文件夹 todo 应从主画布消失，而不是就地浮在 overlay 上面；且 grid 重定位与自由拖拽逻辑相互干扰。

---

### 阶段 2：重构为 Drawer 方案

**架构变化**：

| 旧方案 | 新方案 |
|--------|--------|
| 所有 todo 始终在画布 DOM 中 | 有 folderId 的 todo 从画布过滤掉 |
| FolderOverlay（固定 backdrop + frame） | FolderDrawer（从左侧滑入的面板） |
| 卡片保持 StickyNote 完整样式 | 新建 FolderTodoCard 紧凑组件 |
| 拖出即可移回主画布 | 仅右键菜单可移回 |

**新增文件**：
- `types.ts` → `Folder` 新增 `orderedTodoIds: string[]`
- `store/folderStore.ts` → 新增 `appendToFolder` / `removeFromFolder` / `reorderTodo` / `setOrderedTodoIds`
- `components/folder/FolderTodoCard.tsx` → 紧凑卡片组件
- `components/folder/FolderDrawer.tsx` → Drawer 主体

**废弃文件**：
- `FolderOverlay.tsx` → 重命名为 `.bak`

---

### 阶段 3：@dnd-kit 与 React 19 的兼容问题

**问题**：引入 `@dnd-kit/core` 的 `useSensor` 导致运行时崩溃：

```
TypeError: Cannot read properties of null (reading 'useMemo')
    at useSensor (chunk-IE5YG2H4.js:256:36)
    at FolderDrawer (FolderDrawer.tsx:39:5)
```

**根因**：`@dnd-kit/core@6.x` 内部使用了旧版 React dispatcher API，与 React 19 的 SSR hydration 机制不兼容。该项目使用 TanStack Start（带 SSR），在 hydration 阶段 `ReactCurrentDispatcher.current` 为 null，导致 `useMemo` 调用失败。

**解决方案**：完全移除 `@dnd-kit`，改用项目已有的 `framer-motion` 的 `Reorder` 组件实现拖拽排序。`Reorder` 是纯客户端动画，不触发上述问题。

**教训**：引入新依赖前需确认与当前 React 版本（尤其是 React 19 + SSR 框架）的兼容性。

---

### 阶段 4：Reorder 排序卡顿问题

**问题**：拖拽排序有明显卡顿，且只在文件夹原本为空、新加入 todo 后才能正常排序。

**根因分析**：

1. **`handleReorder` 逻辑错误**
   旧实现对每个错位的 todo 独立调用 `reorderTodo`，但 `openFolder` 是 closure 旧引用，第一次写 store 后，后续调用仍读旧的 `orderedTodoIds`，导致 index 计算错误、结果乱序。

2. **`Reorder.Group` 的 `values` 直接绑定 Zustand store**
   每次 `onReorder` → 写 store → 触发 React re-render → `displayTodos` 重新计算 → `values` 被外部重置，打断 Framer Motion 内部的拖拽状态，产生视觉抖动。

3. **"空文件夹才能排序"的原因**
   旧 todo 的 `folderId` 已设置，但 `orderedTodoIds` 为空（store 迁移前数据）。migration `useEffect` 异步补齐后，`displayTodos` 才有值，但此时本地 state 已初始化为空数组，无法同步。

**解决方案**：

```
拖拽中（onReorder）  →  只更新 localTodos（本地 state，零 store 写入）
拖拽结束（onDragEnd）→  调用 setOrderedTodoIds(folderId, newIds) 一次性写 store
外部变化（useEffect）→  store → localTodos 单向同步
```

- 新增 `setOrderedTodoIds` action，直接替换整个 `orderedTodoIds` 数组，避免多次 splice 的状态叠加问题
- `useEffect` 依赖 `openFolder?.orderedTodoIds.length` 和 `todos.length`，确保外部删除/移出时本地 state 及时同步

---

## 三、Vite 模块缓存陷阱

移除 `@dnd-kit` 后，浏览器仍报旧错误。原因：Vite 将 node_modules 依赖预打包为 `chunk-IE5YG2H4.js?v=e849baa5`，这个版本 hash 是编译期固定的。即使源文件已修改，HMR 推送的是新的 FolderDrawer 模块，但浏览器模块缓存里仍持有旧的编译产物，导致 source map 指向新文件行号但实际执行的是旧代码。

**解法**：重启 dev server（`preview_stop` + `preview_start`），清空 Vite 的内存模块图，强制全量重编译。

---

## 四、跨 Store 协调设计

文件夹操作需要同时更新两个独立 Zustand store：

```
setFolder(todoId, folderId)      → todoStore：设置 todo.folderId
appendToFolder(folderId, todoId) → folderStore：追加到 orderedTodoIds
```

选择在组件层（`StickyNoteCanvas.handleFolderConfirm`、`FolderDrawer.handleMoveToMain`）显式调用两个 action，而不是在 store 内部耦合。理由：保持 store 单一职责，调用链路清晰，便于调试。

---

## 五、总结

| 问题 | 根因 | 解法 |
|------|------|------|
| Overlay 卡片不可见 | z-index 层叠顺序错误 | 改为 Drawer 架构，彻底隔离 |
| @dnd-kit 崩溃 | React 19 SSR 不兼容 | 换用 framer-motion Reorder |
| 排序卡顿/错乱 | store 直接驱动动画 + 多次写入旧引用 | 本地 state 驱动动画，dragEnd 后单次写 store |
| Vite 缓存残留 | 预打包 chunk 版本 hash 固定 | 重启 dev server |
