# 人间有信 | 设计参考清单
整理日期：2026-11-16。以下为核对到的公开页面；不是照搬付费提示词。

## 推荐优先级 P0：与通讯录功能直接关联
| 模块 | 具体参考 | URL | 借鉴方式 |
|---|---|---|---|
| 收藏 | React Bits · Pulse Heart | https://www.reactbits.dev/micro/pulse-heart | 真正保存成功后，小幅缩放/填色/回弹 |
| 全部/星标切换 | React Bits · Rubber Segment | https://www.reactbits.dev/micro/rubber-segment | 胶囊背景平滑移动，维持清晰选中态 |
| 联系人列表 | React Bits · Animated List | https://www.reactbits.dev/components/animated-list | 新增/筛选/排序时短暂动画；搜索按键不重复播放所有行 |
| 联系人详情 | Aceternity · Expandable Card | https://ui.aceternity.com/components/expandable-card | 改成桌面侧边抽屉；保留原始列表上下文 |
| 新增/编辑 | Aceternity · Animated Modal | https://ui.aceternity.com/components/animated-modal | 进入退出动画；必须补齐焦点、Esc、取消未保存提示 |
| 搜索 | Aceternity · Gooey Input | https://ui.aceternity.com/components/gooey-input | 柔和聚焦及扩展，保留中文输入法与即时搜索 |
| Excel 导入 | Aceternity · File Upload | https://ui.aceternity.com/components/file-upload | 文件选择/拖拽 UI；Excel 校验解析写入仍复用真实逻辑 |
| 保存/导出 | Aceternity · Stateful Button | https://ui.aceternity.com/components/stateful-button | idle/loading/success/error 状态对应真实操作 |
| 轻量收藏备选 | Uiverse · Like Toggle | https://uiverse.io/icochran10/breezy-impala-63 | 原生 CSS/Tailwind 方案，注意 MIT 署名 |
| 搜索备选 | Uiverse · Command Palette Input | https://uiverse.io/uiverse-astronaut/orange-starfish-84 | 搜索图标、聚焦边框、可选键盘提示 |

## P1：视觉氛围与过渡
| 模块 | 具体参考 | URL | 借鉴方式 |
|---|---|---|---|
| 欢迎区背景 | React Bits · Aurora | https://www.reactbits.dev/backgrounds/aurora | 只在首屏局部用暖金+鼠尾草柔光；低性能回退静态渐变 |
| 纹理背景 | Aceternity · Grid and Dot Backgrounds | https://ui.aceternity.com/components/grid-and-dot-backgrounds | 非干扰性的低对比点网格 |
| 纸张肌理 | React Bits · Noise | https://www.reactbits.dev/animations/noise | 微弱噪声；优先静态 CSS，而非全屏高成本动画 |
| 首屏入场 | React Bits · Fade Content | https://www.reactbits.dev/animations/fade-content | 标题、统计、工具栏柔和渐入 |
| 数量更新 | React Bits · Counter | https://www.reactbits.dev/components/counter | 真正数据变化时数字短促过渡 |
| 整体结构 | MotionSites · Modern HR Dashboard | https://motionsites.org/zh/prompts/modern-hr-dashboard | 仅参考导航/头部/统计/主内容的层级，不引入 HR 功能 |
| 按钮细节 | MotionSites · Interactive Hover Button | https://motionsites.org/zh/prompts/user-magicui-interactive-hover-button | 新建联系人主 CTA 小幅 hover |

## P2：动效编排及视频灵感
| 类型 | 具体参考 | URL | 限制 |
|---|---|---|---|
| 时间轴 | Anime.js · Timeline | https://animejs.com/documentation/timeline/ | 只在需要复杂顺序动画且当前无 Motion 时考虑 |
| 错峰进入 | Anime.js · stagger() | https://animejs.com/documentation/utilities/stagger | 最多首屏 8 项，且不影响输入 |
| 生命周期 | Anime.js · Scope | https://animejs.com/documentation/scope/ | 按组件释放动画、减少动效 |
| 视频节奏 | Showreel · UI/UX Motion | https://showreel.design/category/uiux-motion/ | 直接读取返回 403，仅作人工查看链接 |
| 视频灵感 | Showreel · Clay Showreel 2023 | https://showreel.design/videos/clay-showreel-2023/ | 仅已核实页面索引；未亲自观看视频细节 |
| 视频灵感 | Showreel · Tubik Studio Showreel 2025 | https://showreel.design/videos/tubik-studio-showreel-2025/ | 仅已核实页面索引；未亲自观看视频细节 |

## 不建议
不要为通讯录复制完整的 SaaS 营销着陆页、两台手机设备样机展示页、深色霓虹、全屏 3D/液态玻璃、长时间粒子背景、自动滚动全屏展示。MotionSites 某些公开提示词只是屏幕 mockup，完整版需解锁，不要假称拿到。

## 许可和适配
React Bits 授权须检查 MIT + Commons Clause 条件；Uiverse 特定作品标注 MIT；Aceternity 以拟采用组件对应许可证为准。React/非 React 先审计框架，禁止仅为复制演示而迁移技术栈。
