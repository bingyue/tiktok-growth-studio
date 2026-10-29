# 本地扫描与复用记录

扫描时间：2026-10-06。首先使用 `rg --files` 扫描 `/Users/admin/Documents/Github` 的项目说明、package.json、Agent、TikTok、Product、Script、Video文件。阅读以下项目的相关README与模块后确定使用单进程React + Express + Node SQLite，避免引入多个旧服务。

| 本地项目或技能 | 检查内容 | 本项目采用方式 |
|---|---|---|
| growth-os | README、server/store.ts、server/agents.ts、connectors.ts、package.json | 复用SQLite JSON records、事务、结构化模型调用、来源隔离的实现方式；不复制原数据库 |
| creator-growth-agent | server/network.ts、server/provider.ts、server/store.ts、analytics.ts | 直接改编network.ts的公网地址校验、DNS固定和重定向边界；改编本机存储；Provider模式 |
| location-intelligence-agent | research-agent.ts | 借鉴来源与研究缺口保留，不把辅助请求失败改成假成功 |
| trade-inquiry-agent | lib/http.ts、lib/provider.ts及README | 兼容模型的JSON结构校验、同源写入校验思想 |
| content-flow | README、agents/workflows结构 | 复用Skill与Workflow编排概念；不强依赖其Python、Redis和Celery服务 |
| shop-copilot | README、商品导入和catalog结构 | 区分模拟商品、真实政策、模型/预览能力；不复用虚构SKU |
| out-sea-helper | README、skills/lululemon.ts、工作流目录 | 参考读取失败明确反馈与可替换连接器；本期不用浏览器登录采集 |
| red-plus | README、LLM/image/workflow目录 | 参考结构校验和失败可见的工作流行为，不加载其凭证 |
| adora | TikTok投放产品说明 | 已存在Marketing API投放与素材关联。首期只生产待拍内容，不重复开发投放或发布 |
| docflow / weknora / ragflow | README、知识库与Agent目录扫描 | 可作为未来品牌知识Provider，首期SQLite保存商品证据和Content Pattern足够 |
| ecom-details-image | README、Prompt/Generate能力 | 图片素材Provider扩展方向；当前不重复实现图片生成 |
| social-push / Agent Browser | README、已有浏览器与发布技能目录 | 发布属于后续阶段；不拉起登录态或自动发布 |
| space-video-script技能 | SKILL.md | 口语、逐镜头时长、画面来源、转场、字幕与B-roll契约 |
| ecom-review-mind技能 | SKILL.md、absa.md、aspect-taxonomy.md | 方面情感+原文证据结构；本地只实现可解释关键词基线，不声称模型级全量理解 |
| frontend-design技能 | SKILL.md | 工作台视觉、层级、响应式与可交互组件设计 |

原先使用 `tiktok-content-agent` 目录，发现同工作区另一个任务同时编辑后，将当前实现复制并隔离到 **tiktok-growth-studio**。此后只修改独立目录；保留原目录和其他任务工作。

没有读取或复制其他项目的业务数据库、真实业绩或私有凭证。本项目所有外部能力均有明确适配边界。
