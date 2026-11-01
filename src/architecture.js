import {plotWidth,plotHeight} from './plots.js';
import {drawCampus} from './campus-art.js';
import {B} from './balance.js';
import {drawCityPark} from './park-art.js';
import {drawOfficeCampus} from './office-art.js';
const box=(c,x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}};
export function buildingStyle(b){const level=b.level||1;return {level,floors:level,width:level===1?30:level===2?36:44,height:[0,24,28,32,36,40][level],luxury:level>=4};}
export function drawPlannerBuilding(c,b){
  const T=B.tile,x=b.x*T,y=b.y*T,s=buildingStyle(b),level=s.level;
  if((b.footprint===4&&b.type!==3)||(b.kind==='shop'&&b.footprint===2)){drawCampus(c,b);return;}
  if(b.kind==='garage-home'){c.save();c.translate(x,y);drawPlannerBuilding(c,{...b,kind:'home',width:undefined,height:undefined,x:0,y:0});c.fillStyle='#697d80';c.fillRect(T+2,2,T-4,T-4);c.strokeStyle='#e8e9d4';c.lineWidth=2;c.strokeRect(T+9,7,17,31);c.strokeRect(T+29,7,17,31);c.fillStyle='#e8e9d4';c.font='bold 9px Arial';c.textAlign='center';c.fillText('P',T+28,49);c.restore();return;}
  if(b.type===2&&b.footprint===2){drawOfficeCampus(c,b);return;}
  if(b.type===3&&b.footprint===4){drawCityPark(c,b);return;}
  if(b.type===3){box(c,x+3,y+5,49,46,9,'#8fb47d','#bad0a5');c.strokeStyle='#dfdbb5';c.lineWidth=3;c.beginPath();c.moveTo(x+8,y+44);c.lineTo(x+43,y+12);c.stroke();for(let i=0;i<level+1;i++){const px=x+12+(i%3)*14,py=y+13+Math.floor(i/3)*22;c.fillStyle='#5d8e57';c.beginPath();c.arc(px,py,6,0,7);c.fill();}if(level>=3){box(c,x+18,y+23,20,17,8,'#d9decc');box(c,x+21,y+26,14,11,6,'#6dc1ce');}return;}
  const defaults=[['#f5dfb8','#b46f56'],['#e4c9a7','#b4855f'],['#c3d9d6','#568c9d'],[],['#f0ede3','#b46f65'],['#ead9c0','#c9a968']],paints=[defaults[b.type],['#b5d1c5','#538c7b'],['#e1b4a1','#b87562'],['#e7d8b5','#b29863'],['#cbbfdc','#8e7ba8']];
  const [wall,roof]=paints[b.paint||0],w=s.width,h=s.height,left=x+(T-w)/2,bottom=y+51,top=bottom-h;
  box(c,left+5,top+8,w,h,4,'#263d3b2a');box(c,left-2,bottom-1,w+4,5,2,'#c3c5a3');
  box(c,left,top,w,h,3,wall,'#718b7866');c.fillStyle='#ffffff38';c.fillRect(left+2,top+2,3,h-4);c.fillStyle='#36574a20';c.fillRect(left+w-5,top+2,4,h-3);
  const rows=Math.max(1,Math.min(4,level)),cols=level<3?2:3,windowColor=b.type===2?'#5b96af':b.type===4?'#7aadb4':'#668c97';
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const wx=left+6+col*(w-10)/cols,wy=top+8+row*(h-17)/rows;box(c,wx,wy,5,4,1,windowColor);c.fillStyle='#d6edee8c';c.fillRect(wx+1,wy+1,1,2);}
  if(b.type===0&&level<=3){c.fillStyle=roof;c.beginPath();c.moveTo(left-4,top+4);c.lineTo(left+w/2,top-10);c.lineTo(left+w+4,top+4);c.closePath();c.fill();c.strokeStyle='#f9e3ba99';c.lineWidth=1;c.beginPath();c.moveTo(left+3,top+1);c.lineTo(left+w/2,top-7);c.lineTo(left+w-3,top+1);c.stroke();if(level===2){box(c,left+w-10,top-9,4,8,1,'#bba68b');}}
  else{box(c,left-2,top-4,w+4,8,2,roof);if(level>=3){box(c,left+7,top-9,w-14,7,2,'#dce6df');box(c,left+10,top-8,10,4,1,b.type===5?'#69c3d0':'#80a296');}}
  box(c,left+w/2-4,bottom-10,8,10,1,'#4c716e');
  if(b.type===1){box(c,left-3,bottom-16,w+6,7,1,'#e8d8b3');for(let i=0;i<6;i++){c.fillStyle=i%2?roof:'#fff3d7';c.fillRect(left-3+i*(w+6)/6,bottom-16,(w+6)/6,7);}}
  if(b.type===4){box(c,left+w/2-7,top-3,14,15,3,'#fffaf0','#c6d1c5');c.fillStyle='#d4796b';c.fillRect(left+w/2-2,top,4,10);c.fillRect(left+w/2-5,top+3,10,4);if(level>=3)box(c,left-3,bottom-10,12,10,2,'#b3ceca');if(level===5){c.strokeStyle='#bba467';c.lineWidth=2;c.strokeRect(left+3,top+6,w-6,h-9);}}
  if(b.type===5){box(c,left+w-16,top+7,18,12,2,'#ebcf80','#aa9664');c.fillStyle='#6c6953';c.font='bold 8px Arial';c.textAlign='center';c.fillText(level>=4?'★★★★★':'HOTEL',left+w-7,top+15);if(level>=3){box(c,left-3,bottom-1,17,8,4,'#dddccb');box(c,left,bottom+1,11,4,2,'#6dc5d2');}}
  if(s.luxury){c.fillStyle='#eac86e';c.fillRect(left,top+4,w,2);box(c,left+w-12,bottom-7,13,7,3,'#83aa76');}
  box(c,x+T-21,y+2,19,11,4,'#fff8df','#bdc7ad');c.fillStyle='#647859';c.font='bold 7px Arial';c.textAlign='center';c.fillText(`Lv ${level}`,x+T-11,y+10);
}
export function drawToll(c,n,toll){
  const T=B.tile,x=(n%B.size+.5)*T,y=(Math.floor(n/B.size)+.5)*T,level=toll.level||1,w=34+level*6;
  c.fillStyle='#edc96535';c.fillRect(x-T/2,y-T/2,T,T);box(c,x-w/2+3,y-7,w,20,4,'#243d3b35');
  box(c,x-w/2,y-11,w,15,3,level>=4?'#e4ddc5':'#d7b762','#687b68');
  for(let i=0;i<(level>=3?3:level>=2?2:1);i++){const bx=x+(i-((level>=3?3:level>=2?2:1)-1)/2)*16;box(c,bx-5,y-5,10,18,2,level>=4?'#547b85':'#eee1b1','#7f8c72');box(c,bx-3,y-3,6,5,1,'#9bc5cd');c.fillStyle='#80ba7e';c.beginPath();c.arc(bx,y+9,2,0,7);c.fill();}
  box(c,x-w/2-3,y-19,w+6,11,3,level>=5?'#284b59':level>=3?'#eadcb0':'#eaba49','#a49358');c.fillStyle=level>=5?'#eac86b':'#fff5ca';c.fillRect(x-w/2,y-18,w,2);
  if(level>=3){box(c,x-12,y-32,24,12,3,'#3d655e');c.fillStyle='#cbe7ab';c.font='bold 7px Arial';c.textAlign='center';c.fillText('AUTO',x,y-23);}
  if(level>=5){for(let i=0;i<3;i++)box(c,x-w/2+4+i*12,y-16,10,5,1,'#6c98ab');}
  box(c,x-23,y-54,46,20,7,'#fff8e8','#b7bd9c');c.fillStyle='#6b724e';c.font='bold 10px Arial';c.textAlign='center';c.fillText(`${toll.price} · Lv${level}`,x,y-40);
}
export function drawUpgradeComparison(canvas,item,toll=false){
  const c=canvas.getContext('2d'),level=item.level||1;c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#f0f3e5';c.fillRect(0,0,canvas.width,canvas.height);
  for(let side=0;side<2;side++){c.save();c.translate(side?180:35,0);const sample={...item,level:side?Math.min(5,level+1):level,x:0,y:1};if(toll&&side)sample.price=B.boothTollLimits[sample.level-1];if(toll)drawToll(c,B.size,sample);else if(Math.max(plotWidth(item),plotHeight(item))>1){c.translate(-28,0);const scale=100/(Math.max(plotWidth(item),plotHeight(item))*B.tile);c.scale(scale,scale);sample.y=0;drawPlannerBuilding(c,sample);}else drawPlannerBuilding(c,sample);c.restore();}
  c.fillStyle='#5e7e60';c.font='11px Arial';c.textAlign='center';c.fillText(`Current · Lv ${level}`,63,133);c.fillText(level===5?'Maximum level':`After upgrade · Lv ${level+1}`,208,133);c.font='20px Arial';c.fillStyle='#a8b799';c.fillText('→',138,79);
}
