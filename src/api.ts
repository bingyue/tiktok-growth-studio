export async function api<T=any>(path:string,body?:unknown,method='POST'):Promise<T>{const r=await fetch('/api'+path,body===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'请求失败');return d}
export const compact=(n:number|null|undefined)=>n==null?'—':new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(n);
export const money=(n:number|null|undefined,currency='USD')=>n==null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:0}).format(n);
export const percent=(n:number|null|undefined)=>n==null?'—':(n*100).toFixed(1)+'%';
