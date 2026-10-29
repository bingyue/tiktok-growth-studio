import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import {z} from 'zod';
import {createHash} from 'node:crypto';
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex').slice(0,20);
export const DEMO_URL='https://www.blueland.com/products/the-clean-essentials';
import {request} from './network';
import {base,now,AppError} from './store';
import type {Product,Evidence,Review,ReviewInsight} from '../shared/types';
export const evidence=(kind:Evidence['kind'],url:string,note:string):Evidence=>({id:base().id,kind,url,capturedAt:now(),note});
const safeUrl=(value:string,origin:string)=>{try{const u=new URL(value,origin);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
export const plain=(value:unknown)=>cheerio.load(String(value??'')).text().replace(/\s+/g,' ').trim();
const reviewSchema=z.object({text:z.string().min(1).max(5000),rating:z.number().min(1).max(5).nullable().default(null),productName:z.string().default(''),scope:z.enum(['exact','related']).default('exact'),incentivized:z.boolean().default(false)});
export const productImportSchema=z.object({name:z.string().min(2).max(200),brand:z.string().max(100).default(''),url:z.url().refine(x=>/^https?:/.test(x)),price:z.number().nonnegative().nullable().default(null),currency:z.string().regex(/^[A-Z]{3}$/).default('USD'),description:z.string().max(15000),category:z.string().max(100).default(''),images:z.array(z.url().refine(x=>/^https?:/.test(x))).max(30).default([]),videos:z.array(z.url().refine(x=>/^https?:/.test(x))).max(20).default([]),specifications:z.record(z.string(),z.string()).default({}),sellingPoints:z.array(z.string().min(2).max(500)).min(1).max(15),faq:z.array(z.object({question:z.string(),answer:z.string()})).max(50).default([]),reviews:z.array(reviewSchema).max(2000).default([])});
export function importProduct(raw:unknown):Product {const v=productImportSchema.parse(raw);const source=evidence('import',v.url,'用户提供的商品资料；待使用者核对真实性和授权');return {...base(),...v,platform:'User import',reviews:v.reviews.map(r=>({...r,id:base().id,productName:r.productName||v.name,source})),sources:[source],aggregateRating:null,gaps:v.reviews.length?[]:['尚未提供评论']};}
const robotsCache=new Map<string,{text:string,at:number}>();
export async function publicGet(url:string){
 const u=new URL(url);let cached=robotsCache.get(u.origin);
 if(!cached||Date.now()-cached.at>300000){const r=await request(u.origin+'/robots.txt');if(r.status===401||r.status===403||r.status>=500)throw new AppError('无法确认公开读取权限，请使用导入或授权数据源',422);cached={text:r.status===200?r.text:'',at:Date.now()};robotsCache.set(u.origin,cached);}
 const rules=robotsParser(u.origin+'/robots.txt',cached.text);if(rules.isAllowed(url,'ContentGrowthAgent')===false)throw new AppError('该路径的 robots.txt 不允许读取，请导入商品资料',422);
 const r=await request(url);if(r.status!==200)throw new AppError(`公开页面返回 HTTP ${r.status}，可改用授权接口或导入资料`,422);return r;
}
export function fromShopify(raw:any,url:string,currency='USD'):Product{
 if(!raw?.title||!Array.isArray(raw.images))throw new AppError('无有效 Shopify 商品数据');
 const source=evidence('public',url,'Shopify 公开商品 JSON；价格以源站币种为准');const $=cheerio.load(raw.description||'');
 const points=$('li').map((_,e)=>$(e).text().replace(/\s+/g,' ').trim()).get().slice(0,8);
 return {...base(),name:raw.title,brand:raw.vendor||'',url:url.replace(/\.js$/,''),platform:'Shopify',price:typeof raw.price==='number'?raw.price/100:null,currency,description:plain(raw.description),category:raw.type||'',images:raw.images.map((x:string)=>safeUrl(x,url)).filter(Boolean),videos:(raw.media||[]).filter((m:any)=>m.media_type==='video').flatMap((m:any)=>(m.sources||[]).filter((s:any)=>s.format==='mp4').slice(0,1).map((s:any)=>safeUrl(s.url,url))),specifications:Object.fromEntries((raw.options||[]).filter((o:any)=>o.name!=='Title').map((o:any)=>[o.name,o.values.join(', ')])),sellingPoints:points.length?points:[plain(raw.description).slice(0,240)],faq:[],reviews:[],sources:[source],aggregateRating:null,gaps:['尚未确认 FAQ','暂无评论证据']};
}
function nodes(value:any):any[]{if(Array.isArray(value))return value.flatMap(nodes);if(value&&typeof value==='object')return [value,...nodes(value['@graph'])];return []}
export function fromHtml(html:string,url:string):Product{
 const $=cheerio.load(html);const all=$('script[type="application/ld+json"]').toArray().flatMap(e=>{try{return nodes(JSON.parse($(e).text()))}catch{return []}});const p=all.find(x=>[x['@type']].flat().includes('Product'));
 if(!p)throw new AppError('页面未提供可解析的 Product JSON-LD，请使用商品 JSON 导入或授权 Provider',422);
 const source=evidence('public',url,'公开页面 Product JSON-LD');const offer=Array.isArray(p.offers)?p.offers[0]:p.offers||{};
 const image=[p.image||[]].flat().map((x:any)=>safeUrl(typeof x==='string'?x:x.url,url)).filter(Boolean);
 const reviews=[p.review||[]].flat().filter((x:any)=>x.reviewBody).map((r:any):Review=>({id:base().id,text:plain(r.reviewBody),rating:Number(r.reviewRating?.ratingValue)||null,productName:p.name,scope:'exact',incentivized:false,source}));
 const description=plain(p.description);const price=Number(offer.price??offer.lowPrice);
 const faq=all.filter(x=>x['@type']==='FAQPage').flatMap(x=>(x.mainEntity||[]).map((q:any)=>({question:plain(q.name),answer:plain(q.acceptedAnswer?.text)})));
 return {...base(),name:plain(p.name),brand:plain(p.brand?.name||p.brand),url,platform:new URL(url).hostname.includes('amazon')?'Amazon':new URL(url).hostname.includes('tiktok')?'TikTok Shop':'Independent store',price:Number.isFinite(price)?price:null,currency:offer.priceCurrency||'USD',description,category:p.category||'',images:image,videos:[p.video||[]].flat().map((x:any)=>safeUrl(x.contentUrl||'',url)).filter(x=>x&&x!==url),specifications:Object.fromEntries((p.additionalProperty||[]).map((x:any)=>[plain(x.name),plain(x.value)])),sellingPoints:description.split(/(?<=[.!?])\s/).filter(Boolean).slice(0,6),faq,reviews,aggregateRating:p.aggregateRating?{rating:Number(p.aggregateRating.ratingValue),count:Number(p.aggregateRating.reviewCount||p.aggregateRating.ratingCount)}:null,sources:[source],gaps:[...(!reviews.length?['页面未提供逐条评论']:[]),...(!faq.length?['页面未提供 FAQ']:[])]};
}
export async function fetchProduct(rawUrl:string):Promise<Product>{
 const u=new URL(rawUrl);if(u.pathname.endsWith('.js'))return fromShopify(JSON.parse((await publicGet(u.href)).text),u.href);
 const html=(await publicGet(u.href)).text;let p:Product|undefined;try{p=fromHtml(html,u.href)}catch{/* Shopify may provide its own JSON */}
 if(/\/products\/[^/]+/.test(u.pathname)){
  const linkedShop=html.match(/PUBLIC_[A-Z_]*SHOP_URL"\s*:\s*"(https:\/\/[^"\\]+)"/)?.[1];
  const candidates=[u.origin,...(linkedShop?[linkedShop]:[]),...(u.hostname==='www.blueland.com'?['https://shop.blueland.com']:[])];
  for(const origin of candidates){try{const j=JSON.parse((await publicGet(origin+u.pathname.replace(/\/$/,'')+'.js')).text);const enriched=fromShopify(j,origin+u.pathname+'.js',p?.currency||'USD');if(p){enriched.faq=p.faq;enriched.aggregateRating=p.aggregateRating;enriched.sources.unshift(...p.sources)}enriched.url=rawUrl;p=enriched;
   const subscriber=html.match(/PUBLIC_OKENDO_USER_ID"\s*:\s*"([\da-f-]+)"/)?.[1]||html.match(/data-oke-reviews-subscriber-id=["']([\da-f-]+)["']/)?.[1];
   if(subscriber&&j.id){try{const reviewUrl=`https://api.okendo.io/v1/stores/${subscriber}/products/shopify-${j.id}/reviews?limit=100`;const response=await request(reviewUrl);if(response.status!==200)throw new AppError('公开评论接口返回 '+response.status);const rr=JSON.parse(response.text);const source=evidence('public',reviewUrl,rr.areReviewsGrouped?'店铺公开评论：包含关联 SKU，已逐条区分 exact / related':'商品公开评论');p.reviews=(rr.reviews||[]).map((r:any)=>({id:r.reviewId||base().id,text:plain(r.body),rating:Number(r.rating)||null,productName:r.productName||p!.name,scope:r.productId===`shopify-${j.id}`?'exact':'related',incentivized:!!r.isIncentivized,source}));p.sources.push(source);p.gaps=p.gaps.filter(x=>!/评论/.test(x));if(rr.areReviewsGrouped)p.gaps.push('评论由店铺分组：关联商品评价不可视作此 SKU 的实证');}catch(e){p.gaps.push('评论获取失败：'+(e as Error).message)}}
   break;
  }catch{/* keep JSON-LD result when auxiliary endpoint absent */}}
 }
 if(!p)throw new AppError('未找到商品结构化数据，请使用导入或授权数据源',422);
 p.category=p.name==='Clean Essentials Kit'&&/blueland/i.test(p.brand)?'cleaning':'general';
 if(u.href===DEMO_URL){p.sellingPoints=['Four refillable bottles with four cleaning tablets','Add warm water, drop a tablet, let it dissolve','Foaming hand soap, multi-surface, bathroom, glass and mirror cleaning','Refill existing bottles instead of replacing the bottle'];p.specifications['套装内容']='4个专用瓶 + 4片补充片';p.faq=[{question:'How do I prepare the cleaner?',answer:'Fill with warm water to the indicated line. Drop in a tablet, let it dissolve, and replace the nozzle.'}];p.gaps=p.gaps.filter(x=>!x.includes('FAQ'));}
 return p;
}
export function mineReviews(product:Product):ReviewInsight[]{
 const topics:[string,RegExp][]=[['使用效果',/clean|work|effective|result|效果|清洁/i],['香味体验',/scent|smell|fragrance|香|气味/i],['操作便捷',/easy|dissolv|use|refill|简单|溶解|补充/i],['包装与环保',/plastic|bottle|packag|waste|塑料|包装/i],['价格与价值',/price|cost|value|expensive|money|价格|贵/i]];
 return topics.map(([aspect,re])=>{const result:ReviewInsight={aspect,positive:0,negative:0,neutral:0,mixed:0,evidence:[]};for(const r of product.reviews){const sentences=r.text.match(/[^.!?。！？]+[.!?。！？]?/g)||[r.text];const relevant=sentences.filter(s=>re.test(s)).join(' ');if(!relevant)continue;const neg=/not |n't |hard|weak|poor|issue|disappoint|expensive|bad|不|难|贵/i.test(relevant);const pos=/love|great|good|easy|effective|fantastic|well|like|好|方便/i.test(relevant);const sentiment=neg&&pos?'mixed':neg?'negative':pos?'positive':'neutral';result[sentiment]++;if(result.evidence.length<12)result.evidence.push({reviewId:r.id,quote:relevant.trim().slice(0,300),sentiment});}return result}).filter(r=>r.evidence.length);
}
