import {z} from 'zod';
import {base,AppError} from './store';
import {hash,mineReviews} from './product';
import {angles,personas} from '../shared/catalog';
import {generationInput} from './schemas';
import type {Product,Script,Shot,ContentAngle,CreatorPersona,Analysis,ContentPattern,MaterialAsset,Score,Batch} from '../shared/types';
import {complete} from './providers';
export type GenerationOptions=z.infer<typeof generationInput>;
interface Scene {id:string;en:string;zh:string;es:string;de:string;ja:string;task:string;props:string;proof:string}
const scenes:Scene[]=[
{id:'breakfast',en:'the after-breakfast counter',zh:'早餐后的台面',es:'la encimera después del desayuno',de:'der Küchentheke nach dem Frühstück',ja:'朝食後のキッチン',task:'固定机位拍台面局部，按标签确认材质后清理实际残留',props:'台面、抹布、原有餐具',proof:'同位置近景检查残留'},
{id:'mirror',en:'the fingerprint-covered mirror',zh:'有指纹的镜面',es:'el espejo con huellas',de:'dem Spiegel mit Fingerabdrücken',ja:'指紋の付いた鏡',task:'用镜面对应产品清理指纹，保持曝光和角度一致',props:'镜子、无绒布、固定手机',proof:'侧光展示有无擦痕'},
{id:'sink',en:'the crowded space under the sink',zh:'拥挤的水槽下方',es:'el espacio bajo el fregadero',de:'dem Schrank unter der Spüle',ja:'シンク下の収納',task:'先拍实际占用，再摆放瓶子与补充装；保留所有必要物件',props:'收纳格、尺子、瓶子与补充片',proof:'用尺子记录实际占用，不能虚构节省比例'},
{id:'moving',en:'my first-apartment setup',zh:'第一次租房的清洁角',es:'mi primer apartamento',de:'meiner ersten Wohnung',ja:'初めての一人暮らし',task:'在空桌上清点每项内容，再放入指定收纳位置',props:'桌面、清单纸、产品全套',proof:'逐项对应包装清单'},
{id:'bathroom',en:'the bathroom reset',zh:'浴室整理时刻',es:'la limpieza del baño',de:'dem Badezimmer',ja:'浴室の片付け',task:'确认表面适用范围后拍局部清洁，不混用清洁剂',props:'浴室台面、对应清洁瓶、干净布',proof:'同光源记录处理前后'},
{id:'refill',en:'the empty-bottle refill',zh:'空瓶补充时刻',es:'el momento de rellenar la botella',de:'dem Nachfüllen der leeren Flasche',ja:'空のボトルの詰め替え',task:'拍瓶身标线、加温水、投入补充片；按说明等待溶解后安装喷头',props:'指定瓶子、温水、补充片、计时器',proof:'连续拍操作，跳时需标注实际经过时间'},
{id:'guests',en:'the before-guests tidy-up',zh:'朋友来访前的整理',es:'la preparación antes de recibir visitas',de:'dem Aufräumen vor Besuch',ja:'来客前の片付け',task:'选一块客人会看到的适用表面，记录整理流程',props:'玄关台、抹布、适用清洁瓶',proof:'保留一次连续操作'},
{id:'weekend',en:'my weekend reset',zh:'周末整理清单',es:'mi rutina de fin de semana',de:'meinem Wochenendplan',ja:'週末のリセット',task:'写下两个具体清洁位置，依次展示对应产品和操作',props:'清单纸、两种对应产品',proof:'每完成一项才勾选'},
{id:'desk',en:'my shared-space routine',zh:'共享空间的清洁轮值',es:'mi rutina en el espacio compartido',de:'dem gemeinsam genutzten Raum',ja:'共有スペースの当番',task:'展示公用清单和适用台面，拍摄者完成自己负责的一项',props:'轮值表、台面、布',proof:'避免未经同意拍到其他人的物品'},
{id:'packaging',en:'my refill-storage shelf',zh:'补充装收纳架',es:'mi estante de recambios',de:'meinem Regal für Nachfüllpackungen',ja:'詰め替え用の棚',task:'将瓶子与未拆封补充装并排，展示标签和储存要求',props:'小架子、包装、标签',proof:'不把包装宣称扩展为未经验证的环保数据'},
{id:'hands',en:'the hand-washing station',zh:'洗手台的准备',es:'la zona para lavarse las manos',de:'dem Handwaschplatz',ja:'手洗いスペース',task:'依说明准备泡沫洗手液，仅展示泵头和实际泡沫',props:'洗手液专用瓶、温水、毛巾',proof:'不作除菌率或儿童安全承诺'},
{id:'label',en:'the label-check moment',zh:'下单前核对标签',es:'la revisión de la etiqueta',de:'dem Prüfen des Etiketts',ja:'購入前のラベル確認',task:'特写标签、适用范围与当前商品页，逐一核对',props:'手机商品页、实物包装',proof:'展示信息日期；价格及库存以下单页面为准'}
];
const genericScenes:Scene[]=scenes.map((s,i)=>({...s,task:['在桌面完整展示商品、标签和主要部件','按官方说明完成一次日常操作，记录实际过程','用尺子记录商品实际尺寸并与收纳空间比对','清点收到的商品和随附配件，按说明安装','展示一个目标用户的使用任务，核对商品适用范围','特写结构与操作方式，不能预设性能结果'][i%6],proof:'将实拍观察与商品说明逐项核对；不预设实测结果',props:'实际商品、手机、三脚架、说明书',en:['the first-use setup','my daily routine','the storage check','the unboxing table','a busy morning','the detail check','the packing checklist','my weekend routine','my shared workspace','the shelf setup','the everyday test','the label-check moment'][i],zh:['初次使用','日常操作','收纳检查','开箱桌面','忙碌早晨','细节核对','出门准备','周末日常','共享工作区','上架收纳','日常实测','标签核对'][i],es:'mi rutina '+(i+1),de:'meiner Routine '+(i+1),ja:'日常の場面'+(i+1)}));
const subject=(s:Scene,l:string)=>s[l as 'en']||s.en;
const hooksByScene:Record<string,{label:string;problem:string;tutorial:string;pov:string;story:string;myth:string;question:string;verb:string}>={
 breakfast:{label:'kitchen counter',problem:'Breakfast is done. Why is this still here?',tutorial:'Start with the right cleaner for this counter.',pov:'Breakfast finished. Counter still waiting.',story:'The one kitchen step I kept skipping.',myth:'More spray does not replace the right steps.',question:'Which cleaner belongs on this counter?',verb:'reset the kitchen'},
 mirror:{label:'mirror',problem:'Fingerprints back on the mirror again?',tutorial:'Check the label before cleaning your mirror.',pov:'Good light. Very visible fingerprints.',story:'The mirror caught what I missed.',myth:'A different camera angle can hide streaks.',question:'Which bottle is for glass and mirrors?',verb:'check this mirror'},
 sink:{label:'under-sink cabinet',problem:'Why is this cabinet always crowded?',tutorial:'Measure first. Then plan your refill storage.',pov:'Opening the cabinet should not be a challenge.',story:'I finally looked inside this cabinet.',myth:'An empty bottle can still have a job.',question:'How much space do these refills need?',verb:'organize the cabinet'},
 moving:{label:'first-apartment',problem:'First apartment. Where does cleaning even start?',tutorial:'Check the kit before buying extra supplies.',pov:'New keys. Empty shelves. First cleaning kit.',story:'The first thing on my apartment checklist.',myth:'A starter kit still needs a label check.',question:'What actually comes in this kit?',verb:'set up the cleaning shelf'},
 bathroom:{label:'bathroom',problem:'Another bathroom task on the list?',tutorial:'Check the surface before choosing the cleaner.',pov:'The bathroom reset nobody filmed yet.',story:'This bathroom corner needed a closer look.',myth:'One cleaner does not mean every surface.',question:'Which surfaces does the label allow?',verb:'reset the bathroom'},
 refill:{label:'refill station',problem:'Empty bottle. Now what?',tutorial:'Water first. Tablet next. Let it dissolve.',pov:'Time to refill the bottle I kept.',story:'This bottle is getting another refill.',myth:'The bottle is empty. Its job is not.',question:'How do you prepare a cleaning tablet?',verb:'refill this bottle'},
 guests:{label:'entryway',problem:'Guests coming. What gets cleaned first?',tutorial:'One small surface. Follow the label.',pov:'Before the doorbell, one quick reset.',story:'The spot I noticed before guests arrived.',myth:'A reset does not need a giant checklist.',question:'What is one realistic pre-guest task?',verb:'tidy up before guests'},
 weekend:{label:'weekend cleaning',problem:'The weekend list keeps getting longer?',tutorial:'Choose the task. Match the product.',pov:'Weekend reset. Two jobs on the list.',story:'I made this weekend list smaller.',myth:'More products do not plan your routine.',question:'Which two jobs can this kit cover?',verb:'start the weekend reset'},
 desk:{label:'shared-space',problem:'Whose turn is the shared-space cleanup?',tutorial:'Pick your task. Check the product label.',pov:'It is my turn on the cleaning rota.',story:'I started with my part of the list.',myth:'Sharing a space still needs a clear routine.',question:'Which bottle goes with this shared-space task?',verb:'clean the shared space'},
 packaging:{label:'refill shelf',problem:'Where do all the refill packs go?',tutorial:'Read the storage label before shelving refills.',pov:'Giving the refill packs their own spot.',story:'I gave these refills a proper home.',myth:'Small packaging still needs proper storage.',question:'How should I store these refill packs?',verb:'set up a refill shelf'},
 hands:{label:'hand-washing station',problem:'The soap bottle is empty again?',tutorial:'Use the hand-soap bottle for this tablet.',pov:'Refilling the soap at the sink.',story:'One small part of my sink routine.',myth:'The right tablet needs the right bottle.',question:'Which bottle makes the foaming hand soap?',verb:'set up the soap station'},
 label:{label:'product label',problem:'Buying before checking the details?',tutorial:'Read the label, then compare the listing.',pov:'The label check before checkout.',story:'Here is what I check before choosing.',myth:'A good-looking package is not the full story.',question:'Does the listing match what is inside?',verb:'check the details'}
};

function hookFor(a:ContentAngle,s:Scene,l:string){
 const place=subject(s,l);
 if(l==='en'&&s.task!==genericScenes.find(x=>x.id===s.id)?.task){const h=hooksByScene[s.id];if(h){const english=[h.problem,`Watch this ${h.label} demo.`,`Same ${h.label}. Before and after.`,`Three checks for this ${h.label} setup.`,`Unboxing the ${h.label} setup.`,h.tutorial,h.pov,h.story,`What does this ${h.label} setup include?`,h.myth,h.question,`One ${h.label} task. One take.`,`Come ${h.verb} with me.`];return english[angles.findIndex(x=>x.id===a.id)];}}

 const list:Record<string,string[]>={
 en:[`Still putting off ${place}?`,`Watch this: ${place}.`,`Before and after: ${place}.`,`A real test at ${place}.`,`What's inside for ${place}?`,`Start here: ${place}.`,`POV: ${place} needs a reset.`,`Here's the plan for ${place}.`,`Is this worth it for ${place}?`,`Rethink the routine at ${place}.`,`Will this fit ${place}?`,`One task. One take. ${place}.`,`Let's try this at ${place}.`],
 zh:[`${place}，又卡在这一步？`,`${place}，先看怎么做。`,`${place}，前后同角度对比。`,`${place}，今天现场测。`,`${place}，拆开到底有什么？`,`${place}，从这一步开始。`,`${place}，轮到我了。`,`${place}，这次这样安排。`,`${place}，这笔钱值不值？`,`${place}，换个方法试试。`,`${place}，它适合吗？`,`${place}，一镜到底挑战。`,`${place}，一起上手试试。`],
 es:[`¿Otra vez ${place}?`,`Mira esto: ${place}.`,`Antes y después: ${place}.`,`Una prueba real: ${place}.`,`¿Qué incluye para ${place}?`,`Paso a paso: ${place}.`,`Hoy toca ${place}.`,`Mi plan para ${place}.`,`¿Vale la pena para ${place}?`,`Otra forma de ver ${place}.`,`¿Funciona para ${place}?`,`Una tarea, una toma: ${place}.`,`Vamos a probarlo: ${place}.`],
 de:[`Schon wieder ${place}?`,`Schau mal: ${place}.`,`Vorher und nachher bei ${place}.`,`Ein ehrlicher Test bei ${place}.`,`Was steckt drin für ${place}?`,`Schritt für Schritt bei ${place}.`,`Heute geht es um ${place}.`,`Mein Plan bei ${place}.`,`Lohnt es sich bei ${place}?`,`Neu gedacht bei ${place}.`,`Passt das zu ${place}?`,`Eine Aufgabe bei ${place}.`,`Probieren wir es bei ${place}.`],
 ja:[`${place}、困っていませんか？`,`${place}、使い方を見てください。`,`${place}、前後を比べます。`,`${place}、実際に試します。`,`${place}、中身を確認。`,`${place}、手順はここから。`,`${place}、今日はこれを。`,`${place}、今回の計画。`,`${place}、価格に見合う？`,`${place}、やり方を見直そう。`,`${place}、これに合う？`,`${place}、ワンカットで挑戦。`,`${place}、一緒に試そう。`]
 };return (list[l]||list.en)[angles.findIndex(x=>x.id===a.id)];
}
const translations={
 en:{setup:'Here is the actual kit, with each item laid out.',use:'Follow the label. Show each step without skipping the setup.',proof:'Keep the camera still so you can judge the result.',detail:'Look closely at the label and the part doing the work.',limit:'Check the surface and instructions before you use it.',second:'Try one small area first, then inspect it in the same light.',summary:'You can see the setup, the process, and what is included.',cta:'Check the product page for the current details.'},
 zh:{setup:'这是实际收到的套装，每一样都摆出来。',use:'按标签操作，准备步骤也完整拍下来。',proof:'机位不动，效果怎么样你自己看。',detail:'拉近看标签，也看看实际工作的部位。',limit:'先核对适用范围，再按说明使用。',second:'先选一个小范围试用，再用相同光线检查。',summary:'准备、操作、套装内容，都在这里了。',cta:'打开商品页，看看当前规格和价格。'},
 es:{setup:'Aquí está el kit real, con cada pieza a la vista.',use:'Sigue la etiqueta y muestra cada paso de la preparación.',proof:'Mantenemos la cámara fija para ver el resultado.',detail:'Mira la etiqueta y el detalle de cerca.',limit:'Comprueba las instrucciones antes de usarlo.',second:'Prueba primero en una zona pequeña con la misma luz.',summary:'Aquí tienes la preparación, el proceso y el contenido.',cta:'Consulta los detalles actuales en la página del producto.'},
 de:{setup:'Hier ist das echte Set mit allen Teilen.',use:'Befolge das Etikett und zeige jeden Schritt.',proof:'Die Kamera bleibt stehen, damit du das Ergebnis siehst.',detail:'Sieh dir Etikett und Funktion genau an.',limit:'Prüfe die Anleitung vor der Anwendung.',second:'Teste eine kleine Stelle bei gleichem Licht.',summary:'So sehen Vorbereitung, Anwendung und Inhalt aus.',cta:'Aktuelle Details findest du auf der Produktseite.'},
 ja:{setup:'実物のセットです。中身を並べました。',use:'ラベルに従い、準備から順番に見せます。',proof:'同じ位置から結果を確認します。',detail:'ラベルと実際の動きを近くで見ます。',limit:'使う前に説明と適用範囲を確認してください。',second:'まず小さい範囲で試し、同じ光で確認します。',summary:'準備、使い方、セットの中身を確認できました。',cta:'最新の内容は商品ページで確認してください。'}
};
function spoken(a:ContentAngle,p:Product,s:Scene,l:string,role:string,persona:CreatorPersona):string {
 const t=translations[l as keyof typeof translations]||translations.en;
 if(role==='hook')return hookFor(a,s,l);
 if(role==='cta')return l==='en'?(persona.id==='student'?'Check the kit and refill prices.':persona.id==='parent'?'See the kit details for your home.':persona.id==='fitness'?'Check the setup for your routine.':'Compare the specifications on the product page.'):t.cta;
 if(l!=='en'){
  if(role==='setup'&&l==='zh')return persona.id==='parent'?'家里每天都要用，先看看怎么准备。':persona.id==='student'?'空间不大，我先把需要的摆出来。':persona.id==='fitness'?'日常要做的事，我喜欢提前准备好。':'先定好检查项，再看实际操作。';
  if(role==='use'&&l==='zh'&&p.category==='cleaning')return ['refill','hands'].includes(s.id)?'温水加到标线，放入补充片，等它溶解。':['sink','packaging','moving'].includes(s.id)?'瓶子留下，补充装放旁边，看看实际占多少空间。':'选对适用的清洁产品，按标签操作这一小块。';
  return t[role as keyof typeof t]||t.use;
 }
 const setup:Record<string,string>={pain:`This is the part of ${s.en} I want to simplify.`,demo:'Start with the real setup. Nothing is hidden outside the frame.','before-after':'Same light, same angle. This is where we start.',review:'My checklist: setup, handling, and what I can actually see.',unboxing:`This is the ${p.name}. Let’s unpack it.`,tutorial:'Read the label first. The setup matters as much as the next step.',scenario:`This is a normal moment at ${s.en}, with the actual product.`,story:'I wanted a routine I could repeat. Here is the setup I am testing.',value:p.price!==null?`The listed price is ${p.price} ${p.currency}. Check what that includes.`:'Check the current price against what actually comes in the box.',contrarian:'Before changing products, look at how the routine is set up.',faq:'Let’s answer with the actual product and the instructions beside it.',challenge:'The task is set. Keep the camera rolling so every step is visible.',ugc:'Here is how I would set this up. Let’s look at it together.'};
 if(role==='setup'){
  if(['value','unboxing','review','faq'].includes(a.id))return setup[a.id];
  return persona.id==='parent'?"Between family routines, I want a setup I can repeat.":persona.id==='student'?"Small space, small budget. Here is what I am working with.":persona.id==='fitness'?"I like a repeatable routine. Everything I need is right here.":'Setup, handling, visible results. Those are the three checks today.';
 }
 if(role==='proof'&&p.category==='cleaning'){
  if(['sink','packaging','moving'].includes(s.id))return persona.id==='student'?'That is the real footprint. Compare it with your available space.':'The bottle stays. The refill goes beside it until it is needed.';
  if(s.id==='hands')return 'This is the foam from the actual pump. No added effects.';
  if(s.id==='refill')return 'Keep the same bottle for the next refill. Follow the storage label.';
  return persona.id==='reviewer'?'Look at the same area, in the same light. Judge the finish.':'Here is that same spot, under the same light. Take a closer look.';
 }
 if(role==='use'&&p.category==='cleaning'){
  if(s.id==='refill')return 'Warm water to the line. Add the tablet. Wait for it to dissolve.';
  if(s.id==='mirror')return 'Use the glass cleaner as directed. Wipe this small section, then look closely.';
  if(s.id==='hands')return 'Use the hand soap bottle. Prepare it as directed, then show the actual foam.';
  if(['sink','packaging','moving'].includes(s.id))return 'Keep the bottles. Set the refills beside them and check the space they need.';
  return 'Choose the matching cleaner. Follow the label, then show one complete cleaning step.';
 }
 if(role==='detail')return persona.id==='reviewer'?'Keep the label visible. The details need to match the product page.':persona.id==='student'?'Check the full setup before deciding if it fits your space.':persona.id==='parent'?'Put each item back in its labeled storage spot after the demo.':'Show the steps in the order you would actually do them.';
 if(role==='limit'&&a.id==='value')return 'Refills and the starter kit may cost different amounts. Check today’s listing.';
 return t[role as keyof typeof t]||t.use;
}
export function scoreScript(s:Pick<Script,'hook'|'voiceover'|'storyboard'|'duration'|'sourceIds'|'angleId'>):Score {
 const shots=s.storyboard.shots,words=s.voiceover.match(/[\p{L}\p{N}]+/gu)?.length||0;const cjk=(s.voiceover.match(/[\u4e00-\u9fff\u3040-\u30ff]/g)||[]).length;const units=cjk>20?cjk/2:words;const rate=units/s.duration;
 const cost=shots.reduce((n,x)=>n+({'真人拍摄':8,'产品特写':3,'场景素材':4,'截图':1,'动画':10,'数字人':15,'AI生成素材':12,'AI视频':20,'TTS':2,'UGC素材':30}[x.materialKind]),0);
 const warnings:string[]=[];if(rate>3)warnings.push('口播偏快，需要试读压缩');if(s.hook.split(/\s+/).length>11)warnings.push('Hook 较长，需检查前三秒可读性');if(!s.sourceIds.length)warnings.push('商品卖点缺少证据来源');
 const dimensions={'Hook强度':Math.max(35,94-(s.hook.length>65?15:0)), '信息密度':Math.max(40,Math.round(96-Math.abs(rate-2.1)*18)), '拍摄易度':Math.max(30,100-shots.length*3-(shots.some(x=>x.equipment.includes('计时器'))?5:0)), '素材成本':Math.max(25,100-Math.round(cost*.8)), '产品清晰度':shots.every(x=>x.productDisplay)?95:55, '差异化':80+(['contrarian','challenge','review','faq'].includes(s.angleId)?12:0), '平台适配度':s.duration<=30?94:83};
 const total=Math.round(Object.values(dimensions).reduce((n,x)=>n+x,0)/7-(warnings.length*3));return {total,dimensions,reasons:[`${shots.length} 个镜头，预计 ${s.duration} 秒`, `道具与制作成本参考 $${cost}，不含样品与达人费用`,'七维规则评分，不能预测播放量或GMV'],warnings,estimatedCost:cost,basis:'heuristic'};
}
export function makeScript(p:Product,batchId:string,o:GenerationOptions,a:ContentAngle,scene:Scene,persona:CreatorPersona,index:number,patterns:ContentPattern[]):Script{
 const sequences:Record<string,string[]>={demo:['hook','proof','setup','use','limit','cta'],unboxing:['hook','setup','detail','use','limit','cta'],tutorial:['hook','setup','use','second','proof','cta'],value:['hook','setup','detail','proof','limit','cta'],story:['hook','setup','use','detail','limit','cta']};
 const b=base(),roles=o.duration===15?['hook','use','proof','cta']:o.duration===30?(sequences[a.id]||['hook','setup','use','proof','limit','cta']):['hook','setup','use','detail','proof','second','limit','summary','cta'];
 const timings=o.duration===15?[3,5,4,3]:o.duration===30?[3,5,7,6,5,4]:[3,7,8,7,8,8,7,7,5];let cursor=0;
 const format:Record<string,string>={pain:'先呈现未完成的具体任务，手指指向问题位置',demo:'开场特写真实结果，然后切回完整操作，不修饰效果','before-after':'左右并置同一机位的前后镜头，保留拍摄时间',review:'画面左侧显示评测检查项，逐条验证',unboxing:'俯拍拆封，所有配件依次进入画面',tutorial:'画面叠加当前步骤编号；上一动作完成再切换',scenario:'先拍真实场景全景，人物自然进入开始任务',story:'真人中景交代本次选择，然后切实物验证',value:'并置当日商品页面与实物清单，指明币种和日期',contrarian:'用旧习惯与当前操作的动作对比提出问题',faq:'以问题字幕开场，手指指向实物或说明书对应位置',challenge:'可见计时器与固定机位连续拍；时间跳跃明确注明',ugc:'手机手持视角，真实创作者直接演示，不演虚假消费者背书'};
 const shots:Shot[]=roles.map((role,j)=>{const duration=timings[j],start=cursor;cursor+=duration;
 const materialKind:Shot['materialKind']=role==='hook'||role==='summary'?'真人拍摄':role==='cta'?'截图':role==='setup'?'场景素材':'产品特写';
 let action=role==='hook'?`${format[a.id]}；场景：${scene.zh}`:role==='use'||role==='second'?scene.task:role==='proof'?scene.proof:role==='cta'?'录制当前商品页，突出规格、价格与购买入口；隐藏个人账户信息':role==='detail'?'微距拍标签与关键操作部位，手指示意具体细节':role==='limit'?'拍说明书的适用范围；不把未验证宣传当成实测结论':`在${scene.zh}摆齐 ${p.name} 和 ${scene.props}，保持品牌与部件可辨认`;
 if(role==='setup')action=a.id==='pain'?`在${scene.zh}复现一个真实的不便，保持现状，不故意制造夸张效果`:a.id==='value'?`打开${p.name}当前商品页，记录标价${p.price??'待核对'} ${p.currency}，与实物清单对应`:a.id==='unboxing'?'俯拍真实拆封，镜头外不添加包装内没有的物品':a.id==='review'?'写下操作、握持、可见结果三项检查标准，并让标签入镜':action;
 if(role==='use'&&a.id==='challenge')action+='；计时器持续在画面内，保留完整原始录像';
 if(role==='detail'&&a.id==='unboxing')action='逐项摆出包装内实际物品；特写标签，清点数量';
 if(role==='proof'&&a.id==='before-after')action='采用相同机位、光线和处理区域并排展示前后；不能美化结果';
 if(role==='second'&&a.id==='tutorial')action='特写演示下一步骤与检查点：'+scene.task;
 const voiceover=spoken(a,p,scene,o.language,role,persona);
 return {id:`${b.id}-${j+1}`,start,duration,role,voiceover,action,subtitle:voiceover,broll:role==='proof'?scene.proof:role==='use'?scene.task:'场景建立镜头与实物细节补拍',productDisplay:role==='cta'?'商品页与名称保持清晰':'真实产品标签朝向镜头，实际操作部位置于画面中部',materialKind,transition:j===0?'动作硬切':role==='proof'?'匹配剪辑，保持同条件':'硬切；给动作留停顿',equipment:['手机','三脚架',...((a.id==='challenge')?['计时器']:[])],assetKey:hash(p.id+scene.id+role+action+(materialKind==='真人拍摄'?persona.id:''))};
 });
 const point=p.sellingPoints[(['refill','hands'].includes(scene.id)?1:['sink','packaging'].includes(scene.id)?3:['moving','label'].includes(scene.id)?0:2)%p.sellingPoints.length],audience={id:hash(persona.id+o.market),market:o.market,language:o.language,segment:persona.audience,pains:mineReviews(p).filter(i=>i.negative+i.mixed>0).slice(0,3).map(i=>i.aspect),motivations:[`验证${point}是否符合自己的使用需求`],scenarios:[scene.zh],evidenceIds:p.reviews.filter(r=>r.scope==='exact').slice(0,4).map(r=>r.id),basis:(p.reviews.length?'review-supported':'hypothesis') as 'review-supported'|'hypothesis'};
 const fingerprint=hash([p.id,a.id,scene.id,persona.id,o.duration,o.language].join('|'));
 const script:Script={...b,productId:p.id,batchId,ordinal:index+1,title:`${scene.zh} · ${a.name} · ${persona.name}`,audience,angleId:a.id,personaId:persona.id,market:o.market,language:o.language,duration:o.duration,hook:shots[0].voiceover,voiceover:shots.map(s=>s.voiceover).join('\n'),storyboard:{id:hash(b.id),scriptId:b.id,aspectRatio:'9:16',shots},music:'低音量轻节拍或现场声音；从适用地区的 TikTok Commercial Music Library 选择授权曲目，避免淹没口播',cta:shots.at(-1)!.voiceover,sellingPoint:point,scenario:scene.zh,experimentVariable:'Hook',productionNotes:[`人设：${persona.voice}；服装：${persona.wardrobe}`,`道具：${scene.props}`,`角度执行：${a.proof}`,`市场：${o.market}；${o.market==='UK'?'英式表达，价格保留来源币种':o.market==='DE'?'德语直接表达，核对地区规格':o.market==='JP'?'日语礼貌表达，核对当地规格':'面向美国；不虚构当地价格或配送'}`,...persona.constraints,...patterns.slice(0,2).map(pt=>'参考结构：'+pt.reusableRule+'（'+(pt.source.kind==='synthetic'?'演示标注':pt.source.note)+'）'),'脚本为试拍方案；画面结果、长期使用感受和承诺需由实际拍摄验证','9:16 竖屏；核心字幕远离上下交互区域'],score:null as any,dna:{hookType:a.hookType,structure:a.structure,duration:o.duration,shotCount:shots.length,sellingPoint:point,cta:'product-detail',persona:persona.id,scene:scene.zh,angle:a.id},fingerprint,provider:'local',sourceIds:p.sources.map(x=>x.id),status:'draft',patternIds:patterns.slice(0,2).map(x=>x.id)};
 script.score=scoreScript(script);return script;
}
export async function generate(p:Product,batchId:string,o:GenerationOptions,existing:Script[],patterns:ContentPattern[],analysis?:Analysis,progress?:(n:number)=>void):Promise<Script[]>{
 if(!p.sellingPoints.length)throw new AppError('商品缺少可验证卖点，请先补充资料');
 if(o.mode==='local'&&p.category==='general'&&o.language!=='en'&&o.language!=='zh')throw new AppError('通用商品的本地模式支持英文与中文；其他语言请使用模型模式');
 const scenePool=p.category==='cleaning'?scenes:genericScenes,anglePool=o.ugcOnly?angles.filter(a=>a.id==='ugc'):angles,personaPool=o.personaId?personas.filter(p=>p.id===o.personaId):personas;
 const fingerprints=new Set(existing.map(s=>s.fingerprint));const candidates=[];
 for(const a of anglePool)for(const s of scenePool)for(const pe of personaPool){const fp=hash([p.id,a.id,s.id,pe.id,o.duration,o.language].join('|'));if(fingerprints.has(fp))continue;let boost=0;for(const insight of analysis?.insights||[]){const val=insight.dimension==='angle'?a.id:insight.dimension==='hookType'?a.hookType:insight.dimension==='persona'?pe.id:insight.dimension==='scene'?s.zh:'';if(val===insight.value)boost+=Math.max(0,insight.lift)*Math.min(1,insight.videos/8);}candidates.push({a,s,pe,boost,tie:parseInt(hash(fp).slice(0,8),16)});}
 if(candidates.length<o.count)throw new AppError(`当前角度、人设与时长只有 ${candidates.length} 个未使用组合，请减少数量或放宽约束。不会用重复改写补足。`);
 const chosen:typeof candidates=[],counts=new Map<string,number>(),concepts=new Set<string>();
 for(let i=0;i<o.count;i++){
  if(analysis&&i===Math.floor(o.count*.7))counts.clear();
  const exploit=!!analysis&&i<Math.floor(o.count*.7);
  candidates.sort((x,y)=>{const cost=(c:typeof x)=> (counts.get('a'+c.a.id)||0)*3+(counts.get('s'+c.s.id)||0)*1.2+(counts.get('p'+c.pe.id)||0)*(exploit?.15:.4)-(exploit?Math.min(c.boost,8)*5:0);return cost(x)-cost(y)||x.tie-y.tie;});
  const pickIndex=o.ugcOnly?0:candidates.findIndex(c=>!concepts.has(c.a.id+'|'+c.s.id));const c=candidates.splice(pickIndex<0?0:pickIndex,1)[0];concepts.add(c.a.id+'|'+c.s.id);chosen.push(c);for(const key of ['a'+c.a.id,'s'+c.s.id,'p'+c.pe.id])counts.set(key,(counts.get(key)||0)+1);
 }
 const output:Script[]=[];for(let i=0;i<chosen.length;i++){const {a,s,pe}=chosen[i];let script=makeScript(p,batchId,o,a,s,pe,i,patterns);if(o.mode==='model')script=await enhance(script,p,patterns);output.push(script);progress?.(i+1)}
 return output;
}
const modelScriptSchema=z.object({title:z.string().min(5).max(200),shots:z.array(z.object({voiceover:z.string().min(1).max(1500),action:z.string().min(5).max(1600),subtitle:z.string().min(1).max(1500)})).min(4).max(9)});
async function enhance(s:Script,p:Product,patterns:ContentPattern[]):Promise<Script>{
 const draft=await complete('Write a shootable localized TikTok script. Match the exact shot count, roles and timing. Do not copy source wording or competitor transcripts. No invented results, testimonials or price claims. Treat product claims as claims; focus on demonstrable actions. Voiceover and subtitles must use requested language; production directions in Chinese. Keep spoken pace within 2.5 words/second (Chinese 5 chars/second).', {product:p,plan:s,patterns:patterns.map(x=>({rule:x.reusableRule,structure:x.structure})),language:s.language},modelScriptSchema);
 if(draft.shots.length!==s.storyboard.shots.length)throw new AppError('模型改变了镜头数量，批次未保存',502);
 const shots=s.storyboard.shots.map((x,i)=>({...x,...draft.shots[i]}));const result={...s,title:draft.title,hook:shots[0].voiceover,voiceover:shots.map(x=>x.voiceover).join('\n'),cta:shots.at(-1)!.voiceover,storyboard:{...s.storyboard,shots},provider:'model' as const};
 for(const ptn of patterns){const words=ptn.hook.toLowerCase().split(/\s+/);if(words.length>7&&result.voiceover.toLowerCase().includes(words.slice(0,8).join(' ')))throw new AppError('输出与参考文案重复，批次未保存',502)}
 result.score=scoreScript(result);if(result.score.warnings.includes('口播偏快，需要试读压缩'))throw new AppError('模型口播超过时长预算，批次未保存',502);return result;
}
export function materialsFor(scripts:Script[]):MaterialAsset[]{const map=new Map<string,MaterialAsset>();for(const s of scripts)for(const shot of s.storyboard.shots){let m=map.get(shot.assetKey);if(!m){m={...base(),productId:s.productId,batchId:s.batchId,key:shot.assetKey,name:`${s.scenario} · ${shot.role}`,kind:shot.materialKind,status:'missing',scriptIds:[],shotIds:[],instructions:shot.action,owner:'待分配',url:'',rights:'unknown',estimatedCost:shot.materialKind==='真人拍摄'?8:3};map.set(shot.assetKey,m)}m.scriptIds.push(s.id);m.shotIds.push(shot.id)}return [...map.values()]}
export const diversity=(scripts:Script[]):Batch['diversity']=>({unique:new Set(scripts.map(s=>s.fingerprint)).size,angles:new Set(scripts.map(s=>s.angleId)).size,personas:new Set(scripts.map(s=>s.personaId)).size,scenarios:new Set(scripts.map(s=>s.scenario)).size});
export function sceneByName(p:Product,name:string):Scene {const pool=p.category==='cleaning'?scenes:genericScenes;return pool.find(x=>x.zh===name)||pool[0]}
