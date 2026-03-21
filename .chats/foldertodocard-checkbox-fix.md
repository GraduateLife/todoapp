# 复盘：FolderTodoCard 标记完成功能修复过程

## 问题描述

`FolderTodoCard` 组件内的方块 checkbox 按钮点击后无法触发 `onToggle`，即无法标记 todo 为完成状态。
同时，标记完成后需要关闭再重新打开 Drawer 才能看到更新后的状态。

---

## 组件结构背景

```
FolderDrawer
└── Reorder.Group           ← framer-motion 拖拽排序容器
    └── Reorder.Item        ← 每个可拖拽的 item
        └── FolderTodoCard
            ├── ↗ eject button
            └── □ checkbox button   ← 点击无效
```

---

## 第一次尝试：React 合成事件 `onPointerDown` + `stopPropagation`

```tsx
<button
  onPointerDown={(e) => e.stopPropagation()}
  onClick={(e) => { e.stopPropagation(); onToggle(todo.id) }}
>
```

**结果：无效。**

**原因分析：**
React 17+ 采用事件代理机制，所有合成事件统一绑定在 root container（`#root`）上。
对于 bubble 阶段的事件，传播顺序是：

```
bubble ↑: button → ... → Reorder.Item（framer 在这里）→ ... → #root（React 在这里处理合成事件）
```

React 的 `onPointerDown` 在 `#root` 处理，比 framer 在 `Reorder.Item` 的原生监听器更晚。
调用 `stopPropagation` 时，framer 早已执行完毕。

---

## 第二次尝试：原生 `addEventListener` 绑在 button 上

```tsx
const checkboxRef = useRef<HTMLButtonElement>(null)

useEffect(() => {
  const stopProp = (e: PointerEvent) => e.stopPropagation()
  checkboxRef.current?.addEventListener('pointerdown', stopProp)
  return () => checkboxRef.current?.removeEventListener('pointerdown', stopProp)
}, [])
```

**结果：依旧无效。**

**原因分析（关键发现）：**
framer-motion 的 `Reorder.Item` 使用的是 **capture 阶段**（从上到下）的原生 `pointerdown` 监听器，
并且在其中调用了 `event.preventDefault()`。

事件传播顺序（capture 优先）：

```
capture ↓: document → ... → Reorder.Item（framer: capture, 调用 preventDefault()）→ ... → button
bubble  ↑: button（我们的原生监听器在这里，但已经太晚了）
```

`preventDefault()` 在 `pointerdown` 上被调用后，浏览器取消了后续的 `click` 事件生成。
我们的原生 bubble 监听器虽然执行了 `stopPropagation`，但那是 bubble 阶段，
framer 的 capture 监听器早在 bubble 开始之前就已经跑完并调用了 `preventDefault`。

---

## 最终解法：两步配合

### 核心逻辑

要阻止 framer 的 capture 监听器，必须在 capture 阶段更早的位置介入。
**React 的 `onPointerDownCapture` 合成事件绑定在 `#root` 上**，而 `#root` 是
`Reorder.Item` 的祖先元素，因此 React 的 capture 事件比 framer 的 capture 事件更早触发。

```
capture ↓: document → #root（React capture 在这里：onPointerDownCapture 触发）
                → Reorder.Item（framer capture，但已被 stopPropagation 阻断，不再执行）
                → button（pointerdown 到不了这里了）
```

### Step 1：在 `FolderDrawer.tsx` 的 card 容器加 `onPointerDownCapture`

```tsx
<div
  className="flex-1 overflow-y-auto px-5 pb-6 pt-2"
  onPointerDownCapture={(e) => {
    if ((e.target as Element).closest('button')) e.stopPropagation()
  }}
>
```

当 `pointerdown` 的 target 是 button 时，在 React root 阶段就调用 `stopPropagation()`，
阻止事件继续向下传播，framer 的 capture 监听器永远不会执行，
因此 framer 不会调用 `preventDefault()`，也不会启动 drag。

### Step 2：在 `FolderTodoCard.tsx` 把 `onClick` 改为 `onPointerUp`

由于 `pointerdown` 在 root 层被拦截，永远不会到达 button 元素本身，
所以浏览器不会生成 `click` 事件（`click` 需要 `pointerdown` + `pointerup` 发生在同一元素上）。

但 `pointerup` 是独立事件，不受 `pointerdown` 的 `stopPropagation` 影响，
会正常传播到 button 元素。

```tsx
<button
  onPointerUp={(e) => { e.stopPropagation(); onToggle(todo.id) }}
>
```

**为什么 `onPointerUp` 不会在拖拽结束时误触发？**
framer-motion 在 drag 开始时调用 `element.setPointerCapture(pointerId)`，
将后续所有 pointer 事件（包括 `pointerup`）重定向到 `Reorder.Item` 元素，
button 不会收到拖拽结束的 `pointerup`，不会误触发。

---

## 附带问题：标记后需重新打开 Drawer 才能看到状态更新

**根本原因：**
`FolderDrawer` 用 `localTodos`（本地状态）驱动 `Reorder` 动画，
同步 `useEffect` 的依赖数组只监听了 `todos.length`：

```tsx
useEffect(() => {
  setLocalTodos(storeTodos)
}, [openFolder?.id, openFolder?.orderedTodoIds.length, todos.length]) // ← 缺少 completed 变化
```

toggle 不改变 `todos.length`，所以 `localTodos` 不会更新。

**修复：** 加入当前 folder 内已完成 todo 数量作为依赖：

```tsx
const folderCompletedCount = openFolder
  ? todos.filter((t) => t.folderId === openFolder.id && !t.archived && t.completed).length
  : 0

useEffect(() => {
  setLocalTodos(storeTodos)
}, [openFolder?.id, openFolder?.orderedTodoIds.length, todos.length, folderCompletedCount])
```

`folderCompletedCount` 在任意 todo 被 toggle 时都会变化，触发同步，实时更新界面。

---

## 总结

| 尝试 | 方案 | 失败原因 |
|------|------|----------|
| 1 | React `onPointerDown` + `stopPropagation` | React 合成事件代理在 root，bubble 阶段比 framer capture 晚 |
| 2 | 原生 `addEventListener` 绑在 button 上 | framer 使用 capture 阶段监听，比 button 的 bubble 监听早 |
| ✓ | `onPointerDownCapture` 在容器 + `onPointerUp` 在 button | React capture 代理在 root，早于 framer 的 capture；`pointerup` 独立事件不受影响 |
