# 人间有信代码规范

## Python

- 缩进用 4 个空格。函数和变量用 `snake_case`，类用 `PascalCase`，模块级常量用 `UPPER_SNAKE_CASE`。
- 本地版使用 Python 标准库。联系人校验、存储和 Excel 读写集中在 `app.py` 对应的逻辑中，HTTP 请求处理复用这些逻辑。
- 修改存储或导入时，覆盖旧联系人格式、异常文件和导入失败时现有数据的保留行为。

## HTML、CSS 和 JavaScript

- 新增代码沿用相邻文件的缩进。JavaScript 函数和变量用 `camelCase`，CSS 类名用 `kebab-case`。交互控件要有可理解的名称，支持键盘操作。
- 在 `static/` 修改源文件。在线静态版从相同源文件构建，生成的 `dist/` 不提交。
- 两个运行模式共享联系人字段和 Excel 表头。修改数据结构时检查两种模式，电话号码保留为文本。

## Git 协作与验收

- 以共享仓库的 `main` 为基准。成员用自己的 Git 身份在功能分支提交，提交信息使用 `feat:`、`fix:`、`docs:` 或 `test:` 描述实际改动。
- 功能完成后发起 Pull Request，写明改动和验证结果，由队友检查后合并。使用虚构联系人测试，真实通讯录和真实导出文件留在本地。
- 合并前运行 `python3 -m unittest discover -s tests -v`。涉及界面或 Excel 的改动，实际跑一次收藏筛选、多条联系方式和 `.xlsx` 导出后再导入。
