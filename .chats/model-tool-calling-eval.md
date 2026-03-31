# 模型 Tool Calling 能力评估

## 现成 Benchmark

| Benchmark | 测什么 |
|-----------|--------|
| **Berkeley Function-Calling Leaderboard (BFCL)** | 最权威，专门测 function calling 准确率，持续更新排行榜 |
| **ToolBench** | 复杂多步工具调用 |
| **τ-bench** | 真实场景下的 agent tool use |

BFCL 排行榜：`gorilla.cs.berkeley.edu/leaderboard`

---

## 自己写测试集（更实用）

通用 benchmark 不能完全代表特定场景，建议针对自己的 tools 写 10-20 个用例：

```
测试用例 1：
  input: "学习这篇文章的生词 https://..."
  expected_tools_called: [scrape_url, extract_vocab, delete_todo, add_todo x N]

测试用例 2：
  input: "把完成的 todo 全部归档"
  expected_tools_called: [get_todos, archive_todo x N]
```

**评分维度：**
- 调了正确的 tool ✓
- 参数传对了 ✓
- 调用顺序对了 ✓
- 没有幻觉出不存在的 tool ✓

---

## 各模型级别经验结论

| 模型级别 | Tool Calling 稳定性 |
|---------|-------------------|
| GPT-4o / Claude 3.5+ / Gemini 1.5 Pro | 稳，多步推理也行 |
| GPT-4o-mini / Gemini Flash | 简单场景稳，复杂多步会出错 |
| 本地 70B（Llama3、Qwen2.5）| 大部分场景可用 |
| 本地 7-14B | 简单单步尚可，多步不稳定 |

---

## 针对本项目的场景判断

该 app 的典型 agent 任务属于**中等复杂度**：
- 读 todo 内容 → 多步调外部 API → 写回结果
- 需要理解 tag / metadata 语义
- 需要正确组合多个 tools

**结论：**
- 70B 本地模型基本够用
- 7-14B 小模型多步场景不稳定，不建议作为默认选项
- 云端模型（GPT-4o / Gemini Pro 级别）最稳定
