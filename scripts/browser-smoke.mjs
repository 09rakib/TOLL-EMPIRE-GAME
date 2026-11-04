// Isolated Chrome/CDP smoke checks. Never opens the player's browser profile.
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import {readFile,mkdtemp,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {Simulation} from '../src/simulation.js';
import {serialize} from '../src/storage.js';
const root=process.cwd(),assetRoot=path.resolve(process.env.TOLL_GAME_ASSETS||root),profile=await mkdtemp(path.join(os.tmpdir(),'toll-feature-smoke-'));
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const base=url.pathname.startsWith('/scripts/')?root:assetRoot;const file=path.resolve(base,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(base+path.sep))throw Error();const body=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'text/plain'}).end(body);}catch{res.writeHead(404).end();}});
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
 const g=new Simulation();g.trees.clear();g.coins=100000;g.campaign.tutorial.done=true;g.build(19*55+14,'home');g.build(21*55+18,'clinic');g.build(40*55+40,'parking');
 const injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('toll-empire-planner-v4',${JSON.stringify(JSON.stringify(serialize(g)))});`});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1.5,mobile:false});
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
 let ready=false;for(let i=0;i<100;i++){const r=await send('Runtime.evaluate',{expression:"!!document.querySelector('#overlay-panel')"});if(r.result.value){ready=true;break;}await delay(100);}if(!ready)throw Error('App did not initialize: '+errors.join('\n'));
 await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
 const result=await send('Runtime.evaluate',{expression:"import('/scripts/browser-smoke-tests.js').then(m=>m.run())",awaitPromise:true,returnByValue:true});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const click=async(x,y)=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});await delay(80);};
 await evaluate("document.querySelector('#pause-city').click()");
 const homePoint=await evaluate("import('/src/isometric.js').then(({project})=>{const c=document.querySelector('#map').getBoundingClientRect(),p=project(-5*56,-1*56,20);return {x:c.left+c.width/2+p.x*.78,y:c.top+c.height/2+p.y*.78};})");
 await click(homePoint.x,homePoint.y);
 if(!await evaluate("!document.querySelector('#building-panel').hidden"))throw Error('Physical map click did not select the home');result.result.value.push('physical pointer selects building');
 await evaluate("document.querySelector('#rotate-building').click()");if(!await evaluate("document.querySelector('#edit-building-note').textContent.includes('90 degrees')"))throw Error('Rotation button failed');result.result.value.push('inspector rotates property');
 await evaluate("document.querySelector('#move-building').click()");
 const destination=await evaluate("import('/src/isometric.js').then(({project})=>{const c=document.querySelector('#map').getBoundingClientRect(),p=project(-3*56,-1*56);return {x:c.left+c.width/2+p.x*.78,y:c.top+c.height/2+p.y*.78};})");await click(destination.x,destination.y);
 if(!await evaluate("document.querySelector('#build-guide').hidden&&document.querySelector('#toast').textContent.includes('Property moved')"))throw Error('Move gesture failed');result.result.value.push('physical pointer moves property');
 const pixelFrame=await evaluate("new Promise((resolve,reject)=>{const f=document.createElement('iframe');f.style.cssText='position:fixed;left:-10000px;width:500px;height:700px';f.src='/scripts/underpass-pixel-test.html';f.onload=()=>{const raw=f.contentDocument.body.dataset.pixelResult;if(!raw)reject(Error('Missing pixel result'));else resolve(JSON.parse(raw));f.remove();};document.body.append(f);})");
 if(pixelFrame.failures.length||pixelFrame.checks!==18)throw Error('Underpass pixel regression: '+JSON.stringify(pixelFrame));result.result.value.push('18 underpass pixel positions pass');
 await delay(800);
 const savedHome=await evaluate("JSON.parse(localStorage.getItem('toll-empire-planner-v4')).buildings.find(b=>b.kind==='home')");if(savedHome.x!==16||savedHome.rotation!==1)throw Error('Edited city was not saved');
 if(!process.env.TOLL_GAME_ASSETS){
   await evaluate('navigator.serviceWorker.ready.then(()=>true)');await send('Network.enable');await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await send('Page.reload');
   let loaded=false;for(let i=0;i<100;i++){try{if(await evaluate("!!document.querySelector('#overlay-panel')")){loaded=true;break;}}catch{}await delay(100);}if(!loaded)throw Error('Offline app reload failed');
   const restoredPoint=await evaluate("import('/src/isometric.js').then(({project})=>{const c=document.querySelector('#map').getBoundingClientRect(),p=project(-3*56,-1*56,20);return {x:c.left+c.width/2+p.x*.78,y:c.top+c.height/2+p.y*.78};})");await click(restoredPoint.x,restoredPoint.y);
   if(!await evaluate("!document.querySelector('#building-panel').hidden&&document.querySelector('#edit-building-note').textContent.includes('90 degrees')"))throw Error('Edited property did not survive offline reload');result.result.value.push('offline reload restores moved and rotated city');await evaluate("document.querySelector('#close-building').click()");
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3.5,mobile:false});await evaluate("window.dispatchEvent(new Event('resize'))");await delay(100);if(!await evaluate("Math.abs(document.querySelector('#map').width/document.querySelector('#map').clientWidth-2)<.01"))throw Error('High-DPR screen is not rendered at 2x');result.result.value.push('high-DPR phone viewport renders at 2x density');
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});await delay(100);if(!await evaluate('document.documentElement.scrollWidth<=innerWidth'))throw Error('Desktop overflow');result.result.value.push('desktop layout has no horizontal overflow');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1.5,mobile:false});await delay(100);
 if(errors.length)throw Error(errors.join('\n'));
 const shot=await send('Page.captureScreenshot',{format:'png'});const screenshot=path.join(profile,'city-smoke.png');await writeFile(screenshot,Buffer.from(shot.data,'base64'));
 console.log(JSON.stringify({passed:result.result.value,viewport:'390x844',screenshot,errors},null,2));
 if(process.argv.includes('--civic-review')){
  await send('Emulation.setDeviceMetricsOverride',{width:1080,height:1255,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/scripts/civic-showcase.html`});
  let ready=false;for(let i=0;i<100;i++){if(await evaluate("document.body?.dataset.ready==='true'")){ready=true;break;}await delay(100);}if(!ready)throw Error('Civic review did not render');
  const artShot=await send('Page.captureScreenshot',{format:'png'}),artPath=path.join(profile,'civic-review.png');await writeFile(artPath,Buffer.from(artShot.data,'base64'));console.log(JSON.stringify({civicReview:artPath}));
 }
}catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);ws?.close();chrome.kill();server.closeAllConnections();server.close();}
