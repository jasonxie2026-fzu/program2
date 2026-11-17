# 人间有信｜修改后版

> 本地项目版本为**修改后版**，课程分工对应 `jasonxie2026-fzu`。源版本 `abe3a38`。
>
> [最终公开版通讯录](https://joyful-centaur-da2325.netlify.app/) · [最终公开版展示页](https://joyful-centaur-da2325.netlify.app/showcase.html) · [下载正式版 v1.0.0](https://github.com/jasonxie2026-fzu/program2/releases/tag/v1.0.0)
>
> [作业要求](https://bbs.csdn.net/topics/620593436) · [课程 GitHub 仓库](https://github.com/jasonxie2026-fzu/program2)

在修改前版上统一星标图案与动画。通讯录和展示页共同使用 `static/motion.css`，原生详情抽屉保留键盘关闭和焦点恢复。

「把重要的人，好好留在身边。」这个通讯录支持联系人管理、星标、搜索、多种联系方式和 Excel 导入导出。Python 版将数据保存在本机的 `data/contacts.json`，在线版将数据保存在当前浏览器。

## 运行

需要 Python 3.10 或以上版本，不需安装额外 Python 包。

```bash
python3 app.py
```

浏览器访问 `http://127.0.0.1:8765`。如需更换端口，设置 `ADDRESSBOOK_PORT`。按 Ctrl+C 停止本地服务。首次使用或升级前请备份 `data/contacts.json`。

## 联系人和联系方式

每位联系人有稳定 ID、姓名、公司、备注、星标和多个联系方式。每种联系方式可设类型、标签和值，支持电话、邮箱、社交账号、地址和其他。旧版保存的 `phones`、`emails`、`address` 字段会按原值读入；首次编辑保存时保留旧值并附上新结构，不会清空通讯录。

## Excel

- 导出为 `.xlsx`，每个人一行，姓名/星标/公司/备注为基础列。
- 每个电话、邮箱、社交方式、地址及标签单独列出；不把多项信息挤进一个单元格。
- 导入先解析并显示联系人预览，用户确认后一次性追加；重复联系人不会自动去重，也不会覆盖已有记录。
- 继续读取旧版七列模板（姓名、电话、邮箱、公司、地址、备注、收藏）；旧模板内以换行或分号分隔的多个号码/邮箱会分别保留。
- 支持 `.xlsx`，不支持 `.xls`；文件大小上限为 5 MB。电话号码应在 Excel 中以文本储存，以避免 Excel 自身的数字格式丢失前导零。
- 导出把用户值写为 XML inline string，公式样式文本按字串保存。

## 在线版

公开托管版沿用同一界面。联系人数据只保存在当前浏览器的 `localStorage`，不上传到服务器，也不会在不同设备间同步。浏览器存储被清除时数据也会删除，请定期导出 Excel 备份。部署静态资源可运行 `python3 scripts/build_static.py` 生成 `dist/`。

最终网址：[人间有信 · 联系人](https://joyful-centaur-da2325.netlify.app/)。展示页使用虚构的联系人，互动状态只留在展示页内存。

## 测试

```bash
python3 -m unittest discover -s tests -v
python3 -m py_compile app.py tests/*.py scripts/build_static.py
```

## 开发协作与课程材料

- [代码规范与 Git 协作](CODE_STANDARDS.md)
- [QA 结果](docs/qa-results.md)和[演示步骤](docs/demo-script.md)
- [本版 CSDN 博客](博客草稿.md)、[个人 PSP](docs/psp-jasonxie2026-fzu.md)
- [提交清单](docs/submission-checklist.md)、[Git 记录及发布说明](docs/course-git.md)、[运行截图与视频](docs/evidence/)
