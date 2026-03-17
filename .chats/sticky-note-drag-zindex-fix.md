# StickyNote 无法拖动 & 新建置顶修复记录

## 问题现象

- **StickyNote 完全无法拖动**：鼠标按下/拖拽便签没有任何响应。
- **新建 todo 不在最上层**：新增便签可能被旧便签遮挡（z-index 更低）。

## 根因

### 1) 拖拽事件被父容器禁用

`StickyNote` 使用 `framer-motion` 的 `drag`（`<motion.div drag ...>`）实现拖拽，但其父容器 `StickyNoteCanvas` 设置了 `pointer-events-none`，导致 **整个画布层及其子元素无法接收任何 pointer/mouse 事件**，从而拖拽完全不会触发。

- **涉及文件**：`src/features/todo/containers/StickyNoteCanvas.tsx`

### 2) 新建 todo 的 zIndex 固定，未自动置顶

创建 todo 时默认写死 `zIndex: 10`，因此新增项不一定比现有项更高。

- **涉及文件**：`src/features/todo/store.ts`

## 解决方法

### 1) 恢复画布的 pointer events，让便签可交互

移除 `StickyNoteCanvas` 上的 `pointer-events-none`，让 `StickyNote` 能接收到拖拽所需的指针事件。

- **修改文件**：`src/features/todo/containers/StickyNoteCanvas.tsx`
- **修改点**：把
  - `className="fixed inset-0 overflow-hidden pointer-events-none"`
  - 改为 `className="fixed inset-0 overflow-hidden"`

### 2) 新建 todo 永远置顶（做法 1：在 addTodo 里计算 maxZ）

在 `addTodo` 内从当前 state 计算最大 `zIndex`，并将新建 todo 的 `zIndex` 设置为 `maxZ + 1`，确保每次新增都在最上层。

- **修改文件**：`src/features/todo/store.ts`
- **修改点**：`addTodo` 从 `state.todos` 计算 `maxZ`，再把新建 todo 覆盖为 `{ ...next, zIndex: maxZ + 1 }` 后入数组。

## 备注

输入栏 `.rf-input-bar` 在 `src/styles/globals.css` 中有 `z-index: 50`，高于画布层（画布 `zIndex: 10`），因此恢复 pointer events 后也不会影响底部输入栏点击。

