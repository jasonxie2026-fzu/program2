---
name: renjian-contacts-polish
description: Audit and progressively enhance the existing Chinese "人间有信" contacts/address-book application for a 2026 software-engineering Extreme Programming assignment. Use when Codex is asked to improve the site's frontend visual design, animated background, micro-interactions, responsive UX, favorites, multi-contact methods, Excel import/export, testing, independent `/showcase` product-showcase integration, or submission evidence while preserving the assignment rubric, existing user data, and real contacts functionality.
---

# 人间有信：作业优先的前端升级

目的：先确保老师的评分项和已有数据不被破坏，再打造温暖、克制但丰富的动效体验；**主通讯录不能被纯展示页替代**。如用户要求增加作品展示页，则应将其实现为与真实通讯录隔离的独立路由。

## 开始工作

1. 读取 `references/assignment-rubric.md`、`references/website-audit.md`、`references/acceptance-tests.md`，确认硬约束和证据边界。**先在本地仓库检查代码**，线上网站的文字快照不是交互测试。
2. 运行 `python .agents/skills/renjian-contacts-polish/scripts/repo_probe.py .`（若 Skill 安装在别处，使用实际路径），或手动检查 `package.json`、依赖、数据层、Excel 处理、入口和路由。只输出文件结构/技术信号，不读取个人联系人数据。
3. 先记录 Git 工作区状态、现有构建/测试命令和回归基线；不得覆盖用户未提交的改动，不得无许可删库/强制推送/上线。
4. 如果当前项目不是 React，**不得仅为使用 React Bits/Magic UI/shadcn 迁移框架**。看 `references/github-research.md` 的条件分支；优先 CSS 与当前技术栈。如果是 React 并已装 Tailwind，可按需引入少量高星组件。
5. 先验证：星标联系人可标记、撤销、筛选且刷新持久；单个联系人能持有多个电话/邮箱等方式；Excel 导出一人一行、各字段分列且可重新导入。若基线不满足，先修复功能再做视觉升级。
6. 读取 `references/design-system.md`、`references/motion-spec.md`，逐项升级布局、空状态、联系人卡片、搜索、详情、编辑、表单、导入导出反馈。每一项动效都要有用途、减弱动态模式和低性能退化。
7. 如果要求作品展示页，按 `references/showcase-integration.md` 将随交接包的 HTML 原型适配成独立 `/showcase` 或等价路径。必须隔离示例联系人数据与真实联系人数据；CTA 返回真正通讯录。
8. 按 `references/acceptance-tests.md` 验收，用真实交互或自动化测试证明通过。完成后依 `references/submission.md` 产出作业证据（不伪造提交、PR、发布或测试结果）。

## 强制约束

- 优先级：**功能与数据安全 > 可访问性与性能 > 品牌美感 > 装饰性特效**。评分：星标 25、Excel 25、多方式 10、页面样式 10、博客/工程材料 30；云部署可选加分 15。
- 尊重原网站品牌「人间有信 / 把重要的人，好好留在身边」和中文文案，不盲目做成深色赛博风、粒子爆炸、纯展示 landing page。
- 对于未知功能，标为“待源码核实”；不得宣称已经通过端到端测试。
- 联系人数据默认本地保存，禁止把真实联系人/号码传给效果组件、分析、第三方 CDN 或远程 AI。改数据结构时提供向后兼容迁移、备份、导入导出回归测试。
- `prefers-reduced-motion` 需真正降低动画，不能仅停掉一小部分。移动端不能因动画造成阻塞；不要在长列表常驻大量 canvas/WebGL/blur 动画。
- 需要新增依赖时先说明现有栈、包大小/兼容/许可；从 GitHub 项目**按需借鉴或添加**，不要整体引入 demo。React Bits 为 MIT + Commons Clause，须核对适用情形并保留必要许可声明。
- 未获授权不执行远程仓库 push、Release、PR、提交博客或云部署。为作业整理清单、命令和证据模板，保持用户可审查。

## 实施顺序（不得跳过阶段 0）

**阶段 0 基线审计**：记录技术栈、联系人模型、持久化、Excel 列结构、功能缺口、测试命令、Git 状态；写 `docs/audit-before.md`。不要依据线上 0 联系人页面推断新增、编辑和导入实际可用。

**阶段 1 评分安全**：修复/补齐星标、多联系方式、Excel 往返及持久化；加测试与错误提示。优先参考 `references/excel-contract.md`。

**阶段 2 设计系统**：建立排版、颜色、层级、间距、响应式栅格、交互状态、动画 token，保留品牌。若时间很紧，先做顶部、列表/空态、详情/表单、导入导出弹层四处。

**阶段 3 微交互 + 背景**：先 CSS 静态背景与微交互，再根据性能预算增加 **一个** 克制的背景动效；保留无动画样式、降级逻辑，逐页验证。

**阶段 4 独立展示页**：若用户要求，阅读 `references/showcase-integration.md` 和 `references/ui-reference-catalog.md`，在保持主应用入口不变的前提下将独立原型集成到路由。

**阶段 5 验收与作业证据**：真实测试、截图/录像建议、Git 变更摘要、待用户完成事项。不要为了得分宣称静态托管在任意域名一定符合“云服务器”加分规则，部署后应向老师确认。

## 输出格式

完成后向用户报告：实际改过的文件、功能验证状态（通过/失败/未运行及原因）、截图位置、选用依赖与许可、性能/无障碍检查、剩余风险、Git/Release/PR/博客待办。若只完成一部分也要明确标注，不可只给口头承诺。

更多资料只在需要时读取：
- `references/assignment-rubric.md`：评分细则、流程和截止时间
- `references/website-audit.md`：线上可证实内容与未验证部分
- `references/github-research.md`：高星开源项目选型与使用限制
- `references/design-system.md`：视觉方向、布局和配色
- `references/motion-spec.md`：动效时序、性能和可访问性
- `references/excel-contract.md`：数据模型、导入导出与兼容规则
- `references/acceptance-tests.md`：功能、视觉、性能的验收用例
- `references/submission.md`：课程提交材料和博客结构
- `references/showcase-integration.md`：新增独立展示页、模拟数据隔离和 CTA 验收
- `references/ui-reference-catalog.md`：六大网站具体组件和分场景选型
- `assets/tokens.example.css`：可按现有技术栈改写的设计 token 示范，不能无脑替换全局样式

## Skill collaboration

Read `references/skill-orchestration.md` before invoking external design skills. In particular, `ui-ux-pro-max`, `frontend-design`, `shadcn`, and `magic-ui` are conditionally useful, but none may override this skill's rubric, data model, accessibility, and tests. Identify any additional user-provided screenshot skill from its actual `SKILL.md`; do not guess its name.
