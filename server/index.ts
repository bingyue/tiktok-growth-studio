import {resolve} from 'node:path';
import {createServer as createHttpServer} from 'node:http';
import express from 'express';
import {Store} from './store';
import {createApp} from './app';
const store=new Store(resolve(process.env.DATA_DIR||'data','studio.sqlite'));
const {app}=createApp(store);
app.use('/case-assets',express.static(resolve('docs/case-assets'),{dotfiles:'deny'}));
const server=createHttpServer(app);
if(process.argv.includes('--production')){app.use(express.static(resolve('dist')));app.get('/{*path}',(_req,res)=>res.sendFile(resolve('dist/index.html')))}else{const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true,hmr:{server}},appType:'spa'});app.use(vite.middlewares)}
const port=Number(process.env.PORT||4348);server.listen(port,'127.0.0.1',()=>console.log(`TikTok Growth Studio: http://127.0.0.1:${port}`));
process.on('SIGTERM',()=>server.close(()=>{store.close();process.exit(0)}));
