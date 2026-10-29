import type {ContentAngle, CreatorPersona} from './types';
export const angles:ContentAngle[]=[
{id:'pain',name:'痛点型',structure:'日常阻碍 → 动作解决 → 验证',proof:'一镜展示问题发生及处理动作',hookType:'pain-question'},
{id:'demo',name:'效果展示型',structure:'先给画面 → 操作回放 → 细节验证',proof:'同光线固定机位展示实际结果',hookType:'visual-first'},
{id:'before-after',name:'前后对比型',structure:'起点 → 同条件实测 → 前后并置',proof:'锁定机位和曝光，不修饰结果',hookType:'contrast'},
{id:'review',name:'测评型',structure:'评价标准 → 实测 → 优点与局限',proof:'使用三个可观察标准进行测试',hookType:'skeptic'},
{id:'unboxing',name:'开箱型',structure:'拆封 → 清点 → 首次使用',proof:'俯拍完整开箱和实际清单',hookType:'curiosity'},
{id:'tutorial',name:'教程型',structure:'常见错误 → 分步操作 → 检查点',proof:'按商品说明逐步操作',hookType:'how-to'},
{id:'scenario',name:'场景型',structure:'具体时刻 → 产品介入 → 收尾',proof:'在真实生活场景完成任务',hookType:'pov'},
{id:'story',name:'用户故事型',structure:'选择困境 → 试用过程 → 选择理由',proof:'真实创作者讲述，未用过不得假称长期体验',hookType:'story'},
{id:'value',name:'价格价值型',structure:'购买疑问 → 组成与价格 → 适用条件',proof:'展示当日商品页，避免虚构折扣',hookType:'value'},
{id:'contrarian',name:'反常识型',structure:'质疑习惯 → 解释机制 → 现场验证',proof:'用商品结构说明，不做绝对效果承诺',hookType:'myth'},
{id:'faq',name:'FAQ型',structure:'真实疑问 → 实物回答 → 限制',proof:'说明页与实物并排，无法确认就保留疑问',hookType:'question'},
{id:'challenge',name:'挑战型',structure:'设定任务 → 连续计时 → 如实揭晓',proof:'保留完整原始录像，不承诺预设结果',hookType:'challenge'},
{id:'ugc',name:'UGC口碑型',structure:'生活口吻 → 实际使用 → 个人建议',proof:'真实使用感受；商业合作标明广告',hookType:'relatable'},
];
export const personas:CreatorPersona[]=[
{id:'student',name:'美国大学生',voice:'轻松、短句、价格敏感；避免硬造俚语',wardrobe:'日常T恤',setting:'小空间 / 宿舍',audience:'第一次独立生活的学生',constraints:['不得假装真实购买或赞助关系','不拍摄未经同意的室友']},
{id:'parent',name:'宝妈',voice:'实用、直接、关心操作和收纳',wardrobe:'日常家居服',setting:'家庭公共空间',audience:'需要简化日常任务的家长',constraints:['不推断儿童安全或医疗功效','无需儿童出镜']},
{id:'fitness',name:'健身达人',voice:'精力充沛、强调日常习惯',wardrobe:'普通运动服',setting:'训练后 / 家庭入口',audience:'注重规律与效率的运动人群',constraints:['不虚构健身或健康效果']},
{id:'reviewer',name:'专业测评博主',voice:'克制、先定义标准再演示',wardrobe:'中性色上衣',setting:'桌面测试区',audience:'购买前需要证据的理性用户',constraints:['同时表达局限','实验结果以实际拍摄为准']},
];
export const skills=[
['ProductAnalyzer','商品理解','提取商品字段，记录来源、价格币种和信息缺口'],['ReviewMiner','评论挖掘','方面情感、证据片段、异议和内容机会'],['CompetitorVideoAnalyzer','竞品拆解','分析带时间戳的镜头或转录，沉淀结构规律'],['AudienceProfiler','人群研究','结合评论证据提出市场与人群假设'],['TrendResearcher','趋势研究','从用户导入和授权内容中归纳趋势，不伪称实时热榜'],['HookGenerator','前三秒','把具体矛盾变成可见的开场动作'],['AnglePlanner','角度矩阵','角度 × 人设 × 场景 × 证据形式去重'],['ScriptWriter','口播生产','按语言和时长生成可念的完整稿'],['StoryboardDesigner','逐秒分镜','声音、动作、字幕、转场与材料对应'],['ShotPlanner','拍摄计划','设备、时长、素材依赖和可复用镜头'],['UGCPlanner','创作者模式','人设、道具、表演方式与本地化约束'],['CTAWriter','行动引导','明确下一步，避免编造优惠与稀缺'],['ContentScorer','拍摄评分','七维可解释评分、成本与时长检查'],['PerformanceAnalyzer','数据复盘','同市场同币种的加权指标与DNA归因'],['IterationAgent','下一轮优化','保留探索份额，用观察结果设计实验']
] as const;
export const dimensionLabels:Record<string,string>={hookType:'Hook类型',structure:'内容结构',duration:'时长',shotCount:'镜头数',sellingPoint:'卖点',cta:'CTA',persona:'人设',scene:'场景',angle:'内容角度'};