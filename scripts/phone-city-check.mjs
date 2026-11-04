// Read-only WebView verification. First forward localhost:9237 to this app's
// webview_devtools_remote_<pid> with adb. Raw save backups stay in OS temp.
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {migrate,validateSave} from '../src/storage.js';
const tabs=await(await fetch('http://127.0.0.1:9237/json',{signal:AbortSignal.timeout(10000)})).json();
const tab=tabs.find(t=>t.url.includes('appassets.androidplatform.net'));
if(!tab)throw Error('Game WebView not available');
const socket=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{const t=setTimeout(()=>{socket.close();reject(Error('WebView connection timed out'));},10000);socket.onopen=()=>{clearTimeout(t);resolve();};socket.onerror=e=>{clearTimeout(t);reject(e);};});
const timer=setTimeout(()=>{socket.close();throw Error('Phone check timed out');},15000);
try{
 const result=await new Promise((resolve,reject)=>{socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){if(m.error)reject(Error(JSON.stringify(m.error)));else resolve(m.result);}};socket.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:`(()=>{const c=document.querySelector('#map'),raw=localStorage.getItem('toll-empire-planner-v4');return {raw,dpr:devicePixelRatio,canvas:[c.width,c.height],css:[c.clientWidth,c.clientHeight],title:document.title};})()`,returnByValue:true}}));});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.text);
 const {raw,...rendering}=result.result.value,save=JSON.parse(raw),converted=migrate(save);
 if(!validateSave(converted))throw Error('Saved city migration did not validate');
 let backupPath;
 if(process.argv.includes('--backup')){const dir=await mkdtemp(path.join(os.tmpdir(),'toll-phone-city-'));backupPath=path.join(dir,'original-city.json');await writeFile(backupPath,raw);}
 let preservationVerified=false;
 if(save.mapArchive){const original=save.mapArchive;const interior=original.buildings.filter(b=>b.x+(b.width||b.footprint||1)<=55&&b.y+(b.height||b.footprint||1)<=55);for(const b of interior){const found=save.buildings.find(a=>a.x===b.x&&a.y===b.y&&a.type===b.type);if(!found||found.level!==b.level||found.paint!==b.paint)throw Error('An archived interior building changed during resize');}preservationVerified=true;}
 const baselineArg=process.argv.find(a=>a.startsWith('--baseline='));
 if(baselineArg){const before=JSON.parse(await readFile(baselineArg.slice(11),'utf8'));
   for(const b of before.buildings){const found=save.buildings.find(a=>a.x===b.x&&a.y===b.y&&a.type===b.type);if(!found||found.level!==b.level||found.paint!==b.paint)throw Error('An existing building changed during update');}
   if(save.mapSize!==55||save.tiles.length!==3025)throw Error('Phone has not migrated to 55x55');
   if(rendering.canvas[0]/rendering.css[0]<1.99)throw Error('Phone render density is below 2x');
 }
 console.log(JSON.stringify({...rendering,renderScale:rendering.canvas[0]/rendering.css[0],mapSize:save.mapSize,plots:save.tiles.length,buildings:save.buildings.length,coins:Math.floor(save.coins),migrationValid:true,originalCityArchived:!!save.mapArchive,preservationVerified,backupPath},null,2));
}finally{clearTimeout(timer);socket.close();}
