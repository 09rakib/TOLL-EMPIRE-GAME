import {B} from './balance.js';
import {id,isRoad,point} from './world.js';
export const PAVEMENT_WIDTH=9;
export const CURB_OFFSET=4;
export function pavementAt(tiles,wx,wy){
  const x=Math.floor(wx/B.tile),y=Math.floor(wy/B.tile);if(x<0||y<0||x>=B.size||y>=B.size||!isRoad(tiles[id(x,y)]))return false;
  const u=wx-x*B.tile,v=wy-y*B.tile,k=PAVEMENT_WIDTH,t=B.tile,coreX=u>=k&&u<=t-k,coreY=v>=k&&v<=t-k;
  const road=(a,b)=>a>=0&&b>=0&&a<B.size&&b<B.size&&isRoad(tiles[id(a,b)]);
  if(u<k&&v<k&&road(x-1,y)&&road(x,y-1)&&road(x-1,y-1)||u>t-k&&v<k&&road(x+1,y)&&road(x,y-1)&&road(x+1,y-1)||u>t-k&&v>t-k&&road(x+1,y)&&road(x,y+1)&&road(x+1,y+1)||u<k&&v>t-k&&road(x-1,y)&&road(x,y+1)&&road(x-1,y+1))return false;
  return !(coreX&&coreY||coreY&&(u<k&&road(x-1,y)||u>t-k&&road(x+1,y))||coreX&&(v<k&&road(x,y-1)||v>t-k&&road(x,y+1)));
}
export function buildSidewalkGraph(tiles){
  const graph=new Map(),positions=new Map(),k=CURB_OFFSET,t=B.tile;
  const road=(x,y)=>x>=0&&y>=0&&x<B.size&&y<B.size&&isRoad(tiles[id(x,y)]);
  const link=(a,b)=>{if(!graph.has(a)||!graph.has(b))return;graph.get(a).push(b);graph.get(b).push(a);};
  for(let n=0;n<tiles.length;n++)if(isRoad(tiles[n])){const p=point(n);for(const [corner,xy]of [[0,[k,k]],[1,[t-k,k]],[2,[t-k,t-k]],[3,[k,t-k]]]){const pos=[p.x*t+xy[0],p.y*t+xy[1]];if(pavementAt(tiles,...pos)){graph.set(n*4+corner,[]);positions.set(n*4+corner,pos);}}}
  for(let n=0;n<tiles.length;n++)if(isRoad(tiles[n])){const {x,y}=point(n),c=n*4;
    // A pavement follows the outside of the asphalt. It never cuts across a junction.
    if(!road(x,y-1))link(c,c+1);if(!road(x+1,y))link(c+1,c+2);if(!road(x,y+1))link(c+2,c+3);if(!road(x-1,y))link(c+3,c);
    if(road(x+1,y)){link(c+1,id(x+1,y)*4);link(c+2,id(x+1,y)*4+3);}
    if(road(x,y+1)){link(c+3,id(x,y+1)*4);link(c+2,id(x,y+1)*4+1);}
  }
  return {graph,positions};
}
export function findSidewalkRoute(network,start,end,corners=[0,1,2,3]){
  const targets=new Set(corners.map(c=>end*4+c)),queue=[0,1,2,3].map(c=>start*4+c).filter(n=>network.graph.has(n)),previous=new Map(queue.map(n=>[n,null]));
  for(let i=0;i<queue.length;i++){const n=queue[i];if(targets.has(n)){const keys=[];for(let p=n;p!==null;p=previous.get(p))keys.unshift(p);return {points:keys.map(k=>network.positions.get(k)),roads:[...new Set(keys.map(k=>Math.floor(k/4)))]};}
    for(const a of network.graph.get(n)||[])if(!previous.has(a)){previous.set(a,n);queue.push(a);}}
  return null;
}
