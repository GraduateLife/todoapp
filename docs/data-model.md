# Data Model

## Todo

```ts
interface Todo {
  id: string           // crypto.randomUUID()
  title: string        // 标题文本
  completed: boolean   // 是否完成
  createdAt: number    // Date.now() 时间戳
  attachments: Attachment[]
}
```

## Attachment

```ts
interface Attachment {
  id: string
  type: 'image' | 'voice'
  url: string          // base64 data URL
  name: string         // 文件名
}
```

## 持久化

- 使用 `zustand/middleware` 的 `persist` 中间件
- 存储到 `localStorage`，key 为 `todoai-storage`
- 附件通过 FileReader 转为 base64 data URL 后一并存储
