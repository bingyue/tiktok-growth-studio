import {chromium,expect} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {syntheticPerformance} from '../server/engine';
import type {Workspace,Job} from '../shared/types';
const baseURL=process.env.CASE_URL||'http://127.0.0.1:4348';
const dest=resolve('docs/case-assets');mkdirSync(dest+'/screenshots',{recursive:true});mkdirSync(dest+'/outputs',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
const resume=process.argv.includes('--resume');
const previous=resume?JSON.parse(readFileSync(dest+'/manifest.json','utf8')):null;
const entries:any[]=previous?.entries.filter((e:any)=>e.file==='screenshots/05-execution.png')||[];let mode=previous?.mode||'live';let currentJob:Job;
async function shot(file:string,title:string,caption:string,fullPage=false){
 await page.screenshot({path:dest+'/screenshots/'+file,fullPage,animations:'disabled'});
 const png=readFileSync(dest+'/screenshots/'+file);
 entries.push({file:'screenshots/'+file,title,caption,imageWidth:png.readUInt32BE(16),imageHeight:png.readUInt32BE(20),capturedAt:new Date().toISOString(),viewport:page.viewportSize(),fullPage,source:'Real application screenshot; no mocked responses or compositing'});
 console.log('Captured',file);
}
async function nav(name:string){await page.getByRole('button',{name,exact:true}).click();await page.evaluate(()=>window.scrollTo(0,0));}
async function settle(){await expect(page.locator('.toast')).toHaveCount(0,{timeout:10000});}
try{
 await page.goto(baseURL);await expect(page.getByRole('heading',{name:'让每一个卖点，都有好故事。'})).toBeVisible();
 await nav('增长工作流');
 if(resume){const existing:Workspace=await (await page.request.get(baseURL+'/api/workspace')).json();const found=existing.jobs.filter(j=>j.kind==='demo'&&j.status==='completed'&&j.resultId===existing.product?.id).at(-1);if(!found)throw new Error('No completed Demo to resume');currentJob=found;}else{
 const waiting=page.waitForResponse(r=>r.url().endsWith('/api/demo')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'从真实链接运行 Demo',exact:true}).click();currentJob=await (await waiting).json();
 try{await expect(page.locator('.job-banner')).toBeVisible({timeout:3000});await expect(page.locator('.job-banner strong')).not.toHaveText('任务已创建',{timeout:3000});await page.evaluate(()=>window.scrollTo(0,0));await shot('05-execution.png','真实任务执行中','界面正在读取公开商品与评论，进度来自后端任务。');}catch{console.log('Task too fast for an in-flight capture; completed execution record will be used.');}
 await expect.poll(async()=>{const response=await page.request.get(baseURL+'/api/jobs/'+currentJob.id);currentJob=await response.json();return currentJob.status;},{timeout:120000,intervals:[800,1500,3000]}).not.toBe('running');
 if(currentJob.status==='failed'){
  writeFileSync(dest+'/outputs/live-attempt.json',JSON.stringify(currentJob,null,2));mode='evidence-snapshot';
  await expect(page.locator('.job-banner')).toHaveCount(0,{timeout:10000});
  const retry=page.waitForResponse(r=>r.url().endsWith('/api/demo')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'用来源快照演示',exact:true}).click();currentJob=await (await retry).json();
  await expect.poll(async()=>{currentJob=await (await page.request.get(baseURL+'/api/jobs/'+currentJob.id)).json();return currentJob.status;},{timeout:30000}).toBe('completed');
 }
 }
 if(currentJob.status!=='completed')throw new Error(currentJob.error);
 await expect(page.locator('.job-banner')).toHaveCount(0,{timeout:15000});await settle();
 const w:Workspace=await (await page.request.get(baseURL+'/api/workspace?productId='+currentJob.resultId)).json();
 expect(w.batches).toHaveLength(2);expect(w.scripts).toHaveLength(200);expect(w.videos).toHaveLength(30);expect(w.analyses[0].source).toBe('synthetic');
 await expect(page.getByLabel('切换商品')).toHaveValue(w.product!.id);
 const first=w.batches[0],second=w.batches[1];
 await shot('03-workflow.png','增长工作流与批次沿革','六个阶段均展示实际存档，首轮100条、模拟数据复盘、第二轮100条。',true);
 await page.getByRole('heading',{name:'真实执行记录',exact:true}).scrollIntoViewIfNeeded();
 await shot('05b-execution-result.png','真实任务完成记录','任务状态、运行时间和任务编号来自后端存档。');
 await nav('作战总览');
 await expect.poll(()=>page.locator('.product-visual img').evaluate((img:HTMLImageElement)=>img.naturalWidth),{timeout:30000}).toBeGreaterThan(0);
 await shot('01-home.png','TikTok 内容作战室首页','真实商品研究，两轮内容闭环；首页当前展示第二轮100条与Top20。');
 await page.getByRole('button',{name:'新建商品',exact:true}).click();
 await shot('04-product-input.png','商品链接输入','示例为 Blueland 官方公开商品链接；可切换用户 JSON 或授权 Provider。');
 await page.getByRole('button',{name:'关闭弹窗',exact:true}).click();
 await page.getByRole('button',{name:'查看商品洞察',exact:true}).click();
 await shot('06-product-insights.png','商品研究与评论证据','评论区分当前商品与关联单品，每条洞察可追溯来源。');
 await page.getByRole('button',{name:'关闭弹窗',exact:true}).click();
 await page.getByRole('button',{name:'Providers & Skills',exact:true}).click();await page.evaluate(()=>window.scrollTo(0,0));
 await shot('02-configuration.png','Provider 配置状态与 Skills','显示实际本地策略引擎和预留能力状态；此页不展示密钥。');
 await nav('内容角度矩阵');await page.getByLabel('切换批次').selectOption(first.id);
 await expect(page.locator('.matrix-table tbody tr')).toHaveCount(13);
 await shot('07-angle-matrix.png','13种内容角度 × 4种创作者人设','首轮100条内容在角度、场景和人设之间分配；单元格可打开脚本。',true);
 await page.getByRole('button',{name:'生成新一轮内容',exact:true}).click();
 await shot('07b-generation-options.png','批量生成配置','数量、15/30/60秒、目标市场、语言、人设与本地/模型模式。');
 await page.getByRole('button',{name:'关闭弹窗',exact:true}).click();
 await nav('作战总览');await page.getByRole('button',{name:'查看 Top 20',exact:true}).click();
 await expect(page.locator('.script-card')).toHaveCount(20);
 await shot('08-top20.png','可拍摄性优先的 Top20','从首轮100条中按七维规则评分筛选优先试拍方案。');
 await page.locator('.script-card').first().click();await expect(page.locator('.shot')).toHaveCount(6);
 await shot('09-storyboard.png','30秒脚本与逐镜头分镜','每镜头有时长、口播、画面动作、字幕、B-roll与产品展示方式。');
 await page.getByRole('button',{name:'完整口播',exact:true}).click();
 await shot('10-voiceover.png','完整口播、CTA 与音乐建议','可直接试读的英语脚本；上线前需结合实拍结果审稿。');
 await page.getByRole('button',{name:'拍摄要求与评分',exact:true}).click();
 await shot('11-shootability.png','七维可拍摄性评分','评分用于安排试拍优先级，不能解读为爆款概率或GMV预测。');
 await page.getByRole('button',{name:'关闭脚本',exact:true}).click();
 await nav('素材工厂');await shot('12-materials.png','素材工厂与拍摄任务','相同镜头需求复用，列出素材缺口、负责人和使用状态。');
 await nav('竞品拆解');await shot('13-reference-patterns.png','参考视频结构拆解','实际品牌参考标注与模拟竞品结构分开标识；并非已验证爆款。');
 await nav('数据复盘');await page.getByRole('button',{name:'导入视频数据',exact:true}).click();
 const history=syntheticPerformance(w.scripts.filter(s=>s.batchId===first.id),w.product!);
 await page.getByLabel('数据类型').selectOption('synthetic');
 await page.getByLabel('表现数据',{exact:true}).fill(JSON.stringify(history,null,2));
 await shot('14-performance-import.png','导入历史视频表现','30条模拟数据用于验证机制；正式运营改用自有视频数据并选择真实业务数据。');
 await page.getByRole('button',{name:'校验并导入数据',exact:false}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'生成新一轮内容',exact:true})).toBeEnabled();await settle();
 await expect(page.getByText('当前为模拟表现数据，用于演示闭环，不代表真实GMV或真实爆款。')).toBeVisible();
 await shot('15-performance.png','同口径数据复盘','截图明确标注模拟数据；展示播放、3秒留存、GMV、ROAS及Content DNA。');
 await nav('Content DNA');await shot('16-content-dna.png','Content DNA 学习方向','高表现标签来自这组模拟样本中的观察关联，待下一轮验证。');
 await nav('增长工作流');await page.getByLabel('切换批次').selectOption(second.id);await page.getByRole('heading',{name:'批次沿革',exact:true}).scrollIntoViewIfNeeded();await shot('17-round-two.png','两轮产物与迭代依据','第二轮关联首轮批次与复盘，保留创作方向调整和探索。');
 await nav('作战总览');await page.getByLabel('切换批次').selectOption(second.id);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await shot('18-mobile-home.png','手机端首页','真实响应式界面，适合竖屏演示开场。');
 await page.getByRole('button',{name:'查看 Top 20',exact:true}).click();await page.locator('.script-card').first().click();
 await shot('19-mobile-storyboard.png','手机端逐镜头分镜','竖屏展示脚本执行细节，适合小红书和短视频近景。');
 await page.getByRole('button',{name:'关闭脚本',exact:true}).click();await page.setViewportSize({width:1440,height:1000});await nav('作战总览');
 const fresh:Workspace=await (await page.request.get(baseURL+'/api/workspace?productId='+w.product!.id)).json();
 for(const b of w.batches){for(const [format,extra,name] of [['md','&top=20',`round-${b.round}-top20.md`],['json','',`round-${b.round}.json`],['materials','',`round-${b.round}-shot-list.csv`]]){const response=await page.request.get(`${baseURL}/api/batches/${b.id}/export?format=${format}${extra}`);expect(response.ok()).toBe(true);writeFileSync(dest+'/outputs/'+name,await response.body());}}
 writeFileSync(dest+'/outputs/history-synthetic.json',JSON.stringify(history,null,2));
 writeFileSync(dest+'/outputs/analysis.json',JSON.stringify(w.analyses[0],null,2));
 writeFileSync(dest+'/outputs/run.json',JSON.stringify({capturedAt:new Date().toISOString(),mode,productId:w.product!.id,product:w.product!.name,url:w.product!.url,price:w.product!.price,currency:w.product!.currency,reviewCount:w.product!.reviews.length,exactReviews:w.product!.reviews.filter(r=>r.scope==='exact').length,sourceEvidence:w.product!.sources,job:currentJob,batches:w.batches,videoCount:fresh.videos.length,metricsSource:'synthetic',insights:w.analyses[0].insights.length,personaDistribution:w.batches.map(b=>({round:b.round,counts:Object.fromEntries(['student','parent','fitness','reviewer'].map(id=>[id,w.scripts.filter(s=>s.batchId===b.id&&s.personaId===id).length]))})),checks:{scripts:200,uniqueFingerprints:new Set(w.scripts.map(s=>s.fingerprint)).size,uniqueVoiceovers:new Set(w.scripts.map(s=>s.voiceover)).size,storyboardSeconds:w.scripts.every(s=>s.storyboard.shots.reduce((n,sh)=>n+sh.duration,0)===s.duration),idempotentVideoCount:fresh.videos.length===30,browserErrors:errors}},null,2));
 expect(errors).toEqual([]);
 console.log('CASE COMPLETE',mode,w.product!.id,entries.length+' screenshots');
}finally{writeFileSync(dest+'/manifest.json',JSON.stringify({capturedAt:new Date().toISOString(),baseURL,mode,theme:'TikTok black / white / cyan / pink',performanceSource:'synthetic',entries},null,2));await browser.close();}
