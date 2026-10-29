# 可替换 Provider

## 已运行的内置能力

- `server/product.ts`：公共JSON-LD、公开Shopify Ajax Product JSON、用户导入；尊重网页robots，不尝试绕过登录、验证码或平台限制。
- 公开评论组件适配：只读取商品页公开声明的Okendo subscriber ID和同商品Shopify ID，使用公开storefront reviews端点。返回关联SKU时逐条标为related；不采集姓名或联系方式。API的公共JSON读取不同于HTML页面的robots检查。
- `server/providers.ts::complete`：兼容chat/completions的结构化模型适配。返回值经过Zod校验，业务输出仍需本地时长检查。
- `server/analytics.ts`：JSON/CSV累计快照导入，严格关联脚本和商品，批次校验通过后事务保存。

## 授权数据网关

配置 `DATA_PROVIDER_URL` 指向你有权使用的网关根URL；可用 `DATA_PROVIDER_TOKEN` 设置Bearer。数据源可实现TikTok官方权限接口、Amazon已授权数据、Shopify商家API或合法数据服务。平台授权与字段归一化由网关负责，不能假称未取得的权限。

| POST路径 | 请求 | 响应 |
|---|---|---|
| /product | `{url}` | 符合`productImportSchema`的商品JSON |
| /competitor | `{url}` | 符合`competitorInput`的时间戳镜头/转录对象 |
| /performance | `{productId}` | 符合`performanceRow`的数组 |

所有请求使用公网地址校验、DNS固定、超时、大小限制和凭证跨域跳转拒绝。网页、评论、转录中的文本都视作数据，不能改写系统任务。

## 媒体生产预留接口

- `VideoGenerationProvider.generate({scriptId,shotId,prompt}) → {jobId}`
- `TTSProvider.synthesize({text,language,voice}) → {audioUrl}`
- `AvatarProvider.render({avatarId,audioUrl}) → {videoUrl}`
- `EditingProvider.assemble({scriptId,assets}) → {videoUrl}`

当前没有实现媒体生成服务，没有替用户发布视频。素材任务可手动登记HTTP(S)链接，并标记自有或已授权后设为ready。

## 已知边界

本期自动视频理解使用导入的带时间戳标注/转录或授权网关返回结果；没有安装本地ASR、OCR或视觉模型。本Demo的一条公开视频由抽帧观察得到标注，并非系统凭URL自动看完了视频。市场/人群分析为基于评论的创作假设，实时趋势需要输入新参考或接入授权数据Provider。
