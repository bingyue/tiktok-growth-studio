// Adapted from growth-os/server/store.ts and creator-growth-agent/server/store.ts.
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,chmodSync} from 'node:fs';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {Base,Records} from '../shared/types';
export const now=()=>new Date().toISOString();
export const base=():Base=>({id:randomUUID(),createdAt:now(),updatedAt:now()});
export class AppError extends Error {constructor(message:string,public status=400){super(message)}}
export class Store {
 db:DatabaseSync;
 constructor(public filename:string){if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true,mode:0o700});this.db=new DatabaseSync(filename);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL CHECK(json_valid(data)),created_at TEXT NOT NULL,PRIMARY KEY(kind,id)); CREATE INDEX IF NOT EXISTS product_records ON records(kind,json_extract(data,'$.productId')); CREATE UNIQUE INDEX IF NOT EXISTS video_external ON records(json_extract(data,'$.productId'),json_extract(data,'$.externalId'),json_extract(data,'$.source')) WHERE kind='videos';`);if(filename!==':memory:')chmodSync(filename,0o600);this.db.prepare("UPDATE records SET data=json_set(data,'$.status','failed','$.error','服务重启中断，请重试','$.stage','已中断') WHERE kind='jobs' AND json_extract(data,'$.status')='running'").run();}
 list<K extends keyof Records>(kind:K):Records[K][]{return (this.db.prepare('SELECT data FROM records WHERE kind=? ORDER BY created_at,id').all(kind) as {data:string}[]).map(r=>JSON.parse(r.data));}
 get<K extends keyof Records>(kind:K,id:string):Records[K]|undefined {const r=this.db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get(kind,id) as {data:string}|undefined;return r?JSON.parse(r.data):undefined;}
 require<K extends keyof Records>(kind:K,id:string):Records[K]{const r=this.get(kind,id);if(!r)throw new AppError('记录不存在',404);return r;}
 put<K extends keyof Records>(kind:K,record:Records[K]):Records[K]{const r={...record,updatedAt:now()};this.db.prepare('INSERT INTO records VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data').run(kind,r.id,JSON.stringify(r),r.createdAt);return r;}
 transaction<T>(fn:()=>T):T{this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r}catch(e){this.db.exec('ROLLBACK');throw e}}
 close(){this.db.close()}
}
