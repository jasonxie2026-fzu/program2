# 依赖与许可清单

## 运行时

| 依赖 | 版本 | 用途 | 许可 |
|---|---|---|---|
| Python 标准库 | Python 3.10+；本次验证 3.13.15 | HTTP 服务、JSON、ZIP/XML `.xlsx` 处理 | 随 Python 发行版的 PSF License；未额外安装包 |
| 原生 HTML/CSS/JavaScript | 浏览器内建 | 页面与交互 | 无额外包 |

## UI 资产

- 新增 `static/favicon.svg` 为本项目绘制的简单向量标记，不依赖图标包。
- 外部 Google Fonts 请求已移除，改用系统字体回退；页面不向字体 CDN 发请求。
- 未安装/引用 shadcn/ui、Magic UI、Motion、React Bits、Phosphor 或其他 UI 包。
- `renjian-contacts-polish` 文件只作为交接/实现指引保存在 `.agents/skills/`，不是运行时依赖，不会打入应用资源。

## 网络与联系人隐私

应用只绑定 `127.0.0.1`；联系人 JSON 保存在本机，导入文件由本机服务解析。应用没有第三方分析、字体或数据上传依赖。
