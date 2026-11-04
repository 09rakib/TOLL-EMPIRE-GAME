// Civic identity is carried by massing, permanent roof colors and large symbols.
// Paint changes walls, while each service keeps its landmark features.
import {project} from './isometric.js';
export const civicKinds=['clinic','university','school','police'];
const identity={clinic:{walls:['#f4f1e9','#dfebe9','#b7cdcf'],roof:'#f7f4e9',trim:'#d04f51'},university:{walls:['#e9caa4','#bb795e','#925a4c'],roof:'#963f3f',trim:'#e1bd7c'},school:{walls:['#ffe3a0','#efbd5e','#cf9149'],roof:'#258b81',trim:'#e8a43f'},police:{walls:['#a7bdcf','#496787','#304966'],roof:'#253e5c',trim:'#efc75d'}};
export function civicPalette(kind,paint=0){const style=identity[kind];if(!style)return null;const paints=[style.walls,['#d6e9d9','#a4c5ae','#799c89'],['#f0d7cb','#cfaa98','#ae8273'],['#f4e4ba','#d6bb80','#b59a64'],['#e7dbee','#bca9cc','#9984ae']];return {...style,walls:paints[paint]||style.walls};}
export function civicLayout(kind,w,h,level=1){
 const parts=[],add=(x,y,bw,bh,z,role,label='')=>parts.push({x:x*w,y:y*h,w:bw*w,h:bh*h,z,role,label});
 if(kind==='clinic'){
  add(.08,.16,.24,.43,25+level*5,'ward');add(.68,.16,.24,.43,25+level*5,'ward');
  add(.32,.12,.36,.28,42+level*8,'medical','HOSPITAL');add(.35,.4,.3,.22,16+level*3,'emergency','EMERGENCY');
 }else if(kind==='university'){
  add(.08,.13,.22,.49,23+level*4,'hall');add(.7,.13,.22,.49,23+level*4,'hall');
  add(.3,.1,.4,.24,28+level*5,'hall','UNIVERSITY');add(.44,.32,.12,.14,58+level*6,'clock');
 }else if(kind==='school'){
  add(.08,.1,.69,.22,18+level*3,'classroom','SCHOOL');add(.08,.32,.23,.3,18+level*3,'classroom');
  if(level>=3)add(.77,.1,.15,.22,20+level*3,'classroom');
 }else if(kind==='police'){
  add(.15,.12,.49,.38,27+level*5,'command','POLICE');add(.66,.13,.2,.2,49+level*6,'watch');
  add(.15,.5,.27,.16,13+level*2,'garage');if(level>=3)add(.44,.5,.2,.16,13+level*2,'garage');
 }return parts;
}
export function drawCivicRoof(c,b,polygon,prism){
 const {kind,w,h,z,role,level=1}=b,style=civicPalette(kind,b.paint);if(!style)return false;
 const plane=(points,color)=>polygon(c,points.map(([x,y,zz=z+.7])=>project(x,y,zz)),color);
 plane([[0,0],[w,0],[w,h],[0,h]],style.roof);
 if(kind==='clinic'){
  if(role==='medical'||!role){const cx=w*.5,cy=h*.5,r=Math.min(w,h)*.32,t=r*.32;plane([[cx-t,cy-r],[cx+t,cy-r],[cx+t,cy-t],[cx+r,cy-t],[cx+r,cy+t],[cx+t,cy+t],[cx+t,cy+r],[cx-t,cy+r],[cx-t,cy+t],[cx-r,cy+t],[cx-r,cy-t],[cx-t,cy-t]],style.trim);}
  else if(role==='emergency')prism(c,0,h*.75,w,h*.25,z+3,[style.trim,style.trim,'#a03943'],z);
  else if(level>=3){const p=project(w/2,h/2,z+1);c.strokeStyle='#5d9194';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,Math.min(w,h)*.28,Math.min(w,h)*.14,0,0,7);c.stroke();c.font='bold 13px Arial';c.fillStyle='#4f7e88';c.textAlign='center';c.fillText('H',p.x,p.y+4);}
 }else if(kind==='university'||kind==='school'){
  const rise=role==='clock'?9:kind==='university'?12:8;
  polygon(c,[project(-1,-1,z),project(w/2,-1,z+rise),project(w/2,h+1,z+rise),project(-1,h+1,z)],kind==='school'?'#39a799':'#b15c50');
  polygon(c,[project(w/2,-1,z+rise),project(w+1,-1,z),project(w+1,h+1,z),project(w/2,h+1,z+rise)],style.roof);
  if(role==='clock'){
   const p=project(w/2,h+.6,z-9);c.fillStyle='#fff0cf';c.beginPath();c.arc(p.x,p.y,6,0,7);c.fill();c.strokeStyle='#4c4c54';c.lineWidth=1.5;c.beginPath();c.moveTo(p.x,p.y-4);c.lineTo(p.x,p.y);c.lineTo(p.x+3,p.y+1);c.stroke();
  }else if(kind==='university'){
   for(let x=6;x<w-4;x+=13)prism(c,x,h-3,3,5,z-2,['#f5e5c4','#f1d9b0','#d1b98f'],3);
  }
 }else{
  if(role==='watch'){
   prism(c,1,1,w-2,h-2,z-5,['#7dc4d9','#78b2ce','#518cae'],z-14);
   prism(c,-2,-2,w+4,h+4,z+2,[style.roof,style.roof,style.roof],z-3);
   const p=project(w/2,h/2,z+3);c.strokeStyle='#d0dbe2';c.lineWidth=2;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y-12);c.stroke();c.fillStyle='#ec7476';c.beginPath();c.arc(p.x,p.y-12,2,0,7);c.fill();
  }else if(role==='command'||!role){const p=project(w/2,h/2,z+1);polygon(c,[{x:p.x,y:p.y-12},{x:p.x+12,y:p.y-6},{x:p.x+9,y:p.y+5},{x:p.x,y:p.y+12},{x:p.x-9,y:p.y+5},{x:p.x-12,y:p.y-6}],style.trim);c.fillStyle=style.roof;c.font='bold 15px Arial';c.textAlign='center';c.fillText('★',p.x,p.y+5);}
 }
 return true;
}
// Drawn into the existing cached ground layer; rotation follows the whole site.
export function drawCivicGround(c,b,w,h){
 c.save();c.translate(w/2,h/2);c.rotate((b.rotation||0)*Math.PI/2);c.translate(-w/2,-h/2);
 const rect=(x,y,bw,bh,color)=>{c.fillStyle=color;c.fillRect(x*w,y*h,bw*w,bh*h);};
 rect(.02,.02,.96,.96,b.kind==='police'?'#aebbc3':'#a9bd90');
 rect(.04,.66,.92,.29,b.kind==='university'?'#d4c3a5':b.kind==='school'?'#cfad77':'#8b999d');
 if(b.kind==='school'){
  rect(.38,.37,.52,.25,'#c17451');c.strokeStyle='#fff2cd';c.lineWidth=2;c.strokeRect(w*.4,h*.39,w*.48,h*.21);c.beginPath();c.moveTo(w*.64,h*.39);c.lineTo(w*.64,h*.6);c.stroke();
  for(let i=0;i<3;i++){rect(.48+i*.13,.76,.08,.035,['#5d9bc8','#d9756b','#edce64'][i]);}
 }else if(b.kind==='university'){
  rect(.34,.37,.32,.25,'#6e9c79');rect(.47,.34,.06,.6,'#e9d7b3');rect(.31,.47,.38,.05,'#e9d7b3');
  c.fillStyle='#719eaf';c.beginPath();c.arc(w*.5,h*.5,10,0,7);c.fill();
 }else{
  c.strokeStyle='#e8e5d6';c.lineWidth=1.5;for(let i=0;i<5;i++)c.strokeRect(w*(.08+i*.17),h*.72,w*.12,h*.18);
  if(b.kind==='clinic'){
   rect(.07,.75,.13,.12,'#fff7e7');rect(.1,.79,.07,.03,'#cf4f54');rect(.125,.765,.022,.08,'#cf4f54');rect(.07,.74,.13,.025,'#61a9bf');
  }else{for(let i=0;i<2;i++){rect(.1+i*.17,.76,.08,.11,'#304760');rect(.1+i*.17,.795,.08,.03,'#f2eee2');rect(.1+i*.17,.77,.035,.02,'#d96061');rect(.145+i*.17,.77,.035,.02,'#6ba9e6');}}
 }
 // Landmark flag is part of school grounds, with no per-frame animation cost.
 if(b.kind==='school'){c.strokeStyle='#f7f0d9';c.lineWidth=3;c.beginPath();c.moveTo(w*.88,h*.86);c.lineTo(w*.88,h*.67);c.stroke();rect(.88,.67,.07,.045,'#e26457');}
 c.restore();
}
