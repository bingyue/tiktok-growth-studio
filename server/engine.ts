import {readFileSync} from 'node:fs';
import {z} from 'zod';
import {Store,base,AppError} from './store';
import {generate,diversity,materialsFor,makeScript,sceneByName} from './generator';
import {generationInput} from './schemas';
import {personas,angles} from '../shared/catalog';
import {analyzePerformance,importPerformance} from './analytics';
import {analyzeCompetitor} from './competitors';
import {fetchProduct,DEMO_URL,mineReviews} from './product';
import {providerStatus} from './providers';
import type {Batch,Job,Script,Workspace,Analysis,Product,Experiment} from '../shared/types';
export class Engine {
 constructor(public store:Store){}
 job(productId:string,kind:string,run:(progress:(stage:string,n:number)=>void)=>Promise<string>):Job{
  if(this.store.list('jobs').some(j=>j.productId===productId&&j.status==='running'))throw new AppError('已有任务运行中，请等待完成',409);
  const job:Job={...base(),productId,kind,status:'running',progress:0,stage:'任务已创建',error:'',resultId:''};this.store.put('jobs',job);
  setImmediate(async()=>{try{const id=await run((stage,progress)=>{job.stage=stage;job.progress=progress;this.store.put('jobs',job)});this.store.put('jobs',{...job,status:'completed',progress:100,stage:'完成',resultId:id})}catch(e){this.store.put('jobs',{...job,status:'failed',stage:'执行失败',error:(e as Error).message})}});return job;
 }
 async batch(productId:string,input:unknown,progress?:(stage:string,n:number)=>void):Promise<Batch>{
  const o=generationInput.parse(input),p=this.store.require('products',productId),existing=this.store.list('scripts').filter(x=>x.productId===productId),batches=this.store.list('batches').filter(x=>x.productId===productId);const analysis=o.analysisId?this.store.require('analyses',o.analysisId):undefined;
  if(analysis&&(analysis.productId!==productId||analysis.market!==o.market||analysis.language!==o.language))throw new AppError('复盘与当前商品、市场或语言不匹配');
  if(o.basedOnBatchId&&this.store.require('batches',o.basedOnBatchId).productId!==productId)throw new AppError('上一批次不属于当前商品');
  const batch:Batch={...base(),productId,round:batches.length+1,count:o.count,market:o.market,language:o.language,duration:o.duration,mode:o.mode,topIds:[],analysisId:analysis?.id,basedOnBatchId:o.basedOnBatchId,strategy:analysis?'70% 参考已观察到的高表现标签，30% 探索新组合；结果需要再验证':'平衡13类角度、4类人设与12个具体场景；每条都有实际任务',diversity:{unique:0,angles:0,personas:0,scenarios:0}};
  const scripts=await generate(p,batch.id,o,existing,this.store.list('patterns').filter(x=>x.productId===productId),analysis,n=>progress?.(`ScriptWriter · ${n}/${o.count}`,Math.round(n/o.count*85)));
  batch.topIds=[...scripts].sort((a,b)=>b.score.total-a.score.total).slice(0,20).map(s=>s.id);batch.diversity=diversity(scripts);
  const experiments:Experiment[]=[];if(analysis){for(const insight of analysis.insights.filter(x=>x.lift>0).slice(0,3)){const control=existing.find(s=>analysis.videoIds.some(id=>this.store.get('videos',id)?.scriptId===s.id));experiments.push({...base(),productId,batchId:batch.id,hypothesis:`${insight.dimension}=${insight.value} 与较高千次播放GMV相关；新内容中验证此方向`,variable:insight.dimension,controlScriptId:control?.id||'',treatmentScriptIds:batch.topIds.slice(0,5),primaryMetric:'GMV / 1000 views',guardrail:'相同市场、语言、时段与预算；至少每组3条和10000播放后复盘。当前批次为探索分配，非随机因果实验。',status:'planned',analysisId:analysis.id})}}
  this.store.transaction(()=>{this.store.put('batches',batch);scripts.forEach(s=>this.store.put('scripts',s));materialsFor(scripts).forEach(m=>this.store.put('materials',m));experiments.forEach(e=>this.store.put('experiments',e))});progress?.('ContentScorer · Top20 与素材清单已保存',95);return batch;
 }
 async reframe(productId:string,batchId:string,count:number,personaId:string){
  const previous=this.store.require('batches',batchId);if(previous.productId!==productId)throw new AppError('批次不属于当前商品');const p=this.store.require('products',productId),persona=personas.find(x=>x.id===personaId);if(!persona)throw new AppError('人设不存在');
  const originals=previous.topIds.slice(0,count).map(id=>this.store.require('scripts',id));const b:Batch={...base(),productId,round:this.store.list('batches').filter(x=>x.productId===productId).length+1,count:originals.length,market:previous.market,language:previous.language,duration:previous.duration,mode:'local',topIds:[],basedOnBatchId:previous.id,strategy:`保留Top${count}的角度与场景，改写为${persona.name}人设，保留父脚本关系`,diversity:{unique:0,angles:0,personas:0,scenarios:0}};
  const output=originals.map((s,i)=>({...makeScript(p,b.id,generationInput.parse({market:s.market,language:s.language,duration:s.duration}),angles.find(a=>a.id===s.angleId)!,sceneByName(p,s.scenario),persona,i,[]),parentId:s.id}));b.topIds=output.map(s=>s.id);b.diversity=diversity(output);this.store.transaction(()=>{this.store.put('batches',b);output.forEach(s=>this.store.put('scripts',s));materialsFor(output).forEach(m=>this.store.put('materials',m))});return b;
 }
 workspace(productId?:string):Workspace{const products=this.store.list('products'),product=productId?this.store.get('products',productId):products.at(-1);const list=<K extends 'batches'|'scripts'|'materials'|'patterns'|'competitors'|'videos'|'analyses'|'experiments'|'jobs'>(kind:K)=>this.store.list(kind).filter(x=>x.productId===product?.id||kind==='jobs'&&x.productId==='');return {products,product,batches:list('batches'),scripts:list('scripts'),materials:list('materials'),patterns:list('patterns'),competitors:list('competitors'),videos:list('videos'),analyses:list('analyses'),experiments:list('experiments'),jobs:list('jobs'),reviews:product?mineReviews(product):[],providers:providerStatus()};}
 async demo(live:boolean,progress?:(s:string,n:number)=>void){
  progress?.('ProductAnalyzer · 读取公开商品与评论',5);const p:Product=live?await fetchProduct(DEMO_URL):JSON.parse(readFileSync(new URL('../examples/product-snapshot.json',import.meta.url),'utf8'));Object.assign(p,base());this.store.put('products',p);
  const sample=JSON.parse(readFileSync(new URL('../examples/competitor-annotations.json',import.meta.url),'utf8'));for(const raw of sample){const {video,pattern}=analyzeCompetitor(p.id,raw);this.store.transaction(()=>{this.store.put('competitors',video);this.store.put('patterns',pattern)})}
  progress?.('CompetitorVideoAnalyzer · 解析公开参考与演示标注',15);const first=await this.batch(p.id,{count:100,market:'US',language:'en',duration:30},(s,n)=>progress?.(s,20+Math.round(n*.3)));
  const rows=syntheticPerformance(this.store.list('scripts').filter(s=>s.batchId===first.id),p);importPerformance(this.store,p.id,rows,'synthetic');progress?.('PerformanceAnalyzer · 导入30条模拟表现',55);
  const analysis=analyzePerformance(this.store,p.id,{source:'synthetic',market:'US',language:'en',currency:p.currency,window:30});this.store.put('analyses',analysis);
  await this.batch(p.id,{count:100,market:'US',language:'en',duration:30,analysisId:analysis.id,basedOnBatchId:first.id},(s,n)=>progress?.(s,60+Math.round(n*.35)));progress?.('完成两轮内容与复盘闭环',100);return p.id;
 }
}
export function syntheticPerformance(scripts:Script[],p:Product){return scripts.slice(0,30).map((s,i)=>{const strong=s.personaId==='parent'||s.angleId==='demo'||s.angleId==='pain';const views=6000+i*420,clicks=Math.round(views*(strong?.044:.023)),orders=Math.round(clicks*(strong?.084:.038)),gmv=Math.round(orders*(p.price||35)*100)/100;return {externalId:`DEMO-${s.id}`,scriptId:s.id,publishedAt:new Date(Date.now()-(30-i)*86400000).toISOString(),url:'',currency:p.currency,market:s.market,language:s.language,views,retention3s:strong?.76:.53,completionRate:strong?.48:.29,avgWatchSeconds:strong?19:12,clicks,orders,gmv,spend:170+i*9,dna:s.dna}})}
export function parseCommand(command:string,defaultOptions:{market:string;language:string;duration:number}){
 if(!command.trim()||command.length>1000)throw new AppError('请输入1到1000字的指令');
 const opts:any={...defaultOptions,count:Number(command.replace(/最近\s*\d+\s*条/g,'').match(/(\d+)\s*(?:条|scripts)/i)?.[1]||100)};
 if(/美国|\bUS\b/i.test(command))opts.market='US';if(/英国|\bUK\b/i.test(command))opts.market='UK';if(/德国|\bDE\b/i.test(command))opts.market='DE';if(/日本|\bJP\b/i.test(command))opts.market='JP';
 if(/英文|英语/.test(command))opts.language='en';else if(/中文/.test(command))opts.language='zh';else if(/西班牙|西语/.test(command))opts.language='es';else if(/德语|德国/.test(command))opts.language='de';else if(/日语|日本/.test(command))opts.language='ja';
 const duration=command.match(/(15|30|60)\s*(秒|s\b)/i);if(duration)opts.duration=Number(duration[1]);if(/UGC/i.test(command))opts.ugcOnly=true;
 const personaId=/宝妈|家长/.test(command)?'parent':/大学生/.test(command)?'student':/健身/.test(command)?'fitness':/测评博主/.test(command)?'reviewer':undefined;
 if(/改|rewrite/i.test(command)&&/top\s*\d+/i.test(command)){if(!personaId)throw new AppError('Top改写需要指定人设：宝妈、大学生、健身达人或测评博主');return {kind:'reframe',personaId,count:Math.min(20,Number(command.match(/top\s*(\d+)/i)![1]))};}
 if(personaId)opts.personaId=personaId;
 if(/复盘|最近\s*\d*\s*条|下一批|重新生成/.test(command))return {kind:'iterate',options:generationInput.parse(opts)};
 if(!/生成|做|scripts|create/i.test(command))throw new AppError('支持：生成100条美国脚本、只做15秒UGC、把Top10改成宝妈人设、根据最近30条数据生成下一批');
 if(opts.ugcOnly&&!command.match(/\d+\s*条/))opts.count=20;
 return {kind:'generate',options:generationInput.parse(opts)};
}
