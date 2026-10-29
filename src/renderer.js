import {B} from './balance.js';
import {id,point,isRoad} from './world.js';
import {THEMES,DISTRICTS} from './campaign.js';
import {drawPlannerBuilding,drawToll} from './architecture.js';
const T=B.tile;
function rounded(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
export class Renderer {
  constructor(canvas,mini,game){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.mini=mini;this.game=game;
    this.camera={x:19*T,y:19*T,zoom:.92};this.width=0;this.height=0;this.heat=false;this.selected=null;this.ghost=null;
    this.terrain=document.createElement('canvas');this.terrain.width=B.size*T;this.terrain.height=B.size*T;this.dirty=true;
    this.resize();
  }
  resize(){const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;this.dpr=this.game.settings.lowPower?1:Math.min(devicePixelRatio||1,2);this.canvas.width=r.width*this.dpr;this.canvas.height=r.height*this.dpr;this.clamp();}
  center(){this.targetZoom=null;this.velocityX=0;this.velocityY=0;this.camera=this.game.mode==='planner'?{x:19.5*T,y:20.5*T,zoom:this.width<600?.8:.85}:{x:19*T,y:19*T,zoom:this.width<600?.65:.72};this.clamp();}
  clamp(){const c=this.camera;const hx=Math.min(B.size*T/2,this.width/2/c.zoom),hy=Math.min(B.size*T/2,this.height/2/c.zoom);c.x=Math.max(hx,Math.min(B.size*T-hx,c.x));c.y=Math.max(hy,Math.min(B.size*T-hy,c.y));}
  screenToWorld(x,y){return {x:(x-this.width/2)/this.camera.zoom+this.camera.x,y:(y-this.height/2)/this.camera.zoom+this.camera.y};}
  tileAt(x,y){const w=this.screenToWorld(x,y);if(w.x<0||w.y<0||w.x>=B.size*T||w.y>=B.size*T)return -1;return id(Math.floor(w.x/T),Math.floor(w.y/T));}
  zoom(amount,x=this.width/2,y=this.height/2,immediate=false){this.zoomAnchor={x,y};this.targetZoom=Math.max(B.zoomMin,Math.min(B.zoomMax,(this.targetZoom??this.camera.zoom)+amount));if(immediate){this.applyZoom(this.targetZoom);this.targetZoom=null;}}
  applyZoom(value){const {x,y}=this.zoomAnchor,before=this.screenToWorld(x,y);this.camera.zoom=value;const after=this.screenToWorld(x,y);this.camera.x+=before.x-after.x;this.camera.y+=before.y-after.y;this.clamp();}
  updateCamera(dt){
    if(this.targetZoom!==null&&this.targetZoom!==undefined){const difference=this.targetZoom-this.camera.zoom;this.applyZoom(this.camera.zoom+difference*(1-Math.exp(-B.zoomEase*dt)));if(Math.abs(difference)<.001){this.applyZoom(this.targetZoom);this.targetZoom=null;}}
    if(!this.dragging){this.camera.x+=(this.velocityX||0)*dt;this.camera.y+=(this.velocityY||0)*dt;this.velocityX=(this.velocityX||0)*Math.exp(-B.panFriction*dt);this.velocityY=(this.velocityY||0)*Math.exp(-B.panFriction*dt);this.clamp();}
  }
  tree(ctx,x,y,s=1){ctx.fillStyle='#607e4724';ctx.beginPath();ctx.ellipse(x+6*s,y+9*s,11*s,6*s,0,0,7);ctx.fill();rounded(ctx,x-1.5*s,y,3*s,13*s,1,'#7f7954');ctx.fillStyle='#74975c';ctx.beginPath();ctx.arc(x,y-3*s,10*s,0,7);ctx.fill();ctx.fillStyle='#86a668';ctx.beginPath();ctx.arc(x-3*s,y-6*s,7*s,0,7);ctx.fill();}
  bake(){
    const c=this.terrain.getContext('2d'),tiles=this.game.tiles,theme=THEMES[this.game.settings.theme];c.fillStyle=theme.grass[0];c.fillRect(0,0,this.terrain.width,this.terrain.height);
    for(let y=0;y<B.size;y++)for(let x=0;x<B.size;x++){
      const n=id(x,y),type=tiles[n],px=x*T,py=y*T;
      if(type==='grass'||type==='building'){
        c.fillStyle=theme.grass[(x*17+y*23)%7===0?1:(x+y)%3===0?2:0];c.fillRect(px,py,T,T);
        if(type==='grass'){
          if((x*7+y*11)%9===0){this.tree(c,px+22,py+23,.8);this.tree(c,px+39,py+40,.6);}
          else if((x*13+y*3)%11===0){c.fillStyle='#96b77c';for(let j=0;j<4;j++)c.fillRect(px+11+j*8,py+23+(j%2)*4,2,3);}
          if(this.game.mode!=='planner'&&x>7&&x<31&&y>8&&y<30&&(x*3+y*7)%17===0){rounded(c,px+8,py+8,41,39,11,'#a5c48a');c.strokeStyle='#d4dfb8';c.lineWidth=4;c.beginPath();c.moveTo(px+11,py+38);c.lineTo(px+44,py+15);c.stroke();this.tree(c,px+17,py+18,.7);this.tree(c,px+41,py+42,.65);}
        }
      }
      if(type==='river'){
        c.fillStyle=theme.water;c.fillRect(px,py,T,T);c.fillStyle='#d4efed45';c.fillRect(px+5+(y%3)*7,py+13,23,2);c.fillRect(px+24,py+35,19,2);
        for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){const a=x+dx,b=y+dy;if(a<0||b<0||a>=B.size||b>=B.size)continue;const t=tiles[id(a,b)];if(t!=='river'&&t!=='bridge'){c.fillStyle='#c9d6ae';if(dx===-1)c.fillRect(px,py,4,T);if(dx===1)c.fillRect(px+T-4,py,4,T);if(dy===-1)c.fillRect(px,py,T,4);if(dy===1)c.fillRect(px,py+T-4,T,4);}}
      }
    }
    for(let y=0;y<B.size;y++)for(let x=0;x<B.size;x++){
      if(!isRoad(tiles[id(x,y)]))continue;
      const px=x*T,py=y*T,road=(a,b)=>a>=0&&b>=0&&a<B.size&&b<B.size&&isRoad(tiles[id(a,b)]);
      const left=road(x-1,y),right=road(x+1,y),up=road(x,y-1),down=road(x,y+1);
      c.fillStyle='#d3d8c0';c.fillRect(px,py,T,T);c.fillStyle=this.game.settings.roadColor==='clay'?'#8a7b70':this.game.settings.roadColor==='midnight'?'#4d5e6a':tiles[id(x,y)]==='mainRoad'?'#5e6e72':'#707c7b';c.fillRect(px+5,py+5,T-10,T-10);
      if(left)c.fillRect(px,py+5,10,T-10);if(right)c.fillRect(px+T-10,py+5,10,T-10);if(up)c.fillRect(px+5,py,T-10,10);if(down)c.fillRect(px+5,py+T-10,T-10,10);
      const intersection=(left||right)&&(up||down);
      if(!intersection){c.strokeStyle='#d7d6b887';c.lineWidth=1.4;c.setLineDash([8,7]);c.beginPath();if(left||right){c.moveTo(px,py+T/2);c.lineTo(px+T,py+T/2);}else{c.moveTo(px+T/2,py);c.lineTo(px+T/2,py+T);}c.stroke();c.setLineDash([]);}
      else{c.fillStyle='#e8e8d0a8';for(let i=0;i<4;i++){if(up)c.fillRect(px+12+i*8,py+5,4,7);if(down)c.fillRect(px+12+i*8,py+T-12,4,7);if(left)c.fillRect(px+5,py+12+i*8,7,4);if(right)c.fillRect(px+T-12,py+12+i*8,7,4);}}
      if(tiles[id(x,y)]==='bridge'){rounded(c,px+1,py,4,T,1,'#eff0dc');rounded(c,px+T-5,py,4,T,1,'#eff0dc');}
      if(tiles[id(x,y)]==='mainRoad'){
        c.strokeStyle='#f0d995';c.lineWidth=1;c.beginPath();
        if(left||right){c.moveTo(px,py+T/2-2);c.lineTo(px+T,py+T/2-2);c.moveTo(px,py+T/2+2);c.lineTo(px+T,py+T/2+2);}
        else{c.moveTo(px+T/2-2,py);c.lineTo(px+T/2-2,py+T);c.moveTo(px+T/2+2,py);c.lineTo(px+T/2+2,py+T);}c.stroke();
        c.strokeStyle='#e0e6d184';c.setLineDash([5,6]);c.beginPath();if(left||right){for(const offset of [14,42]){c.moveTo(px,py+offset);c.lineTo(px+T,py+offset);}}else{for(const offset of [14,42]){c.moveTo(px+offset,py);c.lineTo(px+offset,py+T);}}c.stroke();c.setLineDash([]);
      }
      if(tiles[id(x,y)]==='roundabout'){
        c.fillStyle='#d3d8c0';c.beginPath();c.arc(px+T/2,py+T/2,15,0,7);c.fill();c.fillStyle='#87a66a';c.beginPath();c.arc(px+T/2,py+T/2,11,0,7);c.fill();this.tree(c,px+T/2,py+T/2,.55);
      }
    }
    for(const b of [...this.game.buildings].sort((a,b)=>a.y-b.y))this.building(c,b);
    // Street names are baked once with the neighborhood.
    c.font='500 8px Arial';c.textAlign='center';c.fillStyle='#e5e9d6bd';if(this.game.mode==='planner')c.fillText('F O U N D E R S   R O A D',20*T,20*T+31);else{c.fillText('W I L L O W   B O U L E V A R D',20*T,16*T+31);c.fillText('O A K   A V E N U E',20*T,10*T+31);}
    this.dirty=false;
  }
  building(c,b){
    if(this.game.mode==='planner'&&!b.project){drawPlannerBuilding(c,b);return;}
    const x=b.x*T,y=b.y*T,palettes=[['#e8d2ac','#c79c75'],['#b4c9c2','#7eaaa6'],['#d7b2a2','#b78275'],['#d7d6bd','#aaa98b']];
    if(b.project){
      const paint=['#c7d7ca','#9cc5bc','#d4a18b','#d5c48e','#b6a5ca'][b.paint||0];rounded(c,x+7,y+9,49,43,6,'#304b3a24');rounded(c,x+2,y+2,49,43,5,paint,'#879e88');
      if(b.projectStage<2){c.strokeStyle='#dbc16b';c.lineWidth=4;for(let i=0;i<4;i++){c.beginPath();c.moveTo(x+4+i*12,y+39);c.lineTo(x+12+i*12,y+29);c.stroke();}c.strokeStyle='#526d5e';c.lineWidth=2;c.beginPath();c.moveTo(x+15,y+32);c.lineTo(x+15,y-8);c.lineTo(x+43,y-8);c.lineTo(x+43,y+7);c.stroke();}
      else if(b.project==='hospital'){rounded(c,x+12,y+12,29,22,4,'#edf3e9');c.fillStyle='#c97967';c.fillRect(x+24,y+14,5,18);c.fillRect(x+17,y+20,19,5);}
      else if(b.project==='stadium'){c.fillStyle='#728f5c';c.beginPath();c.ellipse(x+27,y+23,20,14,0,0,7);c.fill();c.strokeStyle='#e8ecd1';c.lineWidth=1;c.strokeRect(x+14,y+14,26,18);c.beginPath();c.moveTo(x+27,y+14);c.lineTo(x+27,y+32);c.stroke();}
      else{rounded(c,x+12,y+7,29,28,4,'#6c8f87');rounded(c,x+16,y+11,21,11,2,'#d9e9dd');c.strokeStyle='#e5ddba';c.lineWidth=2;c.beginPath();c.moveTo(x+16,y+34);c.lineTo(x+12,y+43);c.moveTo(x+36,y+34);c.lineTo(x+40,y+43);c.stroke();}
      rounded(c,x+34,y-9,20,14,5,'#fff5d4','#b8b78b');c.fillStyle='#64764d';c.font='bold 8px Arial';c.textAlign='center';c.fillText(`${b.projectStage+1}/3`,x+44,y+1);return;
    }
    const paint=[palettes[b.type],['#b4c9c2','#7eaaa6'],['#e2b09d','#bf8373'],['#e5d4ad','#bba273'],['#c7b9d6','#9d8fb0']];
    const [wall,roof]=paint[b.paint||0],w=38+b.variant*3,h=31+b.variant*4;
    if(b.type===3&&(b.variant===2||b.managed)){rounded(c,x-3,y-4,57,54,12,'#9ebd80');this.tree(c,x+12,y+17,1.1);this.tree(c,x+41,y+39,.9);rounded(c,x+16,y+43,19,4,1,'#a4906b');return;}
    rounded(c,x+11,y+14,w,h,5,'#45633e22');rounded(c,x+3,y+6,w,h,4,wall);rounded(c,x+3,y+2,w,h-8,4,roof);
    c.fillStyle='#ffffff25';c.fillRect(x+7,y+5,w-8,3);c.fillStyle='#3556534d';
    for(let i=0;i<Math.floor((w-10)/12);i++){rounded(c,x+10+i*12,y+14,6,7,1,b.type===1?'#dae8de':'#fff2d096');}
    rounded(c,x+w/2-1,y+h-3,8,10,1,'#667568');
    if(b.type===0){c.fillStyle='#a27c60';c.beginPath();c.moveTo(x,y+7);c.lineTo(x+w/2+3,y-6);c.lineTo(x+w+6,y+7);c.closePath();c.fill();c.strokeStyle='#b58d6b';c.lineWidth=1;c.beginPath();c.moveTo(x+8,y+5);c.lineTo(x+w/2+3,y-3);c.lineTo(x+w-3,y+5);c.stroke();}
    if(b.type===1){rounded(c,x+9,y+25,w-12,7,1,'#f1e8c9');for(let k=0;k<5;k++){c.fillStyle=k%2?'#ecdcb8':'#76978d';c.fillRect(x+9+k*(w-12)/5,y+25,(w-12)/5,7);}}
    if(b.type===2){rounded(c,x+12,y+7,13,6,1,'#dde1d7');rounded(c,x+w-8,y+10,8,8,2,'#b2b9a8');}
    if(b.variant%2===0)this.tree(c,x+w+9,y+h,.65);
    if(b.managed){rounded(c,x+w-10,y-7,18,14,5,'#fff6d5','#b6b98b');c.fillStyle='#6d8054';c.font='bold 8px Arial';c.textAlign='center';c.fillText(b.level||1,x+w-1,y+3);}
  }
  drawCar(c,car){
    let x=(car.prevX+(car.worldX-car.prevX)*this.alpha)*T,y=(car.prevY+(car.worldY-car.prevY)*this.alpha)*T;
    if(car.waitingNode!==null&&car.waitingNode!==undefined){const place=this.queueDraw.get(car.waitingNode)||0;this.queueDraw.set(car.waitingNode,place+1);x-=Math.cos(car.angle)*Math.min(3,place*.4)*T;y-=Math.sin(car.angle)*Math.min(3,place*.4)*T;}
    if(x<this.viewLeft-20||x>this.viewRight+20||y<this.viewTop-20||y>this.viewBottom+20)return;
    c.save();c.translate(x,y);c.rotate(car.angle);const bus=car.kind==='bus',length=bus?31:19;if(!this.game.settings.lowPower)rounded(c,-length/2+1,-4,length+1,10,3,'#263d382a');rounded(c,-length/2,-5,length,10,2.5,bus?'#e6bd67':car.color);if(bus){for(let i=0;i<4;i++)rounded(c,-11+i*6,-4,4,8,1,'#527c87');}else rounded(c,-3,-4,7,7,1,'#42625b85');c.fillStyle='#fff5c7';c.fillRect(length/2-2,-4,2,2);c.fillRect(length/2-2,2,2,2);c.restore();
  }
  drawFlyovers(c){
    for(const span of this.game.flyovers){
      const a=point(span.nodes[0]),b=point(span.nodes.at(-1));
      const x=(a.x+.5)*T,y=(a.y+.5)*T,ex=(b.x+.5)*T,ey=(b.y+.5)*T;
      c.lineCap='round';c.strokeStyle='#263e3540';c.lineWidth=44;c.beginPath();c.moveTo(x+7,y+11);c.lineTo(ex+7,ey+11);c.stroke();
      c.strokeStyle='#e9e5cb';c.lineWidth=44;c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey);c.stroke();c.strokeStyle='#718187';c.lineWidth=35;c.stroke();
      c.strokeStyle='#f4e7b5';c.lineWidth=1.5;c.setLineDash([9,8]);c.stroke();c.setLineDash([]);c.lineCap='butt';
      for(const n of [span.nodes[0],span.nodes.at(-1)]){const p=point(n);c.save();c.translate((p.x+.5)*T,(p.y+.5)*T);c.rotate(a.x===b.x?Math.PI/2:0);c.fillStyle='#f1c855';for(let i=0;i<3;i++){c.beginPath();c.moveTo(-8+i*8,-13);c.lineTo(-3+i*8,0);c.lineTo(-8+i*8,13);c.lineTo(-5+i*8,13);c.lineTo(i*8,0);c.lineTo(-5+i*8,-13);c.fill();}c.restore();}
    }
  }
  draw(alpha=1){
    this.alpha=alpha;
    if(this.dirty)this.bake();
    const c=this.ctx,cam=this.camera;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);
    c.translate(this.width/2,this.height/2);c.scale(cam.zoom,cam.zoom);c.translate(-cam.x,-cam.y);c.drawImage(this.terrain,0,0);
    this.viewLeft=cam.x-this.width/2/cam.zoom;this.viewRight=cam.x+this.width/2/cam.zoom;this.viewTop=cam.y-this.height/2/cam.zoom;this.viewBottom=cam.y+this.height/2/cam.zoom;
    if(this.game.settings.night){c.fillStyle='#18344966';c.fillRect(0,0,B.size*T,B.size*T);for(const b of this.game.buildings){c.fillStyle='#ffe7a782';c.fillRect(b.x*T+12,b.y*T+14,5,6);c.fillRect(b.x*T+25,b.y*T+14,5,6);}}
    if(this.districtView)for(const d of DISTRICTS){const [x,y,right,bottom]=d.bounds;c.strokeStyle='#f9f4dbb0';c.lineWidth=2;c.setLineDash([10,9]);c.strokeRect(x*T,y*T,(right-x+1)*T,(bottom-y+1)*T);c.setLineDash([]);c.fillStyle='#47664d';c.font='bold 13px Arial';c.textAlign='left';c.fillText(d.name,x*T+15,y*T+25);}
    if(this.heat)for(const n of this.game.graph.keys()){
      if(n>=B.layerOffset)continue;const p=point(n),level=this.game.congestionAt(n);c.fillStyle=level==='jammed'?'#de7664a0':level==='busy'?'#efc34b90':'#81b17b40';c.fillRect(p.x*T+5,p.y*T+5,T-10,T-10);
      if(level!=='free'){c.save();c.beginPath();c.rect(p.x*T+5,p.y*T+5,T-10,T-10);c.clip();c.strokeStyle='#fff6d56b';c.lineWidth=2;for(let i=-T;i<T*2;i+=level==='jammed'?9:17){c.beginPath();c.moveTo(p.x*T+i,p.y*T);c.lineTo(p.x*T+i+T,p.y*T+T);c.stroke();}c.restore();}
    }
    this.queueDraw??=new Map();this.queueDraw.clear();
    for(const car of this.game.cars)if(car.route[car.index]<B.layerOffset)this.drawCar(c,car);
    this.drawFlyovers(c);
    for(const car of this.game.cars)if(car.route[car.index]>=B.layerOffset)this.drawCar(c,car);
    for(const n of this.game.signals){const p=point(n),x=p.x*T+T-8,y=p.y*T+3;rounded(c,x-5,y-3,10,23,3,'#344c43');for(let i=0;i<2;i++){c.fillStyle=(Math.floor(this.game.time/(B.signalCycle/2))%2)===i?'#8fbe72':'#d18e75';c.beginPath();c.arc(x,y+3+i*9,2.6,0,7);c.fill();}}
    for(const [n,toll] of this.game.tolls)drawToll(c,n,toll);
    for(const effect of this.game.visitEffects){const p=point(effect.node),age=this.game.time-effect.time;c.globalAlpha=Math.max(0,1-age/2);const x=(p.x+.5)*T,y=p.y*T-18-age*14;rounded(c,x-20,y-12,40,19,7,'#fff8d9','#a5bd89');c.fillStyle='#426b45';c.font='bold 10px Arial';c.textAlign='center';c.fillText(`+${Math.floor(effect.amount)}`,x,y+1);c.globalAlpha=1;}
    if(this.selected!==null){const p=point(this.selected);c.strokeStyle='#efbc49';c.lineWidth=3;c.strokeRect(p.x*T+2,p.y*T+2,T-4,T-4);}
    if(this.ghost){const p=point(this.ghost.node);c.fillStyle=this.ghost.valid?'#548c6799':'#cd766a99';c.fillRect(p.x*T+2,p.y*T+2,T-4,T-4);c.strokeStyle=this.ghost.valid?'#edf5d8':'#f9dad2';c.lineWidth=2;c.strokeRect(p.x*T+2,p.y*T+2,T-4,T-4);}
    if(this.spanPreview?.nodes){c.fillStyle=this.spanPreview.error?'#cd766a88':'#548c6788';for(const n of this.spanPreview.nodes){const p=point(n);c.fillRect(p.x*T+3,p.y*T+3,T-6,T-6);}const p=point(this.spanPreview.nodes.at(-1));rounded(c,p.x*T-15,p.y*T-25,86,23,7,'#fff9eb');c.fillStyle='#345343';c.font='bold 11px Arial';c.textAlign='center';c.fillText(`${this.spanPreview.cost} coins`,p.x*T+28,p.y*T-9);}
    c.setTransform(this.dpr,0,0,this.dpr,0,0);
    // Soft cream vignette keeps the HUD legible without blocking the map.
    const fade=c.createLinearGradient(0,0,0,Math.min(this.height*.45,260));fade.addColorStop(0,'#e9eed2b8');fade.addColorStop(.65,'#e9eed230');fade.addColorStop(1,'#e9eed200');c.fillStyle=fade;c.fillRect(0,0,this.width,260);
    this.drawMini();
  }
  drawMini(){const c=this.mini.getContext('2d'),w=this.mini.width,h=this.mini.height;c.drawImage(this.terrain,0,0,w,h);for(const span of this.game.flyovers){const a=point(span.nodes[0]),b=point(span.nodes.at(-1));c.strokeStyle='#f1c861';c.lineWidth=2;c.beginPath();c.moveTo((a.x+.5)/B.size*w,(a.y+.5)/B.size*h);c.lineTo((b.x+.5)/B.size*w,(b.y+.5)/B.size*h);c.stroke();}c.strokeStyle='#fff9e7';c.lineWidth=2;const cam=this.camera;c.strokeRect((cam.x-this.width/2/cam.zoom)/(B.size*T)*w,(cam.y-this.height/2/cam.zoom)/(B.size*T)*h,this.width/cam.zoom/(B.size*T)*w,this.height/cam.zoom/(B.size*T)*h);for(const [n]of this.game.tolls){const p=point(n);c.fillStyle='#f7bd38';c.beginPath();c.arc(p.x/B.size*w,p.y/B.size*h,3,0,7);c.fill();}}
}
