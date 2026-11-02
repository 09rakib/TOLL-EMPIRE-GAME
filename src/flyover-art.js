import {B} from './balance.js';
import {point} from './world.js';
import {project} from './isometric.js';
import {polygon} from './isometric-art.js';
export function flyoverHeight(index,count){return Math.min(28,Math.min(index,count-1-index)*14);}
// Neighbouring segments share the exact same mitered edge, including at L bends.
export function flyoverGeometry(span){const centers=span.nodes.map((n,i)=>{const p=point(n);return {x:(p.x+.5)*B.tile,y:(p.y+.5)*B.tile,z:flyoverHeight(i,span.nodes.length)};});const edges=centers.map((p,i)=>{const a=centers[Math.max(0,i-1)],b=centers[Math.min(centers.length-1,i+1)],normal=(u,v)=>{const len=Math.hypot(v.x-u.x,v.y-u.y)||1;return {x:-(v.y-u.y)/len,y:(v.x-u.x)/len};},n1=normal(i===0?p:a,i===0?b:p),n2=normal(i===centers.length-1?a:p,i===centers.length-1?p:b);let nx=n1.x+n2.x,ny=n1.y+n2.y,len=Math.hypot(nx,ny);if(!len){nx=n2.x;ny=n2.y;len=1;}nx/=len;ny/=len;const radius=19/Math.max(.5,nx*n2.x+ny*n2.y);return {left:{x:p.x+nx*radius,y:p.y+ny*radius,z:p.z},right:{x:p.x-nx*radius,y:p.y-ny*radius,z:p.z},center:p};});return {centers,edges,segments:edges.slice(1).map((b,i)=>({a:edges[i],b}))};}
export function flyoverSprite(geometry){const vertices=geometry.edges.flatMap(e=>[e.left,e.right,{...e.center,z:0}]).map(p=>project(p.x,p.y,p.z));const minX=Math.floor(Math.min(...vertices.map(p=>p.x)))-7,minY=Math.floor(Math.min(...vertices.map(p=>p.y)))-9,maxX=Math.ceil(Math.max(...vertices.map(p=>p.x)))+7,maxY=Math.ceil(Math.max(...vertices.map(p=>p.y)))+9,canvas=document.createElement('canvas');canvas.width=(maxX-minX)*2;canvas.height=(maxY-minY)*2;const c=canvas.getContext('2d');c.scale(2,2);c.translate(-minX,-minY);const p=(v,dz=0)=>project(v.x,v.y,Math.max(0,v.z+dz));
 c.strokeStyle='#35545730';c.lineWidth=38;c.lineJoin='round';c.beginPath();for(const [i,v]of geometry.centers.entries()){const q=project(v.x+6,v.y+5);if(i)c.lineTo(q.x,q.y);else c.moveTo(q.x,q.y);}c.stroke();
 for(let i=2;i<geometry.centers.length-2;i+=3){const v=geometry.centers[i],bottom=project(v.x,v.y),top=p(v,-3);c.strokeStyle='#8fa69f';c.lineWidth=6;c.beginPath();c.moveTo(bottom.x,bottom.y);c.lineTo(top.x,top.y);c.stroke();}
 // Side faces are drawn before the continuous road surface; no transverse tile rims.
 for(const {a,b}of geometry.segments){for(const side of ['left','right'])polygon(c,[p(a[side]),p(b[side]),p(b[side],-4),p(a[side],-4)],side==='left'?'#b6c7ba':'#879e99');}
 for(const {a,b}of geometry.segments)polygon(c,[p(a.left),p(b.left),p(b.right),p(a.right)],'#788c91','#788c91');
 c.strokeStyle='#e4e7cf';c.lineWidth=2;for(const side of ['left','right']){c.beginPath();for(const [i,e]of geometry.edges.entries()){const q=p(e[side],2);if(i)c.lineTo(q.x,q.y);else c.moveTo(q.x,q.y);}c.stroke();}
 c.strokeStyle='#f0dfb2';c.lineWidth=1.3;c.setLineDash([8,5]);c.beginPath();for(const [i,v]of geometry.centers.entries()){const q=p(v,.4);if(i)c.lineTo(q.x,q.y);else c.moveTo(q.x,q.y);}c.stroke();c.setLineDash([]);return {canvas,scale:2,x:minX,y:minY};}
