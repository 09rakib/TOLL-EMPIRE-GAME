import {B} from './balance.js';
import {roadHeading} from './pathfinder.js';
import {districtFor} from './campaign.js';
export const mayorMethods={
 startMayorDrive(){if(this.cars.some(c=>c.mayor))return 'Already exploring.';const start=this.endpoints.find(n=>this.cityConnected.has(n)&&!this.cars.some(c=>c.route[c.index]===n&&c.progress<.8));if(start===undefined)return 'City entrance busy. Try again shortly.';const end=(this.graph.get(start)||[]).find(n=>n<B.layerOffset);if(end===undefined)return 'Connect a road to a city entrance first.';if(!this.addPlannerCar(start,end,null,'car'))return 'Wait for the entrance to clear.';const car=this.cars.at(-1);Object.assign(car,{mayor:true,color:'#f7d35f',driveSpeed:0,steering:0,accelerator:false,brake:false,ramp:false,driveMessage:'Accelerate to explore. Turn commands wait for a junction.'});return null;},
 endMayorDrive(){this.cars=this.cars.filter(c=>!c.mayor);},
 updateMayorCar(car,dt){
  car.driveSpeed=Math.max(0,Math.min(1.3,car.driveSpeed+dt*(car.brake?-4:car.accelerator?1.3:-1.5)));
  const current=car.route[car.index];if(!this.graph.has(current)){car.driveSpeed=0;car.driveMessage='Road removed. Exit drive mode to repair it.';return;}
  if(car.index===car.route.length-1){
   const neighbors=this.graph.get(current)||[],heading=car.heading??0,wanted=(heading+car.steering+4)%4;
   let next=car.ramp?neighbors.find(n=>n%B.layerOffset===current%B.layerOffset&&n!==current):neighbors.find(n=>n%B.layerOffset!==current%B.layerOffset&&roadHeading(current,n,heading)===wanted&&(car.steering!==2||this.uturns.has(current)));
   if(next===undefined&&car.steering!==2)next=neighbors.find(n=>n%B.layerOffset!==current%B.layerOffset&&roadHeading(current,n,heading)===heading);
   if(next===undefined){car.driveSpeed=0;car.driveMessage='Stopped: choose left/right, R for a marked U-turn, or E for a ramp.';return;}
   if(roadHeading(current,next,heading)===wanted&&car.steering)car.steering=0;
   car.ramp=false;car.route=[current,next];car.index=0;car.progress=0;car.destination=next;car.revision=this.revision;car.stranded=false;car.blocked=false;
  }
  if(car.driveSpeed>0){this.advance(car,dt*car.driveSpeed);car.done=false;car.driveMessage=car.waitingNode!==null?'Waiting at toll':car.steering?'Turn queued for next junction':'Exploring your city';}
 },
};
export function setupMayorDrive({getGame,renderer,closeAll,toast}){
 const $=s=>document.querySelector(s),button=document.createElement('button');button.id='mayor-drive';button.textContent='Mayor Drive';$('#menu-actions').append(button);
 const panel=document.createElement('section');panel.id='drive-controls';panel.hidden=true;panel.setAttribute('aria-label','Mayor driving controls');panel.innerHTML='<div><strong>Mayor Drive</strong><button id="exit-drive">Exit drive</button></div><p id="drive-location"></p><small id="drive-status"></small><p>W / Up: accelerate | S / Down: brake | A / D: left / right | R: U-turn | E: ramp. Turns follow the road grid.</p><div class="drive-buttons"><button data-drive="left">Left</button><button data-drive="right">Right</button><button data-drive="uturn">U-turn</button><button data-drive="ramp">Ramp</button><button data-drive="brake">Brake</button><button data-drive="accelerator">Drive</button></div>';$('#city').append(panel);
 let previous=null,previousPaused=false;const car=()=>getGame().cars.find(c=>c.mayor);
 function release(){const c=car();if(c){c.accelerator=false;c.brake=true;c.steering=0;c.ramp=false;}}
 function exit(){release();getGame().endMayorDrive();getGame().paused=previousPaused;panel.hidden=true;$('#city').classList.remove('mayor-driving');if(previous){renderer.camera={...previous};renderer.velocityX=0;renderer.velocityY=0;}previous=null;}
 button.onclick=()=>{closeAll();const error=getGame().startMayorDrive();if(error){toast(error);return;}previousPaused=getGame().paused;getGame().paused=false;previous={...renderer.camera};renderer.targetZoom=null;renderer.velocityX=0;renderer.velocityY=0;panel.hidden=false;$('#city').classList.add('mayor-driving');};$('#exit-drive').onclick=exit;
 const command=key=>{const c=car();if(!c)return;if(key==='left')c.steering=-1;if(key==='right')c.steering=1;if(key==='uturn')c.steering=2;if(key==='ramp')c.ramp=true;if(key==='accelerator'){c.accelerator=true;c.brake=false;}if(key==='brake'){c.brake=true;c.accelerator=false;}};
 for(const b of panel.querySelectorAll('[data-drive]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);command(b.dataset.drive);};b.onpointerup=b.onpointercancel=()=>{const c=car();if(c&&['accelerator','brake'].includes(b.dataset.drive))c[b.dataset.drive]=false;};}
 const keys={ArrowUp:'accelerator',w:'accelerator',ArrowDown:'brake',s:'brake',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',r:'uturn',e:'ramp'};
 document.addEventListener('keydown',e=>{if(!car()||e.target.matches?.('input,textarea,select'))return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();exit();return;}const key=keys[e.key];if(key){e.preventDefault();e.stopImmediatePropagation();command(key);}},{capture:true});
 document.addEventListener('keyup',e=>{const c=car(),key=keys[e.key];if(c&&['accelerator','brake'].includes(key))c[key]=false;});window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);
 let clock=0;return {update(dt){const c=car();if(!c){if(previous)exit();return;}renderer.camera.x=c.worldX*B.tile;renderer.camera.y=c.worldY*B.tile;renderer.velocityX=0;renderer.velocityY=0;clock+=dt;if(clock<.2)return;clock=0;const n=c.route[c.index]%B.layerOffset,b=getGame().buildings.filter(b=>Math.abs(b.x-c.worldX)+Math.abs(b.y-c.worldY)<5),district=districtFor({x:c.worldX,y:c.worldY});$('#drive-location').textContent=(district?.name||'City outskirts')+' | '+getGame().congestionAt(n)+' traffic | Nearby: '+(b.slice(0,3).map(b=>b.kind||'building').join(', ')||'open land');$('#drive-status').textContent=c.driveMessage;}};
}
