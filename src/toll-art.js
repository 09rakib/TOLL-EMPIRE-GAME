import {B} from './balance.js';
import {point,isRoad} from './world.js';
import {project} from './isometric.js';
import {prism,polygon} from './isometric-art.js';

// Derived from road topology, never persisted: old booths adapt on load and edits.
// Axis 0 follows east/west; axis 1 follows north/south.
export function tollAxis(tiles,node){
 const p=point(node),road=(x,y)=>x>=0&&y>=0&&x<B.size&&y<B.size&&isRoad(tiles[y*B.size+x]);
 const score=(dx,dy)=>{let n=0;for(const sign of [-1,1])if(road(p.x+dx*sign,p.y+dy*sign)){n+=10;const type=tiles[(p.y+dy*sign)*B.size+p.x+dx*sign];if(type==='mainRoad')n+=2;if(road(p.x+dx*sign*2,p.y+dy*sign*2))n++;}return n;};
 return score(0,1)>score(1,0)?1:0;
}
const designs=[
 {length:10,span:28,height:20,cabin:13,roof:'#d79b49',wall:'#f0d5a0',shade:'#b08c5c'},
 {length:14,span:42,height:25,cabin:16,roof:'#66a59a',wall:'#e2e5ce',shade:'#829b8a'},
 {length:18,span:46,height:30,cabin:19,roof:'#3e8198',wall:'#bad9dc',shade:'#6994a5'},
 {length:22,span:50,height:35,cabin:22,roof:'#315779',wall:'#93bfcc',shade:'#51758f'},
 {length:26,span:54,height:40,cabin:25,roof:'#303f67',wall:'#c2d8e2',shade:'#7389a6'},
];
export const tollDesign=level=>designs[Math.max(0,Math.min(4,(level||1)-1))];
export function tollSprite(level=1,axis=0,scale=4){
 const s=tollDesign(level),canvas=document.createElement('canvas'),x=-53,y=-s.height-23;
 canvas.width=106*scale;canvas.height=(s.height+65)*scale;const c=canvas.getContext('2d');c.scale(scale,scale);c.translate(-x,-y);
 const pos=(u,v,z=0)=>axis?project(-v,u,z):project(u,v,z);
 const box=(u,v,w,h,z,colors,base=0)=>{if(axis)prism(c,-v-h,u,h,w,z,colors,base);else prism(c,u,v,w,h,z,colors,base);};
 const face=(points,color)=>polygon(c,points.map(p=>pos(...p)),color);
 const wall=[s.wall,s.shade,level>=4?'#355575':'#747e6d'],roof=[s.roof,s.roof,level>=3?'#284b67':'#857451'];
 // Curb islands and booths stay outside the two travel lanes at +/-9.
 box(-s.length/2-1,-27,s.length+2,8,2,['#e4d8a6','#bba771','#94855f']);
 box(-s.length/2,-26,s.length,6,s.cabin,wall,2);
 box(-s.length/2-1,-27,s.length+2,8,s.cabin+3,roof,s.cabin);
 face([[-s.length*.32,-19.8,5],[s.length*.32,-19.8,5],[s.length*.32,-19.8,s.cabin-2],[-s.length*.32,-19.8,s.cabin-2]],'#83cbdc');
 if(level>=2){
  box(-s.length/2-1,22,s.length+2,5,2,['#e4d8a6','#bba771','#94855f']);
  for(const v of [-s.span/2+2,s.span/2-2])box(-s.length/2,v-1,3,2,s.height,['#e7e5ce','#c9cbb9','#9aa9a5'],2);
  // Open gantry and shoulder awnings keep the road lanes readable below.
  box(-s.length/2-1,-s.span/2,s.length+2,6,s.height+2,roof,s.height-1);
  box(-s.length/2-1,s.span/2-6,s.length+2,6,s.height+2,roof,s.height-1);
  box(-s.length/2-1,-s.span/2,4,s.span,s.height+2,roof,s.height-2);
 }else{
  box(-6,-27,12,s.span,s.height,roof,s.height-2);
 }
 // Paired raised gate arms are decorative: toll timing remains simulation-owned.
 for(const v of [-9,9]){
  const side=v<0?-18:18;box(2,side-1,3,2,8,['#f0cf67','#c5a154','#947a45']);
  const start=pos(3,side,8),end=pos(3,v,16+level);c.strokeStyle='#fff1d0';c.lineWidth=2;c.beginPath();c.moveTo(start.x,start.y);c.lineTo(end.x,end.y);c.stroke();
  c.strokeStyle='#df6e5b';c.lineWidth=2;for(const t of [.2,.6]){c.beginPath();c.moveTo(start.x+(end.x-start.x)*t,start.y+(end.y-start.y)*t);c.lineTo(start.x+(end.x-start.x)*(t+.15),start.y+(end.y-start.y)*(t+.15));c.stroke();}
 }
 if(level>=3){
  box(-s.length/2,21,s.length*.65,5,s.cabin-3,wall,2);
  for(const v of [-9,9]){const p=pos(-s.length/2,v,s.height-3);c.fillStyle='#213e4f';c.fillRect(p.x-4,p.y-3,8,7);c.fillStyle='#a9e7a9';c.font='bold 6px Arial';c.textAlign='center';c.fillText('↓',p.x,p.y+3);}
 }
 if(level>=4){
  const p=pos(0,-23,s.cabin+6);c.strokeStyle='#d8ede2';c.lineWidth=1.5;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y-7);c.stroke();c.fillStyle='#5ed6d2';c.fillRect(p.x-3,p.y-10,6,4);
  for(const v of [-24,24])box(-s.length/2,v-1,s.length,2,s.height+3,['#8ae5dd','#69b9be','#427f9c'],s.height+2);
 }
 if(level===5)for(const v of [-s.span/2+1,s.span/2-5]){
  box(-s.length/2,v,s.length-2,4,s.height+3,['#477eaf','#335780','#294a6a'],s.height+2);
  for(let u=-s.length/2+3;u<s.length/2-2;u+=5)face([[u,v,s.height+3.2],[u+.7,v,s.height+3.2],[u+.7,v+4,s.height+3.2],[u,v+4,s.height+3.2]],'#a2d6e8');
 }
 const sign=pos(-s.length/2,level===1?-16:0,s.height+3);
 c.fillStyle=level>=4?'#223956':'#fbebc4';c.fillRect(sign.x-12,sign.y-7,24,9);c.fillStyle=level>=4?'#f4da86':'#526356';c.font='bold 6px Arial';c.textAlign='center';c.fillText(level>=4?'E-TOLL':'TOLL',sign.x,sign.y);
 return {canvas,scale,x,y};
}
