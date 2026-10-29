# 第三方依赖与内容声明

本文件记录项目依赖与参考内容的权利边界，不替代各组件随附的完整许可证，也不修改本项目许可证。

## 直接依赖

以下为发布准备时本机已安装的直接依赖。可重现版本以 package-lock.json 为准；分发依赖或构建产物时，保留各组件要求的许可和版权声明。间接依赖还应查阅各自的软件包。

| 组件 | 版本 | 软件包声明的许可证 | 用途 |
| --- | --- | --- | --- |
| cheerio | 1.2.0 | MIT | 运行依赖 |
| express | 5.2.1 | MIT | 运行依赖 |
| lucide-react | 0.468.0 | ISC | 运行依赖 |
| react | 19.3.0 | MIT | 运行依赖 |
| react-dom | 19.3.0 | MIT | 运行依赖 |
| robots-parser | 3.0.1 | MIT | 运行依赖 |
| zod | 4.6.5 | MIT | 运行依赖 |
| @playwright/test | 1.63.0 | Apache-2.0 | 开发依赖 |
| @types/express | 5.0.6 | MIT | 开发依赖 |
| @types/node | 22.20.5 | MIT | 开发依赖 |
| @types/react | 19.3.0 | MIT | 开发依赖 |
| @types/react-dom | 19.3.0 | MIT | 开发依赖 |
| tsx | 4.23.15 | MIT | 开发依赖 |
| typescript | 5.9.3 | Apache-2.0 | 开发依赖 |
| vite | 7.3.6 | MIT | 开发依赖 |

Lucide 包含源自 Feather 的图标及相应 MIT 声明；详见其软件包中的 LICENSE。Node.js、Google Chrome、字体等外部运行时或资源另遵循各自条款。

## 商品、评论、视频与截图

Demo 引用 Blueland 商品页、商品图片、品牌标识、公开评论和参考视频资料。相关内容属于原权利人，不因本项目代码许可而转让或获得新的商用授权。将这些素材用于广告、再分发或客户项目之前，应自行确认相应使用权。

案例截图用于说明本项目界面与功能，不表示 TikTok、Blueland 或其他第三方的认可、合作或客户背书。模拟业绩不得作为真实客户成绩宣传。

原始评论响应可能带有评论者资料，因此保留在本地取证目录并通过 .gitignore 排除。公开示例采用应用模型整理后的字段。

## 本地模块复用

实现来源和复用方式见 [docs/REUSE.md](https://github.com/bingyue/tiktok-growth-studio/blob/main/docs/REUSE.md)，相关源文件保留已有来源注释。任何第三方原有声明均应继续保留；本文件不授予作者无权授予的第三方权利。
