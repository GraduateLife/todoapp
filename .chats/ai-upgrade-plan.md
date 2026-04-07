# AI 功能升级计划

> 日期: 2026-04-04
> 状态: 待实施

## 问题

当前 AI 语法修复（`aiFixSyntax`）仅做"给 subtask 行加 `- ` 前缀"的操作，
这和一个简单的正则/脚本没有区别，3 秒延迟反而让体验变差。

## 改造方案：两步走

### 第一步：语法修复 → 纯本地脚本

将 `aiFixSyntax` 替换为纯本地函数 `localFixSyntax`，逻辑：

```
对第 2 行及之后的每一行：
  - 如果已经是 "- " 开头 → 不动
  - 如果是 "-文字"（缺空格）→ 改为 "- 文字"
  - 如果是普通文字 → 加上 "- " 前缀
  - 空行 → 保留
  - 第一行（title）→ 永远不动
```

优点：
- 即时生效，无延迟
- 不依赖 AI provider
- 不消耗 API 额度
- 行为完全可预测

可选：保留 3 秒延迟触发，或改为即时触发（用户停止输入 500ms 后自动修复）。

### 第二步：AI 功能升级为「智能展开」

新增一个用户主动触发的 AI 功能，定位从"修标点"升级为"帮你拆解任务"。

#### 触发方式
- Buffer 底栏增加 `[ ✦ expand ]` 按钮
- 或快捷键（如 Ctrl+E）

#### AI 能力

| 场景 | 用户输入 | AI 输出 |
|------|---------|--------|
| 自然语言拆解 | `周末搬家` | `周末搬家`<br>`- 找搬家公司`<br>`- 打包衣物`<br>`- 通知物业` |
| 模糊意图结构化 | `明天开会要准备ppt还有打印材料别忘了订会议室` | `准备明天的会议!`<br>`- 做PPT`<br>`- 打印材料`<br>`- 订会议室` |
| 智能推断优先级 | `服务器挂了赶紧修` | `修复服务器!`<br>`- 检查日志`<br>`- 重启服务` |
| 补充遗漏步骤 | `部署新版本`<br>`- push代码` | `部署新版本`<br>`- 跑测试`<br>`- push代码`<br>`- 验证线上` |

#### 交互流程
1. 用户在 buffer 中输入内容（可以是一句话或粗略的列表）
2. 点击 `[ ✦ expand ]` 或按快捷键
3. AI 返回结构化结果，替换 buffer 内容
4. 用户可以编辑/调整，满意后 exec
5. 如果不满意可以 `[ retry ]` 重试或 `[ undo ]` 恢复原文

#### Prompt 设计要点
- 第一行永远是 title，不加 `- ` 前缀
- subtask 用 `- ` 前缀
- 优先级通过 title 后缀表示：`!`（高）、`?`（低）
- AI 可以根据语气/紧急程度自动推断优先级
- 保持简洁，每个 subtask 不超过一句话
- 不要过度拆分（3-7 个 subtask 为宜）

## 需要改动的文件

- `src/features/todo/services/aiParse.ts` → 重命名/重写
  - `localFixSyntax()` — 纯本地语法修复
  - `aiExpandTodo()` — AI 智能展开（新增）
- `src/features/todo/components/input-bar/TodoInput.tsx`
  - `useAiSyntaxFix` → 改为 `useLocalSyntaxFix`（去掉 AI 调用）
  - 新增 `useAiExpand` hook（用户触发）
  - 底栏增加 `[ ✦ expand ]` 按钮
- `src/features/todo/components/input-bar/DragHandle.tsx`
  - AI toggle 含义可能需要调整（控制 auto-fix vs expand 可用性）

## 迁移注意事项

- 保留现有的 revert detection 逻辑（用于 AI expand 场景）
- AI expand 的 undo 可以复用 `preFixValue` 机制
- countdown UI 不再需要（本地修复即时生效）
- `isAIAvailable()` 仍用于控制 expand 按钮是否可用
