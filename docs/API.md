# API / 数据契约

本机同源JSON API，默认 `http://127.0.0.1:4348`。源代码 `shared/types.ts` 包含 Product、Audience、ContentAngle、Script、Storyboard、Shot、CreatorPersona、MaterialAsset、PublishedVideo、PerformanceMetric、ContentPattern、Experiment 与 Batch、Analysis、Evidence、Job。

| 方法与路径 | 用途 |
|---|---|
| GET /api/workspace?productId= | 全工作区数据 |
| POST /api/products/research | `{url, provider:"public"或"authorized"}`；返回Job |
| POST /api/products/import | 商品JSON；字段见`productImportSchema` |
| POST /api/products/:id/generate | `{count:100, market:"US", language:"en", duration:30, mode:"local", personaId?, analysisId?, basedOnBatchId?}`；返回Job |
| POST /api/products/:id/command | `{command,batchId?}`；返回Job |
| GET /api/jobs/:id | 状态、阶段、进度、错误、结果ID；服务重启时遗留running任务转为failed |
| POST /api/products/:id/competitors | 标注对象；或`{url,provider:"authorized"}` |
| POST /api/products/:id/performance | `{source:"import"或"synthetic",rows:[...]}`或`{csv:"..."}`；或`provider:"authorized"` |
| POST /api/products/:id/analyze | `{source,market,language,currency,window:30}`；创建Analysis |
| PATCH /api/scripts/:id | `{status:"draft"或"ready"或"filmed"}` |
| PATCH /api/materials/:id | `{status,owner,url,rights}`；ready要求链接与使用权 |
| GET /api/batches/:id/export | `format=json/md/csv/materials`，可`top=20` |
| GET /api/products/:id/image/:index | 仅代理该商品已登记的图片，限制大小与位图类型 |
| POST /api/demo | `{live:true/false}`；真实抓取或来源快照，返回Job |

## 视频指标导入

`externalId`（源平台视频ID）、`scriptId`（本地脚本ID，可为空但需dna）、`publishedAt`（ISO UTC时间）、`currency`（例如USD）、`market`（US）、`language`（en）、`views`（整数）为基础字段。

可选：retention3s、completionRate、avgWatchSeconds、clicks、ctr、orders、cvr、gmv、spend、roas。JSON比例用0–1；CSV也支持`75%`。缺失留空或null。CSV支持引号、逗号、换行；导出防公式注入。

未关联scriptId时提供完整DNA对象：hookType、structure、duration、shotCount、sellingPoint、cta、persona、scene、angle。关联脚本时采用存档的DNA，避免导入者意外改变归因。

示例历史数据见 `docs/demo-output/history-synthetic.json`；**仅模拟数据，导入时source必须synthetic**。把数据替换为真实来源并关联你的脚本ID后使用source=import。

## 口径与迭代

- CTR = 商品点击 / 视频播放；CVR = 订单 / 商品点击；ROAS = GMV / 广告花费。与其他平台定义不一致时，应在网关归一化，不要混算。
- 计数已知时重新计算比率并核对用户提供值。ROAS在花费为0时是null，不表示无穷或0。
- 完播/留存/观看时长按可用样本的播放量加权，缺失行不计入该指标分母。
- GMV、币种、市场、语言和来源分组，最近30条按publishedAt排序；这是“最近30条”，不是最近30天。
- DNA使用有GMV且至少100播放的样本；每标签至少3条，对比整个同组基线；使用2000播放的基线先验做平滑。不同标签的受众、投放和时段可能混杂，结果是方向性关联。
- 下一轮前70%候选参考高表现标签；后30%重新计数做探索，避免平衡器将高表现方向配额抵消。历史完整组合去重；每批优先不重复角度/场景概念。
- 验证计划是待执行的探索方案，不是自动完成的随机A/B实验。
