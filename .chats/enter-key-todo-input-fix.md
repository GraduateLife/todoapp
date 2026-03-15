# Todo 输入框按 Enter 无法生成 Todo 的修复记录

## 问题

在 TodoInput 输入框中输入内容后按 **Enter** 键，有时无法生成新的 todo 项。

- **涉及组件**：`TodoInput`（`src/features/todo/components/TodoInput.tsx`）
- **输入框 DOM**：`input.rf-input-field`（placeholder: "type a task and press enter_"）

## 原因

**React 的 state 更新时机导致闭包拿到旧值（stale closure）。**

1. 用户输入最后一个字符后立刻按 Enter 时，会先触发一次 `onChange`（`setValue(新值)`），紧接着同一轮内触发 `onKeyDown(Enter)`，进而调用 `onSubmit()` → `handleSubmit()`。
2. React 的 setState 是异步的，此时上一次渲染的 state 可能尚未更新，`handleSubmit` 闭包里的 `value` 仍是**上一帧的值**（例如空字符串或少最后几个字符）。
3. `TodoInputContainer` 中的 `handleSubmit` 使用 `value.trim()` 判断是否有内容；若读到的是旧空值，就会 `if (!trimmed) return` 直接返回，不会执行 `addTodo`。

因此现象是：Enter 确实触发了提交逻辑，但提交时用到的 `value` 是过期的，被当成空而忽略。

## 解决方法（方案 A：Ref 存最新值）

在父组件 `TodoInputContainer` 中用 **ref 同步保存当前输入**，提交时从 ref 读取，而不是从 state 读取，避免闭包陈旧。

### 修改文件

`src/features/todo/containers/TodoInputContainer.tsx`

### 具体改动

1. **增加 `useRef` 与 `valueRef`**  
   - 用 `valueRef` 保存当前输入内容，与输入框保持同步。

2. **新增 `onChange` 回调**  
   - 在调用 `setValue(nextValue)` 的同时执行 `valueRef.current = nextValue`，保证每次输入后 ref 都是最新值。

3. **修改 `handleSubmit`**  
   - 使用 `valueRef.current.trim()` 替代 `value.trim()` 作为提交内容。  
   - 提交后清空时同时执行 `valueRef.current = ''` 和 `setValue('')`。  
   - `useCallback` 依赖数组中移除 `value`，只保留 `pendingAttachments` 和 `addTodo`。

4. **TodoInput 使用新的 onChange**  
   - 将 `onChange={setValue}` 改为 `onChange={onChange}`。

这样在输入后立即按 Enter 时，`handleSubmit` 会从 `valueRef.current` 读到最新内容，能正确创建 todo，且不改变 `TodoInput` 的组件接口。
