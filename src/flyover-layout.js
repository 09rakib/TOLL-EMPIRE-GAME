import {B} from './balance.js';
import {id,point} from './world.js';
export function prepareSideRamps(span,tiles,trees=new Set(),blocked=new Set()){
 if(span.rampSides)return span;span.rampSides=[0,0];span.rampClearance=[];if(span.nodes.length<7)return span;
 for(let end=0;end<2;end++){const nodes=end?[...span.nodes].reverse():span.nodes,a=point(nodes[0]),b=point(nodes[1]),nx=-(b.y-a.y),ny=b.x-a.x;for(const side of [1,-1]){const cells=nodes.slice(1,4).map(n=>{const p=point(n);return [p.x+nx*side,p.y+ny*side];});if(cells.every(([x,y])=>x>=0&&y>=0&&x<B.size&&y<B.size&&['grass','road','mainRoad','roundabout'].includes(tiles[id(x,y)])&&!trees.has(id(x,y))&&!span.nodes.includes(id(x,y))&&!blocked.has(id(x,y)))){span.rampSides[end]=side;span.rampClearance.push(...cells.map(([x,y])=>id(x,y)));break;}}
 }return span;
}
export function rampOffset(span,index){const count=span.nodes.length;if(count<7||!span.rampSides)return {x:0,y:0};let end;if(index>0&&index<3){end=0;}else if(index<count-1&&index>count-4){end=1;}else return {x:0,y:0};const a=point(span.nodes[end?count-1:0]),b=point(span.nodes[end?count-2:1]),side=span.rampSides[end]||0,offset=B.tile*.55*side;return {x:-(b.y-a.y)*offset,y:(b.x-a.x)*offset};}
