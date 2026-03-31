# Feature Roadmap

## 影响最大的缺口

### 搜索
现在没有任何方式找到一个具体的 todo。notes 一多就完全失控。这是最明显的功能缺失。

### Canvas 导航（缩放/平移）
notes 超过 10 个以后 canvas 就开始拥挤。
- `Ctrl+滚轮` 缩放
- 空格拖拽平移
- minimap（锦上添花）

### Undo/Redo
canvas 类 app 的刚需。用户拖错位置、误删了 note，没有撤销会很沮丧。
Zustand 有现成的 `temporal` middleware 可以接入。

---

## 表达力不足

### Note Body
现在 todo 只有 title，表达力很有限。加一个可展开的 markdown body，让 note 真正变成"便利贴"而不是一行文字。

### Note 之间连线
两个 note 之间可以画一条关系线（依赖、关联）。
这会让 canvas 从"便利贴墙"变成"思维地图"，差异化很强。

---

## 体验打磨

### 键盘快捷键
- `N` 新建
- `/` 搜索
- `Delete` 删除选中
- `Esc` 取消

### 批量操作
框选多个 note，统一移动/删除/归档。canvas 类 app 没有这个很难用。

### 手机端
目前拖拽在触屏上几乎不可用。做一个 list view 作为 mobile fallback，不需要重写组件。

---

## 方向性选择

这个 app 现在处于一个岔路口：

| 方向 | 意味着 |
|------|--------|
| **更好的 todo app** | 搜索、undo、重复任务、日历视图 |
| **canvas 思维工具** | note 连线、zoom/pan、board 模式、block 编辑器 |
| **团队协作** | 实时同步、权限、评论 |

三个方向技术积累可以复用，但产品定位完全不同。现在的设计语言和 stack 结构更接近**思维工具**（Miro/Obsidian Canvas 方向）而不是传统 todo app。
