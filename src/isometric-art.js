import {project,prismOutline} from './isometric.js';
export function polygon(c,points,fill,stroke){c.beginPath();c.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)c.lineTo(points[i].x,points[i].y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=.8;c.stroke();}}
export function prism(c,x,y,w,h,z,colors,base=0){const a=project(x,y,z),b=project(x+w,y,z),d=project(x,y+h,z),e=project(x+w,y+h,z),bb=project(x+w,y,base),dd=project(x,y+h,base),ee=project(x+w,y+h,base);polygon(c,[d,e,ee,dd],colors[1]);polygon(c,[b,e,ee,bb],colors[2]);polygon(c,[a,b,e,d],colors[0],'#ffffff35');}
const palettes=[['#e8d6b5','#c5aa87','#a78f76'],['#d1e4d5','#9fbfae','#78a18e'],['#efd2c6','#d1a291','#b77f72'],['#f2dfaf','#d0b575','#ac935f'],['#e1d3eb','#b6a4c9','#9280ab']];
export function buildingSprite(body){
 const {w,h,z,kind,level,paint=0}=body,minX=-h*.75-5,minY=-z-20,maxX=w*.75+5,maxY=(w+h)*.375+5,canvas=document.createElement('canvas');canvas.width=Math.ceil(maxX-minX);canvas.height=Math.ceil(maxY-minY);const c=canvas.getContext('2d');c.translate(-minX,-minY);
 const glass=['office','clinic','police','university'].includes(kind),colors=glass&&paint===0?['#c8dfe2','#7fa9bc','#557f99']:palettes[paint];
 prism(c,2,3,w,h,3,['#8b9a8b40','#60766840','#60766840']);prism(c,0,0,w,h,z,colors);
 const trim=kind==='supermarket'||kind==='shop'?'#cf7051':kind==='clinic'?'#398bb9':kind==='police'?'#426a9e':kind==='university'?'#c08a63':palettes[paint][2];
 prism(c,-1,-1,w+2,h+2,3,[trim,trim,trim]);
 for(let row=0;row<Math.min(5,level+1);row++){const zz=9+row*(z-16)/Math.min(5,level+1);for(let i=0;i<Math.max(1,Math.floor(w/14));i++){const x=5+i*14;polygon(c,[project(x,h+.2,zz+7),project(x+7,h+.2,zz+7),project(x+7,h+.2,zz),project(x,h+.2,zz)],glass?'#d7eff3':'#6d929d');}for(let i=0;i<Math.max(1,Math.floor(h/14));i++){const y=5+i*14;polygon(c,[project(w+.2,y,zz+7),project(w+.2,y+7,zz+7),project(w+.2,y+7,zz),project(w+.2,y,zz)],glass?'#a8d1e2':'#547786');}}
 // Doors and continuous roof cornice keep the front legible at phone scale.
 polygon(c,[project(w*.43,h+.4,0),project(w*.62,h+.4,0),project(w*.62,h+.4,13),project(w*.43,h+.4,13)],'#36566a');
 const rim=z-3;polygon(c,[project(0,h+.5,rim+3),project(w,h+.5,rim+3),project(w,h+.5,rim),project(0,h+.5,rim)],trim);polygon(c,[project(w+.5,0,rim+3),project(w+.5,h,rim+3),project(w+.5,h,rim),project(w+.5,0,rim)],trim);
 if(kind==='home'||kind==='garage-home'){const a=project(-2,-2,z),b=project(w+2,-2,z),d=project(-2,h+2,z),e=project(w+2,h+2,z),r=project(w/2,-2,z+13),s=project(w/2,h+2,z+13);polygon(c,[a,r,s,d],'#bc8064');polygon(c,[r,b,e,s],'#8f6355');}
 else{prism(c,w*.18,h*.2,w*.3,h*.26,z+5,['#a3bcc4','#7695a3','#617c8d'],z);if(level>=3){const p=project(w*.5,h*.5,z+8);c.fillStyle='#e8f0e8';c.font=`bold ${kind==='clinic'?15:9}px Arial`;c.textAlign='center';c.fillText(kind==='clinic'?'✚':kind==='police'?'★':kind==='university'?'◆':kind==='office'?'▦':'▰',p.x,p.y);}if(level>=4){const p=project(w*.8,h*.25,z);c.strokeStyle='#506e83';c.lineWidth=2;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y-14);c.stroke();c.fillStyle='#e5c267';c.fillRect(p.x,p.y-14,7,4);}}
 if(body.label){const p=project(w*.5,h+1,z*.67);c.font='bold 8px Arial';c.textAlign='center';const width=Math.min(w*.7+10,c.measureText(body.label).width+8);c.fillStyle=trim;c.fillRect(p.x-width/2,p.y-9,width,12);c.fillStyle='#fff8de';c.fillText(body.label,p.x,p.y);}
 return {canvas,x:minX,y:minY,outline:prismOutline(0,0,w,h,z+13)};
}
export function treeSprite(variant=0){const canvas=document.createElement('canvas');canvas.width=38;canvas.height=52;const c=canvas.getContext('2d');c.fillStyle='#294b3528';c.beginPath();c.ellipse(22,45,13,5,0,0,7);c.fill();c.fillStyle='#8f7859';c.fillRect(17,26,4,18);for(const [x,y,r,color]of [[19,23,14,'#4e8258'],[15,17,12,'#6d9b64'],[22,12,9,variant?'#9cbb76':'#87ad6e']]){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,7);c.fill();}return {canvas,x:-19,y:-44};}
