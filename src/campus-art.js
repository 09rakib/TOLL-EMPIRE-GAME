// Original Canvas campuses inspired by the supplied five-level references.
import {B} from './balance.js';
const box=(c,x,y,w,h,color,r=3)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
const text=(c,t,x,y,size,color='#fff')=>{c.fillStyle=color;c.font=`bold ${size}px Arial`;c.textAlign='center';c.fillText(t,x,y);};
function tree(c,x,y){box(c,x-2,y,4,13,'#897450',1);for(const [dx,dy,r,color]of [[0,0,10,'#46885b'],[-4,-6,8,'#75ac62'],[4,-7,7,'#91be69']]){c.fillStyle=color;c.beginPath();c.arc(x+dx,y+dy,r,0,7);c.fill();}}
function lamp(c,x,y,level){box(c,x-1,y,2,13,'#4a6d81',1);c.fillStyle=level>=3?'#72def4':'#fff3b5';c.beginPath();c.arc(x,y,3,0,7);c.fill();}
export function parkingCapacity(b){return 4+((b.level||1)-1)*2;}
export function parkingBay(b,slot){return {x:b.x*B.tile+25+(slot%6)*35,y:b.y*B.tile+65+Math.floor(slot/6)*70};}
export function drawCampus(c,b){
 const T=B.tile,S=(b.footprint||1)*T,L=b.level||1,kind=b.kind||'clinic',hospital=b.type===4,police=kind==='police',parking=kind==='parking',university=kind==='university',store=kind==='shop';
 c.save();c.translate(b.x*T,b.y*T);if(store)c.scale(.5,.5);const size=store?224:S;
 const paints=[['#eff0e6','#2988bd'],['#cce3d5','#318e7c'],['#eed5c9','#be6656'],['#f0dfb6','#bc9442'],['#d7cbe5','#8265a9']], [wall,trim]=paints[b.paint||0];
 box(c,2,2,size-4,size-4,['#9bbf77','#93bd70','#84b36b','#78ad69','#68a56b'][L-1],7);box(c,9,10,size-18,size-21,'#d8dcc8',5);
 if(parking){
  box(c,15,38,194,168,'#576778',4);for(let i=0;i<parkingCapacity(b);i++){const p=parkingBay({...b,x:0,y:0},i);c.strokeStyle='#e6e8dd';c.lineWidth=2;c.strokeRect(p.x-11,p.y-21,23,44);if(L>=4){box(c,p.x-12,p.y-25,25,5,'#438bb8');}}
  box(c,40,12,144,27,trim,5);text(c,'P · PARKING',112,31,16);box(c,13,174,23,26,L>=4?'#3d9dc5':'#ece7ca');text(c,'P',25,192,15,trim);box(c,75,195,7,18,'#dfad3c');box(c,81,198,52,4,'#fff3de',1);for(let i=0;i<5;i++)box(c,83+i*10,198,5,4,'#d65b54',0);text(c,'↑',154,190,21);if(L>=3){box(c,166,13,32,21,'#4e819b');text(c,'EV',182,28,10);}
 }else{
  const top=55-L*5,height=91+L*5;box(c,24,top+8,176,height,'#6c7c7a',4);box(c,20,top,184,height,wall,4);box(c,19,top,186,9,trim,3);
  if(L>=3){box(c,79,top-12,66,height+12,'#258db7',12);for(let x=84;x<143;x+=14)box(c,x,top-4,2,height-8,'#9cdae3',0);}
  for(let row=0;row<Math.min(3,L);row++)for(const x of [31,55,154,178]){box(c,x,top+18+row*22,14,16,'#247da5',1);box(c,x+2,top+20+row*22,3,12,'#91d9e4',0);}
  box(c,90,top+height-34,44,35,'#237e9d',2);box(c,94,top+height-31,16,29,'#6bcbd9',1);box(c,114,top+height-31,16,29,'#6bcbd9',1);
  box(c,65,top+15,94,30,police?'#2459a0':hospital?'#2363a8':university?'#295b95':'#b94d43',3);text(c,hospital?'HOSPITAL':police?'POLICE':university?'UNIVERSITY':store?'STORE':'SUPER MARKET',112,top+35,hospital?12:police?14:10);
  if(hospital){c.fillStyle='#e95450';c.beginPath();c.arc(112,top-2,15,0,7);c.fill();box(c,108,top-12,8,21,'#fff',1);box(c,101,top-5,22,7,'#fff',1);if(L>=2){box(c,31,top-10,39,8,'#6d8794');text(c,'H',51,top-3,8);}}
  if(police){c.fillStyle='#eac958';c.beginPath();c.moveTo(112,top-15);c.lineTo(125,top-9);c.lineTo(122,top+5);c.lineTo(112,top+13);c.lineTo(102,top+5);c.lineTo(99,top-9);c.closePath();c.fill();text(c,'★',112,top+4,18,'#285797');}
  if(university){text(c,'◆',112,top-1,25,'#244475');if(L>=3){box(c,12,109,43,29,trim);box(c,169,109,43,29,trim);text(c,'LIBRARY',34,126,7);text(c,'LAB',190,126,9);}}
  if(!hospital&&!police&&!university){box(c,70,top+51,84,9,L<3?'#d65b4b':'#e3b653');text(c,'🛒',112,top+9,15,trim);}
  box(c,85,top+height+2,54,5,'#e7e5d3',1);box(c,80,top+height+8,64,5,'#eeecdf',1);
  box(c,30,169,164,37,'#7e8b90',2);for(let x=36;x<191;x+=26){c.strokeStyle='#e6e7da';c.lineWidth=1.5;c.strokeRect(x,172,21,29);}
  if(L>=4){box(c,177,top-17,4,17,'#617a8a');c.fillStyle='#e76364';c.beginPath();c.arc(179,top-18,3,0,7);c.fill();box(c,25,top-9,35,7,'#6c9bb3');}
  if(L===5){box(c,71,top-20,82,8,trim);c.fillStyle='#6bc3d4';c.beginPath();c.ellipse(112,188,13,7,0,0,7);c.fill();c.strokeStyle='#c0f1ee';c.lineWidth=2;for(const x of [105,112,119]){c.beginPath();c.moveTo(x,187);c.quadraticCurveTo(x-4,167,112,179);c.stroke();}}
 }
 for(const x of [12,212])for(const y of [27,95,152])tree(c,x,y);for(const x of [17,207])for(const y of [173,207])lamp(c,x,y,L);
 box(c,155,7,57,14,'#f2f0d9',4);text(c,`LEVEL ${L}`,184,17,9,'#3f6866');c.restore();
}
