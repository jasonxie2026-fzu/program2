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
- 公共静态版 XLSX 读写由本项目 `static/xlsx.js` 实现；使用浏览器内建 `Compression/DecompressionStream`、`DOMParser` 和 ZIP/XML 规范，没有 CDN 或第三方脚本。
- `renjian-contacts-polish` 文件只作为交接/实现指引保存在 `.agents/skills/`，不是运行时依赖，不会打入应用资源。

## 网络与联系人隐私

本地 Python 版只绑定 `127.0.0.1`；联系人 JSON 保存在本机。公共静态版将联系人保存在当前浏览器的 `localStorage`，不传到站点服务器；浏览器清除站点数据会删除联系人，需通过 Excel 备份。应用没有第三方分析、字体或数据上传依赖。

## Showcase 展示页

- 新增展示页使用原生 HTML、CSS、JavaScript，基于用户提供的实现资料包原型进行集成，没有新增运行时或构建依赖，也没有引入第三方 UI 组件；因此无新增第三方许可义务。
- Showcase 的内联纹理是 CSS 数据 URI；页面不加载远程字体、图片或脚本。
