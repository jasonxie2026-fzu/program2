# 人间有信｜本地通讯录

“把重要的人，好好留在身边。”这是一个只在本机运行的联系人管理工具。支持联系人增删改查、星标、搜索、多种联系方式、Excel 批量导入/导出；联系人数据保存在项目的 `data/contacts.json`，不上传到第三方服务。

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

公开托管版沿用同一界面，但不调用本地 Python API；联系人保存在当前浏览器的 `localStorage`，不会上传到服务器或在不同设备间同步。浏览器存储被清除时数据也会删除，请定期导出 Excel 备份。部署静态资源可运行 `python3 scripts/build_static.py` 生成 `dist/`。在线版本在真正发布并验证后，再补充其访问链接。

## 测试

```bash
python3 -m unittest discover -s tests -v
python3 -m py_compile app.py tests/*.py scripts/build_static.py
```

查看真实测试范围和未运行项：[QA 结果](docs/qa-results.md)。课程博客及 PSP 尚需本人补充的材料见 [博客草稿](博客草稿.md) 和 [提交清单](docs/submission-checklist.md)。
