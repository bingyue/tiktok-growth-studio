import {competitorInput} from './schemas';
import {base,AppError} from './store';
import {evidence} from './product';
import type {CompetitorVideo,ContentPattern} from '../shared/types';
export function analyzeCompetitor(productId:string,data:unknown):{video:CompetitorVideo;pattern:ContentPattern}{
 const d=competitorInput.parse(data);if(!/^https?:\/\//.test(d.url))throw new AppError('参考视频必须是HTTP(S)链接');
 const source=evidence(d.sourceKind,d.url,d.sourceNote),video:CompetitorVideo={...base(),productId,title:d.title,url:d.url,duration:d.duration,segments:d.segments,comments:d.comments,views:d.views,modality:d.modality,source};
 const opening=d.segments.filter(s=>s.start<3),sentences=d.comments.filter(c=>/\?|？|price|cost|how|where|work|expensive|smell|贵|怎么/i.test(c));
 const pattern:ContentPattern={...base(),productId,videoId:video.id,title:d.title,hook:opening.map(s=>s.transcript||s.subtitle||s.visual).join(' / '),structure:d.segments.map((s,i)=>i===0?'开场证据 / 问题':i===d.segments.length-1?'行动引导':s.sellingPoint?'卖点证明':'场景与过程'),pacing:d.segments.map(s=>Math.round((s.end-s.start)*10)/10),subtitleStructure:d.segments.map(s=>s.subtitle.length).join(' → ')+' 字符 / 镜',sellingOrder:d.segments.map(s=>s.sellingPoint).filter(Boolean),emotions:d.segments.map(s=>s.emotion),cta:d.segments.at(-1)!.transcript||d.segments.at(-1)!.subtitle,commentInsights:sentences.slice(0,8),reusableRule:`${opening.reduce((n,s)=>n+Math.min(3,s.end)-s.start,0).toFixed(1)}秒内建立问题或视觉证据；用${d.segments.length}个镜头安排证明与收尾。只复用结构，改用本商品真实场景与自有素材。`,confidence:d.modality==='annotated'?'observed':'limited',source};
 return {video,pattern};
}
