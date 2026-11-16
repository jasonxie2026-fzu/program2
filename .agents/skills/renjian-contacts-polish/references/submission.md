# 课程提交与交接要求

教师原文：https://bbs.csdn.net/topics/620593436
Deadline: **2026-11-17 23:59**（时区课程确认）。文章需审核，建议提前发布。

## Git 工作流

- 先确认是否已 fork 老师所给仓库、origin/upstream 是否正确；不自动创建不必要的替代仓库。
- 至少三次有意义的提交，建议按真实工作阶段分为：`test: lock rubric critical flows`、`feat: polish contacts interface`、`docs: add evidence and PSP`，但**不能为了凑次数伪造开发历史**。
- 如课程要求，真实创建 Release 和 Pull Request；没有权限则只准备可执行步骤交由用户完成，不声称已创建。
- 在 Markdown 博客放真实项目链接、真实规范文件链接（如 `CODE_STANDARDS.md` 或项目现有文档）和实际截图。可建立 `docs/` 文件夹放证据，记得避免泄露联系人隐私。

## 博客结构推荐

1. 课程说明表：Course for This Assignment、Team Name、Assignment Requirements、Objectives、Other References。
2. 目录与项目地址（GitHub、线上访问、规范、Release、PR）。
3. 需求分析与模块划分：联系人 CRUD、星标、多联系方式、Excel、持久化、UI/动效。
4. 实现方案：数据模型、Excel 表头与无损往返、收藏持久化、动效设计/降级/响应式。
5. 运行和测试：截图、完整视频、回归表（务必写测试环境和真实结论）。
6. Git 提交记录：真实截图与各贡献者 commit 数。
7. 分工与贡献占比（双人总和 100%），协作困难与解决（若组队）。
8. PSP 表：**每位同学单独一张**，计划/实际耗时由本人如实填写。
9. 反思：设计选择、遇到的问题、修复方法、局限与后续工作。

## Codex 最终交付格式

- 已修改：逐文件说明。
- 验收：分 F01–F13/U01–U08 三态（Pass/Fail/Not run）与证据位置。
- 功能/视觉短视频拍摄脚本与截图列表。
- 未完成/外部动作：GitHub push、Release、PR、课程博客、云服务器部署（如无授权）。
- 源码依赖、作者归属与许可表；若引用 React Bits/其他第三方组件，按其许可证保留声明。
