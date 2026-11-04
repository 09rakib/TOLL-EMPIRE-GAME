// Isolated Chrome/CDP smoke checks. Never opens the player's browser profile.
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import {readFile,mkdtemp,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {Simulation} from '../src/simulation.js';
import {serialize} from '../src/storage.js';
const root=process.cwd(),profile=await mkdtemp(path.join(os.tmpdir(),'toll-feature-smoke-'));
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))throw Error();const body=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'text/plain'}).end(body);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--no-first-run','--no-proxy-server','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws,timer;const pending=new Map();let serial=0;const errors=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function send(method,params={}){const id=++serial;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
try{
 timer=setTimeout(()=>{chrome.kill();for(const p of pending.values())p.reject(Error('Browser smoke timed out'));},45000);
 let port;for(let i=0;i<100;i++){try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await delay(100);}}
 if(!port)throw Error('Chrome did not start');const tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
 await send('Runtime.enable');await send('Page.enable');
 const g=new Simulation();g.trees.clear();g.coins=100000;g.campaign.tutorial.done=true;g.build(19*64+14,'home');g.build(21*64+18,'clinic');g.build(40*64+40,'parking');
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('toll-empire-planner-v4',${JSON.stringify(JSON.stringify(serialize(g)))});`});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1.5,mobile:false});
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
 let ready=false;for(let i=0;i<100;i++){const r=await send('Runtime.evaluate',{expression:"!!document.querySelector('#overlay-panel')"});if(r.result.value){ready=true;break;}await delay(100);}if(!ready)throw Error('App did not initialize: '+errors.join('\n'));
 const result=await send('Runtime.evaluate',{expression:"import('/scripts/browser-smoke-tests.js').then(m=>m.run())",awaitPromise:true,returnByValue:true});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
 if(errors.length)throw Error(errors.join('\n'));
 const shot=await send('Page.captureScreenshot',{format:'png'});const screenshot=path.join(profile,'city-smoke.png');await writeFile(screenshot,Buffer.from(shot.data,'base64'));
 console.log(JSON.stringify({passed:result.result.value,viewport:'390x844',screenshot,errors},null,2));
}catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);ws?.close();chrome.kill();server.closeAllConnections();server.close();}
