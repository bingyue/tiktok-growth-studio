import {test,expect} from '@playwright/test';
test('complete user workflow: demo, script detail, matrix, UGC command, reframe, materials and export',async({page,request})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await request.post('/api/demo',{data:{live:false}});expect(response.status()).toBe(202);const job=await response.json();await expect.poll(async()=>{const r=await request.get('/api/jobs/'+job.id);return (await r.json()).status}).toBe('completed');
 await page.setViewportSize({width:1440,height:1000});await page.goto('/');await expect(page.getByRole('heading',{name:'让每一个卖点，都有好故事。'})).toBeVisible();await expect(page.getByText('100', {exact:true}).first()).toBeVisible();
 await page.locator('.product-visual img').waitFor();await expect.poll(()=>page.locator('.product-visual img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
 await page.screenshot({path:'docs/screenshots/dashboard.png',fullPage:true});
 await page.getByRole('button',{name:'查看 Top 20',exact:true}).click();await expect(page.locator('.script-card')).toHaveCount(20);await page.locator('.script-card').first().click();await expect(page.getByRole('dialog',{name:'脚本与分镜'})).toBeVisible();await expect(page.locator('.shot')).toHaveCount(6);await page.getByRole('button',{name:'完整口播',exact:true}).click();await expect(page.locator('.voiceover')).toContainText('Check');await page.getByRole('button',{name:'拍摄要求与评分'}).click();await expect(page.locator('.score-bars>div')).toHaveCount(7);await page.getByLabel('脚本状态').selectOption('ready');await page.getByRole('button',{name:'逐秒分镜',exact:true}).click();await page.screenshot({path:'docs/screenshots/storyboard.png',fullPage:false});await page.getByRole('button',{name:'关闭脚本'}).click();
 await page.getByRole('button',{name:'内容角度矩阵',exact:true}).click();await expect(page.locator('.matrix-table tbody tr')).toHaveCount(13);
 await page.getByRole('button',{name:'数据复盘',exact:true}).click();await expect(page.getByText('当前为模拟表现数据，用于演示闭环，不代表真实GMV或真实爆款。')).toBeVisible();await expect(page.locator('.dna-card')).not.toHaveCount(0);await page.screenshot({path:'docs/screenshots/analytics.png',fullPage:true});
 await page.getByLabel('自然语言指令').fill('只做15秒UGC');await page.getByRole('button',{name:'执行指令'}).click();await expect(page.getByLabel('切换批次')).toContainText('20 条 · 15s');await expect(page.locator('.job-banner')).toHaveCount(0);
 await page.getByRole('button',{name:/脚本工作室/}).click();await page.getByRole('button',{name:'仅 Top20'}).click();await expect(page.locator('.script-card')).toHaveCount(20);await page.locator('.script-card').first().click();await expect(page.locator('.shot')).toHaveCount(4);await page.getByRole('button',{name:'关闭脚本'}).click();
 await page.getByLabel('自然语言指令').fill('把Top10改成宝妈人设');await page.getByRole('button',{name:'执行指令'}).click();await expect(page.getByLabel('切换批次')).toContainText('10 条 · 15s');await expect(page.locator('.job-banner')).toHaveCount(0);await expect(page.locator('.script-card')).toHaveCount(10);await expect(page.locator('.script-card').first()).toContainText('宝妈');
 await page.getByRole('button',{name:'素材工厂',exact:true}).click();await page.getByRole('button',{name:'管理',exact:false}).first().click();await page.getByLabel('负责人',{exact:true}).fill('Demo camera team');await page.getByRole('button',{name:'保存拍摄任务'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByText('Demo camera team',{exact:true})).toBeVisible();
 const exportURL=await page.getByRole('link',{name:'导出 Shot List'}).getAttribute('href');const exported=await request.get(exportURL!);expect(exported.status()).toBe(200);expect(await exported.text()).toContain('instructions');
 await page.reload();await page.getByRole('button',{name:'素材工厂',exact:true}).click();await expect(page.getByText('Demo camera team',{exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'作战总览',exact:true}).click();await page.screenshot({path:'docs/screenshots/mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('API rejects cross-origin writes, invalid imports and unconfigured providers without side effects',async({request})=>{
 let r=await request.post('/api/demo',{headers:{Origin:'https://other.example'},data:{live:false}});expect(r.status()).toBe(403);
 const workspace=await (await request.get('/api/workspace')).json();const id=workspace.product.id;
 r=await request.post('/api/products/'+id+'/performance',{data:{rows:[{externalId:'bad',views:-1}],source:'import'}});expect(r.status()).toBe(400);
 r=await request.post('/api/products/'+id+'/competitors',{data:{provider:'authorized',url:'https://www.tiktok.com/@example/video/123'}});expect(r.status()).toBe(503);
 r=await request.get('/api/products/'+id+'/image/99');expect(r.status()).toBe(404);
 const newWorkspace=await (await request.get('/api/workspace')).json();expect(newWorkspace.videos.length).toBe(workspace.videos.length);
});
