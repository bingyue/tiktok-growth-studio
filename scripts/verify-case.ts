import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {chromium,expect} from '@playwright/test';
import {load} from 'cheerio';
import {Store} from '../server/store';
import {importProduct} from '../server/product';
import {analyzeCompetitor} from '../server/competitors';
import {importPerformance} from '../server/analytics';
const root=resolve('docs/case-assets');const base='http://127.0.0.1:4348';
const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
const missing:string[]=[];
for(const file of readdirSync(root).filter(f=>f.endsWith('.html'))){const $=load(readFileSync(join(root,file),'utf8'));$('[href],[src]').each((_,el)=>{const href=$(el).attr('href')||$(el).attr('src')||'';if(!href||href.startsWith('#')||/^[a-z]+:/i.test(href))return;const target=resolve(dirname(join(root,file)),decodeURI(href.split('#')[0]));if(!existsSync(target))missing.push(file+': '+href)});}
expect(missing).toEqual([]);for(const e of manifest.entries){expect(existsSync(join(root,e.file))).toBe(true);const bytes=readFileSync(join(root,e.file));expect(bytes.subarray(1,4).toString()).toBe('PNG');}
const store=new Store(':memory:');try{const p=importProduct(JSON.parse(readFileSync(join(root,'examples/product-import.json'),'utf8')));store.put('products',p);analyzeCompetitor(p.id,JSON.parse(readFileSync(join(root,'examples/reference-annotation.json'),'utf8')));importPerformance(store,p.id,JSON.parse(readFileSync(join(root,'examples/performance-synthetic.json'),'utf8')),'synthetic');expect(store.list('videos')).toHaveLength(6);}finally{store.close();}
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
try{
 const response=await page.goto(base+'/case-assets/');expect(response?.status()).toBe(200);await expect(page.getByRole('heading',{name:/一个商品链接，\s*走完两轮内容。/})).toBeVisible();await expect(page.locator('.asset')).toHaveCount(manifest.entries.length);
 await page.getByRole('button',{name:'竖屏',exact:true}).click();await expect(page.locator('.asset:visible')).toHaveCount(2);await page.getByRole('button',{name:'全部',exact:true}).click();
 for(const img of await page.locator('.hero img').all())await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:join(root,'gallery-preview.png'),fullPage:false});
 await page.getByRole('link',{name:'开始使用',exact:false}).click();await expect(page.getByRole('heading',{level:1})).toContainText('使用说明');await expect(page.locator('.article table')).toHaveCount(4);await expect(page.locator('.article')).toContainText('最近 30 条视频，不是最近 30 天');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto(base);await expect(page.getByRole('heading',{name:'让每一个卖点，都有好故事。'})).toBeVisible();await page.getByRole('button',{name:'增长工作流',exact:true}).click();await expect(page.locator('.workflow-step')).toHaveCount(6);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const popupPromise=page.waitForEvent('popup');await page.getByRole('link',{name:'完整使用说明',exact:true}).click();const popup=await popupPromise;await expect(popup.getByRole('heading',{level:1})).toContainText('使用说明');await popup.close();
 await page.getByRole('button',{name:'效果复盘',exact:false}).click();await expect(page.getByText('当前为模拟表现数据，用于演示闭环，不代表真实GMV或真实爆款。')).toBeVisible();
 expect(errors).toEqual([]);
 writeFileSync(join(root,'verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),screenshots:manifest.entries.length,localLinks:'all present',teachingExamples:'product, reference annotation and six synthetic metrics pass application validation',galleryFilters:'all and portrait pass',guide:'rendered with four tables; desktop and mobile',workflow:'six stages, real navigation, guide link and 390px overflow check pass',errors},null,2));
 console.log('Case assets verified: '+manifest.entries.length+' PNGs, local links, 3 example schemas, gallery filters, manual, workflow navigation and mobile layout.');
}finally{await browser.close();}
