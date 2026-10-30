import {B} from './balance.js';
export const riverCurve=()=>[[-1,33],[42,37],[60,19],[B.size-2,-2]];
export function riverCells(){const cells=new Set(),[a,b,c,d]=riverCurve();for(let i=0;i<=240;i++){const t=i/240,u=1-t,x=u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],y=u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1];for(let py=Math.floor(y-1.7);py<=Math.ceil(y+1.7);py++)for(let px=Math.floor(x-1.7);px<=Math.ceil(x+1.7);px++)if(px>=0&&py>=0&&px<B.size&&py<B.size&&Math.hypot(px+.5-x,py+.5-y)<1.7)cells.add(py*B.size+px);}return cells;}
export function updateRiver(data){
  if(data.worldMode!=='planner'||data.riverLayout===2||!Array.isArray(data.tiles))return data;
  const tiles=[...data.tiles],protectedWater=new Set();for(const bridge of data.bridges||[])for(const n of bridge.nodes)for(const offset of [0,-1,1,-B.size,B.size])protectedWater.add(n+offset);
  for(let n=0;n<tiles.length;n++)if(tiles[n]==='river'&&!protectedWater.has(n))tiles[n]='grass';
  for(const n of riverCells())if(tiles[n]==='grass')tiles[n]='river';
  return {...data,tiles,riverLayout:2,...(data.trees?{trees:data.trees.filter(n=>tiles[n]==='grass')}: {})};
}
