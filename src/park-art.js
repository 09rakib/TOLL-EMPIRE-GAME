import {B} from './balance.js';
const rect=(c,x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}};
export function drawCityPark(c,b){
  const t=B.tile,s=(b.footprint||4)*t,x=b.x*t,y=b.y*t,level=b.level||1;
  c.save();c.translate(x,y);c.scale(s/224,s/224);
  rect(c,2,2,220,220,8,'#90b66c','#5f8c52');rect(c,7,7,210,210,5,'#a9ca7c');
  // Broad promenade loop and four paths meet at the fountain plaza.
  c.strokeStyle='#ded8b1';c.lineWidth=12;c.lineJoin='round';c.strokeRect(28,28,168,168);
  c.beginPath();c.moveTo(0,112);c.lineTo(224,112);c.moveTo(112,0);c.lineTo(112,224);c.stroke();
  c.strokeStyle='#eee8cc';c.lineWidth=2;c.strokeRect(22,22,180,180);
  // Free-form pond: an original miniature landscape inspired by top-down city plans.
  c.beginPath();c.moveTo(132,37);c.bezierCurveTo(144,23,163,39,178,32);c.bezierCurveTo(204,25,201,55,190,65);c.bezierCurveTo(176,80,180,96,155,91);c.bezierCurveTo(128,87,143,64,131,58);c.bezierCurveTo(122,52,122,44,132,37);c.closePath();c.fillStyle='#68bdcc';c.fill();c.strokeStyle='#eee9ce';c.lineWidth=4;c.stroke();
  c.strokeStyle='#a5e0e6';c.lineWidth=1;c.beginPath();c.moveTo(147,48);c.quadraticCurveTo(163,53,174,45);c.moveTo(153,76);c.quadraticCurveTo(164,81,172,74);c.stroke();
  // Gazebo, flower beds and shaded picnic lawn.
  rect(c,42,38,38,30,3,'#d0b277','#897d57');for(let i=0;i<5;i++)rect(c,44+i*7,39,3,28,1,'#ecd299');
  c.fillStyle='#e5bc68';c.beginPath();c.moveTo(37,39);c.lineTo(61,26);c.lineTo(85,39);c.closePath();c.fill();
  for(let row=0;row<2+Math.min(2,level);row++)for(let col=0;col<5;col++){c.fillStyle=['#e7bf69','#e2a3a0','#dac4dc'][(row+col+(b.paint||0))%3];c.beginPath();c.arc(42+col*10,79+row*5,2.2,0,7);c.fill();}
  // Small sports court with a clear boundary, center circle and goals.
  rect(c,39,137,49,44,3,'#b97665');rect(c,43,141,41,36,2,'#719c61','#eee8d1');c.strokeStyle='#eee8d1';c.lineWidth=1;c.strokeRect(47,145,33,28);c.beginPath();c.moveTo(47,159);c.lineTo(80,159);c.stroke();c.beginPath();c.arc(63.5,159,5,0,7);c.stroke();c.strokeRect(56,145,15,4);c.strokeRect(56,169,15,4);
  // Playground: slide, swings and a round sandpit.
  rect(c,136,137,45,44,10,'#ceba87');rect(c,139,145,14,24,3,'#df977b');rect(c,143,145,6,23,2,'#e8cc70');
  c.strokeStyle='#547d7a';c.lineWidth=2;c.beginPath();c.moveTo(158,163);c.lineTo(161,141);c.lineTo(176,141);c.lineTo(180,163);c.moveTo(166,142);c.lineTo(166,156);c.moveTo(172,142);c.lineTo(172,156);c.stroke();rect(c,164,155,10,3,1,'#826b54');
  c.fillStyle='#e7d7a9';c.beginPath();c.arc(163,175,7,0,7);c.fill();
  // Fountain and concentric seating plaza.
  c.fillStyle='#cfcdb0';c.beginPath();c.arc(112,112,27,0,7);c.fill();c.fillStyle='#f0e8d1';c.beginPath();c.arc(112,112,14,0,7);c.fill();c.fillStyle='#71c7d0';c.beginPath();c.arc(112,112,11,0,7);c.fill();c.strokeStyle='#d0f1ed';c.lineWidth=2;c.beginPath();c.arc(112,112,6,0,7);c.stroke();c.fillStyle='#f5f3d7';c.beginPath();c.arc(112,111,3,0,7);c.fill();
  // Hedges around the block, interrupted at the entrances.
  for(let p=9;p<220;p+=10)if(Math.abs(p-112)>14){for(const [a,d]of [[p,8],[p,216],[8,p],[216,p]]){c.fillStyle=(p%3)?'#557f4b':'#6b9656';c.beginPath();c.arc(a,d,5,0,7);c.fill();c.fillStyle='#88af65';c.beginPath();c.arc(a-1,d-1,2,0,7);c.fill();}}
  for(const [a,d]of [[16,43],[16,181],[207,89],[207,177],[89,16],[172,207]]){c.fillStyle='#466c45';c.beginPath();c.arc(a,d,8,0,7);c.fill();c.fillStyle='#74a05c';c.beginPath();c.arc(a-2,d-2,5,0,7);c.fill();}
  for(const [a,d]of [[94,53],[131,191],[48,94],[171,127],...(level>2?[[94,169],[169,94]]:[])]){rect(c,a,d,13,4,1,'#967755');rect(c,a+1,d-2,11,2,1,'#bd9b64');}
  for(const [a,d]of [[30,109],[194,109],[109,30],[109,194]]){rect(c,a,d,3,8,1,'#5b6f58');c.fillStyle=level>=4?'#f2d77b':'#e4dec0';c.beginPath();c.arc(a+1.5,d,3,0,7);c.fill();}
  c.font='bold 8px Arial';c.textAlign='center';c.fillStyle='#385d3b';c.fillText('CITY PARK · '+level,61,126);
  c.restore();
}
