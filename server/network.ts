// Adapted from ../ai-seo-geo-agent/server/network.ts; see docs/REUSE.md.
import https from 'node:https';
import http from 'node:http';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
function validSite(raw:string) { const u=new URL(raw); if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw new Error('仅支持不含凭据的 HTTP(S) URL'); }
export function publicAddress(address:string) {
  if(isIP(address)===4){const [a,b]=address.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19)||a===192&&b===0);}
  if(isIP(address)===6){const s=address.toLowerCase();return /^2[0-9a-f]{3}:/.test(s) && !s.startsWith('2001:db8:') && !s.startsWith('2002:') && !s.startsWith('2001:0:');}
  return false;
}
export async function request(raw:string, options:{method?:string;headers?:Record<string,string>;body?:string;redirects?:number;maxBytes?:number}={}):Promise<{status:number;text:string;url:string;bytes:Buffer}> {
  validSite(raw);const u=new URL(raw);
  if(!['','80','443'].includes(u.port))throw new Error('仅支持网站标准 HTTP(S) 端口');
  const addresses=await Promise.race([lookup(u.hostname.replace(/^\[|\]$/g,''),{all:true}),new Promise<never>((_,reject)=>{const timer=setTimeout(()=>reject(new Error('DNS 查询超时')),6000);timer.unref();})]);
  if(!addresses.length||addresses.some(a=>!publicAddress(a.address)))throw new Error('不允许访问本地、私有或保留网络地址');
  const pinned=addresses[0];
  const result=await new Promise<{status:number;text:string;bytes:Buffer;location?:string}>((resolve,reject)=>{
    const req=(u.protocol==='https:'?https:http).request(u,{method:options.method||'GET',headers:{'User-Agent':'ContentGrowthAgent/1.0','Accept':'text/html, application/json',...options.headers},lookup:((_host:unknown,opts:any,cb:any)=>opts?.all?cb(null,[pinned]):cb(null,pinned.address,pinned.family)) as any},res=>{
      const chunks:Buffer[]=[];let size=0;
      res.on('data',(b:Buffer)=>{size+=b.length;if(size>(options.maxBytes||2_000_000)){req.destroy(new Error('响应超过大小限制'));return;}chunks.push(b);});
      res.on('end',()=>resolve({status:res.statusCode||0,text:Buffer.concat(chunks).toString('utf8'),bytes:Buffer.concat(chunks),location:res.headers.location}));res.on('error',reject);
    });const timeout=setTimeout(()=>req.destroy(new Error('请求超时（25 秒）')),25000);req.on('close',()=>clearTimeout(timeout));req.on('error',reject);if(options.body)req.write(options.body);req.end();
  });
  if(result.status>=300&&result.status<400&&result.location){
    if((options.redirects||0)>=3)throw new Error('重定向次数过多');
    if(options.method && options.method!=='GET')throw new Error('API 返回重定向，请核对接口地址');
    const next=new URL(result.location,u);if(options.headers?.Authorization && next.origin!==u.origin)throw new Error('拒绝携带凭证跨域重定向');
    return request(next.href,{...options,redirects:(options.redirects||0)+1});
  }
  return {status:result.status,text:result.text,url:raw,bytes:result.bytes};
}
export async function jsonRequest(url:string,body:unknown,headers:Record<string,string>={}) {
  const r=await request(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  if(r.status<200||r.status>=300)throw new Error(`上游服务返回 HTTP ${r.status}，请检查凭证、额度和权限`);
  try{return JSON.parse(r.text);}catch{throw new Error('上游服务未返回有效 JSON');}
}
