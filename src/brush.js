import {B} from './balance.js';
// Four-connected traces fill skipped pointer samples without diagonal gaps.
export function traceTiles(from,to){
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=B.layerOffset||to>=B.layerOffset)return [];
  let x=from%B.size,y=Math.floor(from/B.size);const tx=to%B.size,ty=Math.floor(to/B.size),dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=Math.sign(tx-x),sy=Math.sign(ty-y),result=[from];let ix=0,iy=0;
  while(ix<dx||iy<dy){if(ix<dx&&(iy>=dy||(1+2*ix)*dy<=(1+2*iy)*dx)){x+=sx;ix++;}else{y+=sy;iy++;}result.push(y*B.size+x);}return result;
}
