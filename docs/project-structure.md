# Project Structure (Feature-based)

采用 Feature-based 架构，实现 layout / UI / 逻辑 三层分离。

```
src/
├── routes/                        # 路由层（TanStack Start 文件路由）
│   ├── __root.tsx                 # Root layout，挂载 HeroUI Provider
│   └── index.tsx                  # 首页，组合 Layout + Containers
│
├── layouts/                       # 页面骨架
│   └── MainLayout.tsx             # 主布局（header + content area）
│
├── features/                      # 按功能模块组织
│   └── todo/
│       ├── components/            # 纯 UI 组件（只接收 props，不直接用 store）
│       │   ├── TodoItem.tsx       #   单个 todo 项渲染
│       │   ├── TodoList.tsx       #   列表（AnimatePresence 进出场）
│       │   ├── TodoInput.tsx      #   新增输入框
│       │   ├── TodoContextMenu.tsx#   右键菜单（HeroUI Dropdown）
│       │   └── EditableTitle.tsx  #   双击可编辑标题
│       │
│       ├── containers/            # 容器组件（连接 Zustand store -> 纯 UI）
│       │   ├── TodoInputContainer.tsx
│       │   └── TodoListContainer.tsx
│       │
│       ├── animations/            # Framer Motion 动画配置
│       │   ├── shakeAndShatter.ts #   长按抖动 + 粉碎粒子 variants
│       │   └── listAnimations.ts  #   列表项进出场 variants
│       │
│       ├── hooks/                 # 交互逻辑 hooks
│       │   ├── useLongPress.ts    #   长按检测（~800ms 阈值）
│       │   └── useDoubleClick.ts  #   双击检测（300ms 间隔）
│       │
│       ├── store.ts               # Zustand store（CRUD + persist 到 localStorage）
│       └── types.ts               # Todo / Attachment 类型定义
│
├── components/                    # 通用 UI 组件
│   └── Attachment/
│       ├── ImageAttachment.tsx    #   图片选择 + FileReader -> base64
│       └── VoiceAttachment.tsx    #   MediaRecorder 录音 -> base64
│
├── styles/
│   └── globals.css                # Tailwind CSS 入口
│
├── router.tsx                     # Router 配置，导出 getRouter
└── routeTree.gen.ts               # TanStack Router 自动生成（勿手动修改）
```

## 分层职责

| 层          | 职责                          | 示例                                             |
| ----------- | ----------------------------- | ------------------------------------------------ |
| routes/     | 路由定义，页面级组装          | index.tsx 渲染 MainLayout + Containers           |
| layouts/    | 页面骨架，响应式布局          | MainLayout 包含 header + content                 |
| containers/ | 桥接 store 和 UI              | TodoListContainer 读 store，传 props 给 TodoList |
| components/ | 纯展示，只通过 props 接收数据 | TodoItem 渲染 checkbox + title + attachments     |
| hooks/      | 可复用交互逻辑                | useLongPress 返回 pointer 事件处理器             |
| animations/ | Framer Motion variants        | shakeAndShatter 导出抖动/粉碎动画配置            |
| store.ts    | 业务逻辑 + 状态               | addTodo, deleteTodo, toggleTodo, updateTitle     |
