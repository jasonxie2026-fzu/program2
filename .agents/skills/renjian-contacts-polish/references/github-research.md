# GitHub 高星项目调查与选用决策

核查时间：2026-11-16。Stars 为查询当日仓库页面展示的近似值，会变化；请 Codex 安装前复核版本、许可和仓库活跃度。项目目录不可直接照抄。项目设计必须服从 `assignment-rubric.md`。

| 库 | Stars (约) | 许可 | 为什么适合 / 不适合 | 建议 |
|---|---:|---|---|---|
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | 128.3k | MIT | 高质量表单、Dialog/Sheet、输入、Toast、空状态；必须先确认 React + Tailwind / registry 兼容 | 若项目现成支持则优先；不为它迁移框架 |
| [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) | 52.0k | **MIT + Commons Clause** | 精细背景、文字特效、micro interactions，适合局部实验；部分效果重（WebGL/Canvas） | React 才能考虑，**仅挑一个轻效果**、审查许可/性能 |
| [motiondivision/motion](https://github.com/motiondivision/motion) | 35.2k | MIT | React/JavaScript 动画；FLIP、重排、弹窗、星标反馈，动效主引擎 | 推荐，若原项目无 React 可用 vanilla JS 版本或 CSS |
| [pmndrs/react-spring](https://github.com/pmndrs/react-spring) | 29.3k | MIT | 物理弹性动画能力强，但与 Motion 功能重叠 | 备选，**不要同时引入两套动画引擎** |
| [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | 23.3k | MIT | Animated Grid Pattern、Blur Fade、Magic Card 等效果；官方有独立 Skill | React + Tailwind + shadcn 项目，按需 1–2 个组件 |
| [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | 17.3k | MIT | 平滑滚动；数据密集页、键盘/焦点/长列表可能与自定义滚动冲突 | 仅展示长页且通过无障碍验证才启用，默认不装 |

官方项目链接和许可：
- Motion: https://github.com/motiondivision/motion (MIT)
- React Bits: https://github.com/DavidHDev/react-bits / https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md (**Commons Clause 限制组件本身的销售/分发**，不是标准纯 MIT)
- shadcn/ui: https://github.com/shadcn-ui/ui / https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md
- Magic UI: https://github.com/magicuidesign/magicui / https://github.com/magicuidesign/magicui/blob/main/skills/magic-ui/SKILL.md
- react-spring: https://github.com/pmndrs/react-spring
- Lenis: https://github.com/darkroomengineering/lenis

## 以现有技术栈为条件选用

**原生 HTML/CSS/JS 或小型 Vue 项目：** 不引入 React 及其组件生态。用 CSS `transition` / `@keyframes` / `View Transitions`（兼容时）和原生 `IntersectionObserver` 实现背景+交互；如果实测很需要复杂布局动画，才研究 Motion 的 vanilla 接口。当前作业截止很近时更稳。

**已有 React 项目：** 优先 Motion（统一动画）、现有组件库；若已是 shadcn/Tailwind，表单和对话框用已有 shadcn 组件。Magic UI 只在 Hero 背景/局部高光使用。React Bits 的动效不要全页面遍地使用，保留静态降级。

**适合的组件类别**：Magic UI `animated-grid-pattern`/`dot-pattern` 作为低对比 Hero 背景（只能选一种）；`blur-fade` 作为空态出现；`magic-card` 作为局部 hover（不用于整张联系人表）。React Bits 的轻量 Background、Micro Interaction 可对照设计，但不优先引重型 WebGL。

**不建议**：粒子整屏喷涌、3D 地球、滚动劫持、炫光按钮套所有 CTA、首屏自动播长序列、全站巨型 hover 放大卡片；这些会干扰联系人任务。

## 可以额外交给 Codex 的官方 Skill（条件触发）

- 本包提供自定义 `$renjian-contacts-polish`，最高优先级，包含评分与视觉审计流程。
- 如果仓库确实使用 shadcn/ui，建议阅读其官方 Skill：https://github.com/shadcn-ui/ui/tree/main/skills/shadcn
- 如果实际添加 Magic UI，建议阅读其官方 Skill：https://github.com/magicuidesign/magicui/tree/main/skills/magic-ui 。其工作流要求先确认 React、Tailwind、shadcn，并优先一个核心组件加一个辅助效果。
- 其他演示项目不需要单独安装 Skill；**工具库不等于 Agent Skill**。从官方仓库/文档借鉴交互，记录归属、版本、许可和实际引用的组件。

推荐组合（仅 React 兼容时）：**Motion + 现有 UI 组件库 + 1 个 Magic UI 背景效果**，而不是六个仓库全部引入。
