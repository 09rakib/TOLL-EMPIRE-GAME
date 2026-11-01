import {B} from './balance.js';
export const riverCurve=()=>[[-1,33],[42,37],[60,19],[B.size-2,-2]];
export function riverCells(){const cells=new Set();for(let x=0;x<B.size;x++){const y=Math.floor(35-x*.2);for(let dy=0;dy<2;dy++)if(y+dy>=0&&y+dy<B.size)cells.add((y+dy)*B.size+x);}return cells;}
export function updateRiver(data){
  if(data.worldMode!=='planner'||data.riverLayout===3||!Array.isArray(data.tiles))return data;
  const tiles=[...data.tiles],protectedWater=new Set();for(const bridge of data.bridges||[])for(const n of bridge.nodes)for(const offset of [0,-1,1,-B.size,B.size])protectedWater.add(n+offset);
  for(let n=0;n<tiles.length;n++)if(tiles[n]==='river'&&!protectedWater.has(n))tiles[n]='grass';
  for(const n of riverCells())if(tiles[n]==='grass')tiles[n]='river';
  return {...data,tiles,riverLayout:3,...(data.trees?{trees:data.trees.filter(n=>tiles[n]==='grass')}: {})};
}
