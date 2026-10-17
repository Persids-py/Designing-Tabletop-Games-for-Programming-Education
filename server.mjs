import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/health'){res.writeHead(200,{'Content-Type':'text/plain'});res.end('ok');return;}
    let path=resolve(root,'.'+pathname);
    if(path!==resolve(root)&&!path.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403);res.end();return;}
    try{if((await stat(path)).isDirectory())path=resolve(path,'index.html');}catch{if(extname(path)){res.writeHead(404);res.end('Not found');return;}path=resolve(root,'index.html');}
    const body=await readFile(path);
    res.writeHead(200,{'Content-Type':types[extname(path)]??'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(500);res.end('無法載入頁面');}
});
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`遊戲服務已啟動：http://localhost:${server.address().port}`));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
