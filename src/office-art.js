import {B} from './balance.js';
import {parkingCell} from './offices.js';
const box=(c,x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}};
export function drawOfficeCampus(c,b){
  const t=B.tile,level=b.level||1,parking=parkingCell(b),colors=[['#91b9c3','#527d8e'],['#92c1ae','#528e7c'],['#d0a3a0','#a17170'],['#ddc791','#a18c56'],['#b8a3cf','#83709f']],[wall,roof]=colors[b.paint||0];
  box(c,b.x*t+1,b.y*t+1,t*2-2,t*2-2,5,'#d2dbc2','#93a48d');
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
    const px=(b.x+dx)*t,py=(b.y+dy)*t;if(b.x+dx===parking.x&&b.y+dy===parking.y)continue;
    box(c,px+4,py+6,t-8,t-12,3,wall,'#547a7a');box(c,px+3,py+3,t-6,8,2,roof);c.fillStyle='#dcecef88';c.fillRect(px+7,py+13,3,t-23);
    for(let row=0;row<Math.min(4,level+1);row++)for(let col=0;col<3;col++)box(c,px+14+col*10,py+15+row*7,6,4,1,level>=4?'#d2ebdc':'#4f819b');
    if(dx<1&&!(b.x+dx+1===parking.x&&b.y+dy===parking.y))box(c,px+t-5,py+10,10,t-22,0,wall);
    if(dy<1&&!(b.x+dx===parking.x&&b.y+dy+1===parking.y))box(c,px+10,py+t-8,t-20,14,0,wall);
    if(level>=3)box(c,px+9,py+6,17,4,1,'#a5c386');if(level===5){c.strokeStyle='#e6ca79';c.lineWidth=2;c.strokeRect(px+5,py+5,t-10,t-10);}
  }
  const x=parking.x*t,y=parking.y*t;box(c,x+1,y+1,t-2,t-2,3,'#758587','#aebbaa');
  for(const u of [8,27]){c.strokeStyle='#f0eddb';c.lineWidth=1;c.strokeRect(x+u,y+7,16,31);}
  c.fillStyle='#dbead7';c.font='bold 9px Arial';c.textAlign='center';c.fillText('P',x+8,y+51);
  // Open driveways on the two exterior edges of the parking corner.
  if(parking.x===b.x)c.fillRect(x,y+39,6,12);else c.fillRect(x+t-6,y+39,6,12);
  if(parking.y===b.y)c.fillRect(x+45,y,10,5);else c.fillRect(x+45,y+t-5,10,5);
  box(c,b.x*t+6,b.y*t+2,35,11,3,'#fff5d7','#a8b99b');c.fillStyle='#476a5b';c.font='bold 7px Arial';c.fillText('OFFICE '+level,b.x*t+23,b.y*t+10);
}
