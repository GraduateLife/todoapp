# Agent Platform 愿景设计

## 核心工作流

```
用户写：「学习这篇文章的生词」
        + tag: #vocabulary #english
        + metadata: scraper_api = "https://..."
                    vocab_api = "https://..."
    ↓
AI 读 todo 内容 + tags + metadata
AI 自己决定：调 scraper_api 拿文章 → 调 vocab_api 提取生词
AI 调 delete_todo(id)
AI 调 create_stack([词1, 词2, 词3...]) 或 create_folder + add_cards
    ↓
用户看到：原来的 todo 消失，出现一个生词卡片 stack
```

---

## 设计原则

- **模型无关** — 用户自己填 API key（OpenAI / Gemini / 本地 Ollama），app 不绑定任何一家
- **Todo 卡片 = prompt** — 用户只写人类语言 + 几个 tag
- **用户注册的 API = tools** — 提前在 metadata 里说明每个 API 是干什么的
- **AI = 执行引擎** — 自己决定调用顺序
- **App = 运行时 + UI** — 不参与业务逻辑

---

## Tools 设计

**内置 tools（来自 store actions）：**
```
get_todos()
add_todo(title, tags, metadata)
delete_todo(id)
create_folder(name)
stack_onto(rootId, childId)
add_subtask(todoId, title)
```

**用户注册的 tools（来自 metadata）：**
```
scrape_url(url)        ← 用户填入的 scraper API
extract_vocab(text)    ← 用户填入的词汇 API
任意第三方 API...
```

---

## 用户侧配置格式（草案）

```yaml
# 我的工具箱
scraper:
  url: https://my-scraper.workers.dev
  description: "传入 URL，返回文章正文"

vocab_extractor:
  url: https://api.xxx.com/extract
  description: "传入文章文本，返回生词列表和解释"

# 我的 AI
model: ollama/llama3   # 或 openai/gpt-4o，随便换
```

---

## 本质定位

> 用户的 todo 卡片 = prompt
> 用户注册的 API = tools
> AI = 执行引擎
> App = 运行时 + UI

这不是 Anki，不是 n8n，更准确的描述是：

**以 todo 为载体的个人自动化 + 知识管理工具**

人只负责投喂输入和最终处理，中间的结构化工作全部 AI 做。

---

## 执行环境选项

**网页端 + Cloudflare Workers**
- 脚本部署为 Worker，app 触发 HTTP 调用
- 不需要域名（workers.dev 子域免费）
- 适合轻量 HTTP 类自动化

**桌面端 + Docker**
- Tauri 通过 dockerode 操控容器
- 完整文件系统 + 任意语言
- 适合本地文件处理、重计算任务

两者可以共存，用适配器模式切换。
