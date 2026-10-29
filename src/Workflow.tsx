import {ArrowUpRight,CheckCircle2,Clock3,Play,RefreshCw,BookOpen} from 'lucide-react';
import type {Workspace,Job} from '../shared/types';

export function Workflow({workspace:w,job,busy,onPage,onDemo}:{workspace:Workspace;job:Job|null;busy:boolean;onPage:(page:string)=>void;onDemo:(live:boolean)=>void}) {
 const p=w.product;
 const first=w.batches[0], optimized=w.batches.filter(b=>b.analysisId).at(-1);
 const analysis=w.analyses.at(-1);
 const steps=[
  {name:'商品理解',skill:'ProductAnalyzer / ReviewMiner',page:'overview',ready:!!p,detail:`${p?.reviews.length||0} 条评论 · ${p?.reviews.filter(r=>r.scope==='exact').length||0} 条当前商品`,output:'商品事实、评论证据、FAQ 与信息缺口'},
  {name:'参考拆解',skill:'CompetitorVideoAnalyzer',page:'patterns',ready:!!w.patterns.length,detail:`${w.patterns.length} 个已存档 Content Pattern`,output:'前 3 秒、镜头节奏、卖点顺序与 CTA'},
  {name:'批量策划',skill:'AnglePlanner / ScriptWriter',page:'matrix',ready:!!first,detail:first?`首轮 ${first.count} 条 · ${first.diversity.angles} 类角度`:'等待首轮内容',output:'目标用户、Hook、口播与逐秒分镜'},
  {name:'准备实拍',skill:'ContentScorer / UGCPlanner',page:'materials',ready:!!first,detail:first?`首轮 Top${first.topIds.length} · ${w.materials.filter(m=>m.batchId===first.id).length} 项素材任务`:'等待脚本评分',output:'优先测试清单、负责人、素材缺口'},
  {name:'效果复盘',skill:'PerformanceAnalyzer',page:'analytics',ready:!!analysis,detail:analysis?`${analysis.videoIds.length} 条视频 · ${analysis.source==='synthetic'?'模拟数据':'业务数据'}`:'等待导入视频表现',output:'同组指标与 Content DNA 观察关联'},
  {name:'下一轮迭代',skill:'IterationAgent',page:'dna',ready:!!optimized,detail:optimized?`Round ${String(optimized.round).padStart(2,'0')} · ${optimized.count} 条新内容`:'等待复盘驱动的新批次',output:'调整创作方向，保留探索与验证计划'},
 ];
 const jobs=[...w.jobs.filter(j=>j.productId===p?.id||(j.kind==='demo'&&j.resultId===p?.id))];
 if(job&&!jobs.some(j=>j.id===job.id))jobs.push(job);
 else if(job){const i=jobs.findIndex(j=>j.id===job.id);if(i>=0)jobs[i]=job;}
 const labels:Record<string,string>={demo:'商品到复盘 · 完整 Demo',research:'商品与评论研究',generate:'批量脚本生成',iterate:'复盘驱动迭代',reframe:'创作者人设改写'};
 return <div className="workflow-page">
  <div className="workflow-intro panel"><div><div className="eyebrow">THE CONTENT GROWTH LOOP</div><h2>从一个链接，到下一轮可拍内容。</h2><p>阶段状态来自当前商品的实际存档；准备实拍表示计划已产出，尚未完成拍摄。</p></div><a className="button secondary" href="/case-assets/guide.html" target="_blank" rel="noreferrer"><BookOpen size={15}/>完整使用说明</a></div>
  <div className="workflow-steps">{steps.map((s,i)=><button key={s.name} className={'panel workflow-step '+(s.ready?'done':'')} onClick={()=>onPage(s.page)}><div className="row-between"><span className="workflow-number">0{i+1}</span><span className="tag">{s.ready?<><CheckCircle2 size={12}/>已有产物</>:<><Clock3 size={12}/>待执行</>}</span></div><h3>{s.name}<ArrowUpRight size={16}/></h3><p>{s.output}</p><strong>{s.detail}</strong><small>{s.skill}</small></button>)}</div>
  <div className="section-title"><div><h2>批次沿革</h2><p>每次迭代保留上一批次和分析依据，便于回查。</p></div></div>
  <div className="panel table-wrap"><table><thead><tr><th>内容批次</th><th>产物</th><th>创作依据</th><th>工作包</th></tr></thead><tbody>{w.batches.map(b=><tr key={b.id}><td><strong>Round {String(b.round).padStart(2,'0')}</strong><small>{b.market} · {b.language.toUpperCase()} · {b.duration}s</small></td><td>{b.count} 条脚本 / Top{b.topIds.length}<small>{b.diversity.unique} 个独立组合</small></td><td><strong>{b.strategy}</strong><small>{b.analysisId?'关联已存档复盘':b.basedOnBatchId?'关联上一批次':'首轮内容策划'}</small></td><td><a className="text-button" href={'/api/batches/'+b.id+'/export?format=md&top=20'}>导出 Top20 <ArrowUpRight size={14}/></a></td></tr>)}</tbody></table>{!w.batches.length&&<p className="empty">尚无批次，先生成首轮内容。</p>}</div>
  <div className="section-title"><div><h2>真实执行记录</h2><p>保存任务状态、时间和结果；快速任务可能直接显示完成。</p></div></div>
  <div className="workflow-jobs">{jobs.slice(-5).reverse().map(j=><div className="panel workflow-job" key={j.id}><span className={'tag '+(j.status==='completed'?'mint':'')}>{j.status==='completed'?'已完成':j.status==='failed'?'失败':'执行中'}</span><div><strong>{labels[j.kind]||j.kind}</strong><p>{j.status==='failed'?j.error:j.stage}</p><small>{new Date(j.createdAt).toLocaleString('zh-CN')} · 任务 {j.id.slice(0,8)}</small></div><b>{j.progress}%</b></div>)}{!jobs.length&&<div className="panel muted">此商品暂无通过界面发起的任务记录；终端 Demo 产物仍可在上方查看。</div>}</div>
  <div className="panel workflow-demo"><div><h3>演示一个完整闭环</h3><p>新建独立商品工作区，生成两轮各 100 条内容。商品使用公开来源；30 条历史业绩明确为模拟数据。</p><small>实时研究会访问公开商品页；网络不可用时可选择已取证快照。视频参考采用存档标注，未接入自动视频视觉分析。</small></div><div><button className="button dark" disabled={busy} onClick={()=>onDemo(true)}><Play size={15}/>从真实链接运行 Demo</button><button className="button secondary" disabled={busy} onClick={()=>onDemo(false)}><RefreshCw size={15}/>用来源快照演示</button></div></div>
 </div>;
}
