# REEL LAB 标准案例素材包

**作者：越哥｜全网同名：越哥聊AI。非商业使用允许，无须另行申请；商业使用须事先获得作者明确书面授权。** 详见 [自定义授权协议](LICENSE)。

[打开素材总览](index.html) · [完整使用说明](使用说明.md) · [简洁案例说明](案例说明.md) · [输出示例](输出示例.md) · [多渠道演示文案](演示与内容素材.md)

当前应用运行时可直接访问 http://127.0.0.1:4348/case-assets/ 。也可以离线打开本目录的 index.html；截图和文档都在本地。

## 本次交付

- 21张实际应用截图，覆盖首页、Provider配置、工作流、商品输入与洞察、执行过程、内容矩阵、Top20、口播与分镜、评分、素材、参考拆解、数据导入、复盘、Content DNA和手机竖屏。
- 两轮各100条完整工作包，每轮Top20 Markdown和素材CSV。
- 一份完整使用说明、单条脚本示例与简洁案例介绍。
- 公众号、小红书六页、60秒短视频口播、10分钟课程路线。
- 可重新执行的采集脚本与文档构建脚本。

## 真实数据边界

本次重新读取公开商品与评论。商品为Clean Essentials Kit，100条评论中6条为当前商品。视频参考包含实际品牌标注与模拟结构，业绩为30条模拟样本；不代表品牌合作或真实增长案例。详见 [实际运行记录](outputs/run.json)。

## 截图索引

| 文件 | 画面 | 可直接采用的图注 |
| --- | --- | --- |
| [01-home.png](screenshots/01-home.png) | TikTok 内容作战室首页 | 真实商品研究，两轮内容闭环；首页当前展示第二轮100条与Top20。 |
| [02-configuration.png](screenshots/02-configuration.png) | Provider 配置状态与 Skills | 显示实际本地策略引擎和预留能力状态；此页不展示密钥。 |
| [03-workflow.png](screenshots/03-workflow.png) | 增长工作流与批次沿革 | 六个阶段均展示实际存档，首轮100条、模拟数据复盘、第二轮100条。 |
| [04-product-input.png](screenshots/04-product-input.png) | 商品链接输入 | 示例为 Blueland 官方公开商品链接；可切换用户 JSON 或授权 Provider。 |
| [05-execution.png](screenshots/05-execution.png) | 真实任务创建瞬间 | 真实链接任务已发起，截图记录创建时0%的状态；完成记录见05b。 |
| [05b-execution-result.png](screenshots/05b-execution-result.png) | 真实任务完成记录 | 任务状态、运行时间和任务编号来自后端存档。 |
| [06-product-insights.png](screenshots/06-product-insights.png) | 商品研究与评论证据 | 评论区分当前商品与关联单品，每条洞察可追溯来源。 |
| [07-angle-matrix.png](screenshots/07-angle-matrix.png) | 13种内容角度 × 4种创作者人设 | 首轮100条内容在角度、场景和人设之间分配；单元格可打开脚本。 |
| [07b-generation-options.png](screenshots/07b-generation-options.png) | 批量生成配置 | 数量、15/30/60秒、目标市场、语言、人设与本地/模型模式。 |
| [08-top20.png](screenshots/08-top20.png) | 可拍摄性优先的 Top20 | 从首轮100条中按七维规则评分筛选优先试拍方案。 |
| [09-storyboard.png](screenshots/09-storyboard.png) | 30秒脚本与逐镜头分镜 | 每镜头有时长、口播、画面动作、字幕、B-roll与产品展示方式。 |
| [10-voiceover.png](screenshots/10-voiceover.png) | 完整口播、CTA 与音乐建议 | 可直接试读的英语脚本；上线前需结合实拍结果审稿。 |
| [11-shootability.png](screenshots/11-shootability.png) | 七维可拍摄性评分 | 评分用于安排试拍优先级，不能解读为爆款概率或GMV预测。 |
| [12-materials.png](screenshots/12-materials.png) | 素材工厂与拍摄任务 | 相同镜头需求复用，列出素材缺口、负责人和使用状态。 |
| [13-reference-patterns.png](screenshots/13-reference-patterns.png) | 参考视频结构拆解 | 实际品牌参考标注与模拟竞品结构分开标识；并非已验证爆款。 |
| [14-performance-import.png](screenshots/14-performance-import.png) | 导入历史视频表现 | 30条模拟数据用于验证机制；正式运营改用自有视频数据并选择真实业务数据。 |
| [15-performance.png](screenshots/15-performance.png) | 同口径数据复盘 | 截图明确标注模拟数据；展示播放、3秒留存、GMV、ROAS及Content DNA。 |
| [16-content-dna.png](screenshots/16-content-dna.png) | Content DNA 学习方向 | 高表现标签来自这组模拟样本中的观察关联，待下一轮验证。 |
| [17-round-two.png](screenshots/17-round-two.png) | 两轮产物与迭代依据 | 第二轮关联首轮批次与复盘，保留创作方向调整和探索。 |
| [18-mobile-home.png](screenshots/18-mobile-home.png) | 手机端首页 | 真实响应式界面，适合竖屏演示开场。 |
| [19-mobile-storyboard.png](screenshots/19-mobile-storyboard.png) | 手机端逐镜头分镜 | 竖屏展示脚本执行细节，适合小红书和短视频近景。 |

## 维护

编辑Markdown后运行 npm run case:build。重拍前阅读 [采集说明](采集说明.md)。不要把业务密钥、真实客户私密资料放入本目录；当前目录作为本地案例静态资源提供访问。
