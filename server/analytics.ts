import {z} from 'zod';
import {performanceRow} from './schemas';
import {Store,base,now,AppError} from './store';
import type {PublishedVideo,PerformanceMetric,Analysis,ContentDNA,DNAInsight,SourceKind} from '../shared/types';
const round=(n:number)=>Math.round(n*10000)/10000;
// RFC4180-style reader. No spreadsheet formula is ever evaluated.
export function parseCSV(text:string):Record<string,string>[] {const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c;}
 if(quoted)throw new AppError('CSV 引号未闭合');if(cell||row.length){row.push(cell);rows.push(row)}const header=rows.shift()?.map(h=>h.trim().replace(/^\uFEFF/,''));if(!header?.length)throw new AppError('CSV缺少表头');if(new Set(header).size!==header.length)throw new AppError('CSV表头重复');return rows.map((r,i)=>{if(r.length!==header.length)throw new AppError(`CSV 第${i+2}行列数不一致`);return Object.fromEntries(header.map((h,j)=>[h,r[j]]))});}
export function csvRows(text:string){return parseCSV(text).map(r=>{const out:Record<string,unknown>={...r};for(const key of ['views','retention3s','completionRate','avgWatchSeconds','clicks','ctr','orders','cvr','gmv','spend','roas']){const v=r[key]?.trim();out[key]=!v?null:v.endsWith('%')?Number(v.slice(0,-1))/100:Number(v)}if(r.dna)try{out.dna=JSON.parse(r.dna)}catch{throw new AppError('CSV dna列必须是JSON')};return out;});}
export function importPerformance(store:Store,productId:string,rows:unknown[],source:SourceKind){
 store.require('products',productId);if(!rows.length||rows.length>5000)throw new AppError('每批需要1到5000行表现数据');
 const parsed=z.array(performanceRow).parse(rows);if(new Set(parsed.map(r=>r.externalId)).size!==parsed.length)throw new AppError('导入批次中 externalId 重复');
 const existing=store.list('videos').filter(v=>v.productId===productId&&v.source===source);
 const output:PublishedVideo[]=parsed.map(d=>{const script=d.scriptId?store.require('scripts',d.scriptId):undefined;if(script&&script.productId!==productId)throw new AppError('脚本不属于当前商品');if(script&&(script.market!==d.market||script.language!==d.language))throw new AppError('历史视频的市场或语言与脚本不一致');const dna=script?.dna||d.dna;if(!dna)throw new AppError('未关联脚本时必须提供完整Content DNA');
 const derive=(given:number|null,a:number|null,b:number|null,label:string)=>{if(a===null||b===null)return given;if(b===0){if(a>0)throw new AppError(`${label} 分母为0而分子大于0`);return null;}const n=a/b;if(given!==null&&Math.abs(n-given)>Math.max(.0005,.015*n))throw new AppError(`${label} 与计数不一致，请统一数据口径`);return round(n)};
 const metrics:PerformanceMetric={views:d.views,retention3s:d.retention3s,completionRate:d.completionRate,avgWatchSeconds:d.avgWatchSeconds,clicks:d.clicks,ctr:derive(d.ctr,d.clicks,d.views,'CTR'),orders:d.orders,cvr:derive(d.cvr,d.orders,d.clicks,'CVR'),gmv:d.gmv,spend:d.spend,roas:d.spend===0?null:derive(d.roas,d.gmv,d.spend,'ROAS')};
 return {...base(),...existing.find(v=>v.externalId===d.externalId),productId,externalId:d.externalId,scriptId:d.scriptId,publishedAt:d.publishedAt,url:d.url,currency:d.currency,market:d.market,language:d.language,source,metrics,dna};});
 store.transaction(()=>output.forEach(v=>store.put('videos',v)));return {imported:output.length,updated:output.filter(v=>existing.some(e=>e.id===v.id)).length};
}
function totals(videos:PublishedVideo[]):PerformanceMetric{
 const sum=(k:keyof PerformanceMetric)=>{const rows=videos.filter(v=>v.metrics[k]!==null);return rows.length?round(rows.reduce((n,v)=>n+v.metrics[k]!,0)):null};
 const weighted=(k:'retention3s'|'completionRate'|'avgWatchSeconds')=>{const rows=videos.filter(v=>v.metrics[k]!==null),denom=rows.reduce((n,v)=>n+v.metrics.views,0);return denom?round(rows.reduce((n,v)=>n+v.metrics[k]!*v.metrics.views,0)/denom):null};
 const rate=(a:'clicks'|'orders'|'gmv',b:'views'|'clicks'|'spend')=>{const rows=videos.filter(v=>v.metrics[a]!==null&&v.metrics[b]!==null),denom=rows.reduce((n,v)=>n+v.metrics[b]!,0);return denom?round(rows.reduce((n,v)=>n+v.metrics[a]!,0)/denom):null};
 return {views:sum('views')||0,retention3s:weighted('retention3s'),completionRate:weighted('completionRate'),avgWatchSeconds:weighted('avgWatchSeconds'),clicks:sum('clicks'),ctr:rate('clicks','views'),orders:sum('orders'),cvr:rate('orders','clicks'),gmv:sum('gmv'),spend:sum('spend'),roas:rate('gmv','spend')};
}
export function analyzePerformance(store:Store,productId:string,cohort:{source:SourceKind;market:string;language:string;currency:string;window?:number}):Analysis{
 const videos=store.list('videos').filter(v=>v.productId===productId&&v.source===cohort.source&&v.market===cohort.market&&v.language===cohort.language&&v.currency===cohort.currency).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,cohort.window||30);
 if(!videos.length)throw new AppError('该来源、市场、语言和币种下没有视频数据');const eligible=videos.filter(v=>v.metrics.gmv!==null&&v.metrics.views>=100);const denom=eligible.reduce((n,v)=>n+v.metrics.views,0),baseline=denom?eligible.reduce((n,v)=>n+v.metrics.gmv!,0)/denom*1000:0;
 const dimensions:(keyof ContentDNA)[]=['hookType','structure','duration','shotCount','sellingPoint','cta','persona','scene','angle'];const insights:DNAInsight[]=[];
 for(const dimension of dimensions){const groups=new Map<string,PublishedVideo[]>();for(const v of eligible){const key=String(v.dna[dimension]);groups.set(key,[...(groups.get(key)||[]),v])}if(groups.size<2)continue;
 for(const [value,rows]of groups){if(rows.length<3)continue;const views=rows.reduce((n,v)=>n+v.metrics.views,0),gmv=rows.reduce((n,v)=>n+v.metrics.gmv!,0);const raw=views?gmv/views*1000:0;const smoothed=(gmv+baseline*2)/(views+2000)*1000;const lift=baseline?smoothed/baseline-1:0;
 insights.push({dimension,value,videos:rows.length,views,gmv:round(gmv),gmvPer1k:round(raw),baseline:round(baseline),lift:round(lift),confidence:rows.length>=5&&views>=10000?'directional':'low',recommendation:lift>0?'下轮优先测试，保留对照与探索样本':'降低占比，检查流量来源和素材差异'});}}
 const warnings=['DNA 是观察性关联，不代表因果或保证收益；受投流、发布时间和选样影响','千次播放GMV按播放加权；用2000播放的总体基线平滑小样本；每组至少3条','CTR=商品点击/播放；CVR=订单/商品点击；ROAS=GMV/广告花费；未知项不按0计入'];
 if(cohort.source==='synthetic')warnings.unshift('当前使用模拟数据，只验证迭代逻辑，不是品牌真实爆款规律');if(eligible.length<videos.length)warnings.push(`${videos.length-eligible.length} 条因GMV缺失或播放少于100未参与DNA学习`);if(!insights.length)warnings.push('样本不足或标签没有对照变化，暂不形成优胜规律');
 return {...base(),productId,...cohort,window:cohort.window||30,videoIds:videos.map(v=>v.id),totals:totals(videos),insights:insights.sort((a,b)=>b.lift-a.lift),warnings,generatedAt:now()};
}
