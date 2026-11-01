// Real rAF benchmark runner: keep page load pending until measured frames finish.
// Chrome virtual-time budgets freeze performance.now() inside a task and cannot time rendering.
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import {readFile,mkdtemp} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const root=process.cwd(),chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
let clock,report,resolveReport;const finished=new Promise(resolve=>resolveReport=resolve);
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/frame-clock'){clock=res;if(report)res.writeHead(204).end();return;}if(url.pathname==='/benchmark-done'){let body='';for await(const chunk of req)body+=chunk;report=JSON.parse(body);res.writeHead(200).end('ok');clock?.writeHead(204).end();resolveReport(report);return;}const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}let body=await readFile(file);const ext=path.extname(file);if(ext==='.html')body=body.toString().replace('<script type="module">','<img hidden src="/frame-clock"><script type="module">');res.writeHead(200,{'Content-Type':ext==='.js'?'text/javascript':ext==='.html'?'text/html':'text/plain'}).end(body);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const profile=await mkdtemp(path.join(os.tmpdir(),'toll-iso-render-'));
const args=['--headless','--no-first-run','--no-proxy-server',`--user-data-dir=${profile}`,'--window-size=500,930','--hide-scrollbars','--dump-dom',`http://127.0.0.1:${server.address().port}/scripts/isometric-benchmark.html${process.argv.includes('--long')?'?frames=600&warmup=120':''}`];if(process.argv.includes('--mobile-dpr'))args.unshift('--force-device-scale-factor=3');if(process.argv.includes('--software'))args.unshift('--disable-gpu');
const child=spawn(chrome,args,{windowsHide:true,stdio:['ignore','ignore','pipe']});let errors='';child.stderr.on('data',b=>{if(errors.length<2000)errors+=b;});const timer=setTimeout(()=>{child.kill();resolveReport({error:'Benchmark timed out',details:errors});},30000);
try{const result=await finished;console.log(JSON.stringify(result,null,2));if(result.error)process.exitCode=1;}finally{clearTimeout(timer);setTimeout(()=>child.kill(),1000).unref();server.closeAllConnections();server.close();}
