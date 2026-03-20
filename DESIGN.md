# Design Language — NEURAL-TODO

## 概念

**Retro-Futurism** — 用 1980 年代 CRT 终端的视觉语言，承载现代交互逻辑。
整个 UI 模拟一台运行中的旧式控制台：深空背景、扫描线、磷光字符、点阵噪点。
操作感是"输入指令"而非"点击按钮"。

---

## 色彩系统

所有颜色通过 CSS 变量统一管理（`--rf-*` 前缀），分为两层：

### 基底
| 变量 | 值 | 用途 |
|------|-----|------|
| `--rf-bg` | `#06080f` | 页面背景（近黑深蓝） |
| `--rf-bg-2` | `#0b0f1c` | 卡片/面板背景 |
| `--rf-text` | `#c0d8f0` | 正文（冷白偏蓝） |
| `--rf-text-dim` | `#5a8aaa` | 次级文字、提示、标签 |
| `--rf-border` | `rgba(0,245,255,0.18)` | 边框（低透明度青色） |
| `--rf-surface` | `rgba(0,245,255,0.03)` | 背景填充（极低透明度） |

### 信号色
每种颜色对应一种语义，不混用：

| 颜色 | 变量 | 语义 |
|------|------|------|
| **Cyan** `#00f5ff` | `--rf-cyan` | 主色调 · 激活状态 · 交互焦点 · 提示符 |
| **Pink** `#ff2d78` | `--rf-pink` | 高亮强调 · 便签主题色之一 |
| **Amber** `#ffb800` | `--rf-amber` | 警告 · 可疑输入（`SUB?`） |
| **Green** `#39ff14` | `--rf-green` | 成功 · 完成状态 |
| **Purple** `#bf5fff` | `--rf-purple` | 优先级标记（`PRI`） |
| **Danger** `#ff3030` | `--rf-danger` | 错误 · 删除操作 · 冲突（`CONFLICT`） |

### 便签主题
便签（StickyNote）有五种颜色主题：`cyan` / `pink` / `amber` / `green` / `purple`，
每种主题包含 `bg`（深色底）、`border`（磷光色）、`glow`（光晕色）、`text`、`dim`、`check` 六个衍生值，
保证各色主题在深色背景下的对比度与发光感一致。

---

## 排版

### 字体
- **Space Mono** — 所有 UI 文字（标签、按钮、提示符、输入框）。等宽字体强化终端感。
- **Manrope** — 正文内容（便签标题、subtask 文字）。无衬线，可读性好。

### 规则
- 所有功能性标签（按钮文字、模式名、列标题）全部 **大写 + 字间距扩宽**（`letter-spacing: 0.1em` 以上）。
- 数值、代码、快捷键一律用 `font-mono`。
- 次级信息（提示、标注）用 `opacity` 降调，不另加颜色，保持色调统一。

---

## 背景层次

页面背景由三层叠加，均为 `position: fixed`，`pointer-events: none`：

1. **深空渐变**（`body::before`）
   三个椭圆形 `radial-gradient`，分别在左上（青色调）、右上（紫色调）、底部（青色调），
   模拟显示器边缘漏光效果。

2. **点阵网格**（`body::after`）
   `32px × 32px` 点阵，中央密集边缘稀疏（`mask-image: radial-gradient`），
   模拟老式 CRT 荧光点。

3. **扫描线**（`.rf-scanlines`）
   `repeating-linear-gradient` 每 4px 一条细线，配合 `animation: scanline-drift` 缓慢向下漂移，
   模拟阴极射线管水平扫描。

---

## 发光效果

磷光感来自 `box-shadow` 和 `text-shadow` 的双层叠加：

```css
/* 典型示例：logo 文字 */
text-shadow: 0 0 12px rgba(0, 245, 255, 0.7);

/* 典型示例：便签边框 */
box-shadow: 0 0 {glow}px {color}, inset 0 0 20px rgba({color}, 0.03);
```

- 常态：低强度光晕（`opacity 0.3–0.5`）
- 悬停/激活：光晕增强，颜色饱和
- `high` 优先级便签：边框光晕持续脉冲动画（`priority-high-pulse`）
- 删除区域：红色高光（`--rf-danger-glow`）

---

## 组件设计规则

### 按钮（`.rf-btn`）
- 外观：`[ label ]` 带方括号（模拟命令行 prompt）
- 边框：1px `--rf-border`，`border-radius: 2px`（极小圆角，接近直角）
- 悬停：边框变青色 + 微弱 glow + 背景微填充

### 便签（StickyNote）
- 深色背景 + 彩色磷光边框 + 低强度内发光
- 内容区：Manrope 正文，方框 checkbox（`[ ]` / `[x]`）
- 优先级：英文标注（`high` 亮色强调 / `normal` 低调 / `low` 低调）
- 日期：`MM/DD/YY` 格式，右下角，次级色

### 输入栏（TodoInput）
固定在底部，分为两种模式：

**ENTRY MODE**（单行）
- `>_` 提示符 + 透明输入框 + `[ exec ]` + `enter` 提示

**BUFFER MODE**（多行展开）
- 三层叠加架构：
  1. **Mirror 层** — 按行染色的文字镜像（colored `<span>`）
  2. **Overlay 层** — 行背景 wash + SVG wavy underline（错误/警告行）+ 右侧 token 标签
  3. **Textarea 层** — `color: transparent`，只显示光标
- Token 颜色语义：
  `TITLE` 白色 · `SUB` 青色 · `PRI` 紫色 · `SUB?` 琥珀色+波浪线 · `CONFLICT` 红色+波浪线

### 上下文菜单（`.rf-context-menu`）
- 深色背景，青色 border，`box-shadow` 双层（浅色 glow + 深色投影）
- 菜单项：全大写 mono，悬停时整行青色高亮
- 危险操作（删除）单独红色，悬停红色背景

### 边缘手势提示（Canvas hints）
四条边各一个文字标签，旋转方向与手势方向对应：
- 顶 `↑ ARCHIVE` / 底 `↓ DELETE` / 右 `→ REMIND` / 左 `← FOLDER`
- 字号极小，低透明度，不干扰主内容

---

## 交互反馈

| 场景 | 反馈方式 |
|------|---------|
| 便签拖拽进区域 | 区域高亮（颜色 + 光晕增强） |
| 便签 hover | 边框亮度提升，`z-index` 提升 |
| 按钮 hover | 边框 + 文字变青色 + glow |
| 删除区域激活 | 背景变红色半透明 + 红色光晕 |
| 优先级 high | 边框持续脉冲动画 |
| 提醒倒计时 | 实时秒级更新，`{title} in Xh Xm Xs` |
| 输入校验错误 | 该行红色字体 + SVG wavy 下划线 |
| 输入警告 | 该行琥珀色字体 + SVG wavy 下划线 |

---

## 主题切换

支持 `auto` / `dark` / `light` 三档：

- **Dark**：纯深色，强化所有发光效果
- **Auto**：跟随系统
- **Light**：亮色背景（`#eef2f8`），深色文字，青色变为深青（`#006e8a`），
  所有 `text-shadow` / `box-shadow` neon 效果被抑制，保留版式结构，放弃发光感

---

## 设计原则

1. **终端优先** — 所有交互用打字/命令的隐喻，而不是图形 GUI 隐喻
2. **信号而非装饰** — 颜色只用来传递语义（状态/优先级/警告），不做纯装饰
3. **层次靠透明度** — 次级信息降 opacity，不另加颜色，保持色调统一
4. **极简圆角** — `border-radius: 2px` 或更小，维持硬朗的终端感
5. **动效克制** — 只在状态变化（优先级脉冲、扫描线漂移）时有动效，不做无意义的视觉噪音
