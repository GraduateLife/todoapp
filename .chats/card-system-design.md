# Card System 设计

## 卡片类型

外框统一大小，type 决定内部渲染和完成行为。

```
type: "note"      → StickyNote（现在的），勾选完成即归档
type: "vocab"     → VocabCard，单词卡，翻面 + 间隔重复
type: "sentence"  → 句子卡，跟读功能
type: "tape"      → TapeCard，音视频，磁带外观
type: "article"   → ArticleCard，文章摘要，可生成子卡片
type: "prompt"    → PromptCard，写作/造句题，AI 批改
```

卡片类型自动决定完成行为，用户不需要选。

---

## 完成方式

| 卡片类型 | 完成行为 |
|---------|---------|
| note | 勾选 → 归档（现在的） |
| vocab / sentence / tape / prompt | 翻面 → 重新排期 |

"完成"在学习卡片里不是终点，是下一个起点。

---

## 循环任务

卡片做完不消失，重置后下次再来。

```
完成 → 翻面显示"下次复习时间" → 时间到了翻回来
```

两种间隔模式：
- **fixed**：固定间隔（每天、每3天、每周）
- **adaptive**：根据掌握程度动态调整，做对间隔拉长，做错缩短（SM-2 算法）

---

## 超时过期

卡片有生命周期，时间到自动失效。

```
限时任务    → 今天不做就过期，变灰/加警告标记
学习卡片    → 过了复习窗口 urgency 升高，边框变红
普通 todo   → 不过期（现在的行为）
```

过期不是删除，是状态变化，自动移入「过期」folder。

---

## 学习卡片完整生命周期

```
VocabCard 创建
  → 第1天出现（新词）
  → 完成（翻面）→ 3天后再来
  → 3天后出现（复习）
  → 完成 → 7天后再来
  → 如果3天内没复习 → urgency 升高，边框变红
  → 如果一直不复习 → 过期，移入「遗忘」folder
```

---

## 数据结构变动

在 `Todo` 类型里新增：

```ts
recurrence?: {
  type: 'fixed' | 'adaptive'
  interval: number        // 下次间隔（天）
  nextDue: number         // 下次到期时间戳
  streak: number          // 连续完成次数
}

expiresAt?: number        // 超时时间戳，null = 永不过期
```

`completed` 语义变化：不再是终态，而是"本轮完成"，触发 `nextDue` 重置。

---

## 听说读写最小卡片集

| 维度 | 卡片类型 |
|------|---------|
| 读 | ArticleCard |
| 词汇 | VocabCard（由 ArticleCard 自动生成）|
| 听 + 说 | TapeCard |
| 写 | PromptCard |

四张卡覆盖备考全维度。最小可行是 VocabCard + PromptCard，覆盖 80% 需求。

---

## 现有功能在学习场景的语义复用

| 现有字段 | 学习场景语义 |
|---------|------------|
| todo.priority | 复习紧迫程度 |
| todo.reminder | 下次复习时间 |
| todo.archived | 真正掌握后归档 |
| todo.subtasks | 同一个词的多种用法 |
| folder | 「待学习」/「复习中」/「已掌握」|
| stack | 同一篇文章的生词打包 |
