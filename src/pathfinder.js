import { B } from './balance.js';
import {MinHeap} from './heap.js';
// Quantile distribution calibrated to the brief's 40-second detour scenario.
export function valueOfTime(quantile) {
  const target=1-quantile;
  for(let i=1;i<B.elasticity.length;i++) {
    const [x0,y0]=B.elasticity[i-1], [x1,y1]=B.elasticity[i];
    if(target>=y1) return x0+(x1-x0)*(y0-target)/(y0-y1);
  }
  return 1.2;
}
export function findRoute(graph,start,end,vot,tolls=new Map(),travelTime=()=>B.tileTravelTime) {
  if(!graph.has(start)||!graph.has(end)) return null;
  const distance=new Map([[start,0]]),previous=new Map(),queue=new MinHeap();queue.push([start,0]);
  while(queue.size) {
    const [current,cost]=queue.pop();
    if(cost!==distance.get(current)) continue;
    if(current===end) {
      const route=[end]; let n=end;
      while(n!==start) {n=previous.get(n);route.push(n);}
      return route.reverse();
    }
    for(const next of graph.get(current)) {
      const c=cost+travelTime(current,next)*vot+(tolls.get(next)?.price||0);
      if(c<(distance.get(next)??Infinity)) {distance.set(next,c);previous.set(next,current);queue.push([next,c]);}
    }
  }
  return null;
}
// Heading-aware driving paths: a reverse is legal only on a player-marked ground tile.
export function roadHeading(from,to,fallback=null){const ax=from%B.size,ay=Math.floor((from%B.layerOffset)/B.size),bx=to%B.size,by=Math.floor((to%B.layerOffset)/B.size);if(ax===bx&&ay===by)return fallback;return Math.abs(bx-ax)>=Math.abs(by-ay)?bx>ax?0:2:by>ay?1:3;}
export function findDriveRoute(graph,start,end,vot,tolls=new Map(),travelTime=()=>B.tileTravelTime,uturns=new Set(),heading=null){
 if(!graph.has(start)||!graph.has(end))return null;const initial=start*5+(heading??4),distance=new Map([[initial,0]]),previous=new Map(),queue=new MinHeap();queue.push([initial,0]);
 while(queue.size){const [state,cost]=queue.pop();if(cost!==distance.get(state))continue;const current=Math.floor(state/5),incoming=state%5;if(current===end){const route=[];let p=state;while(p!==undefined){route.push(Math.floor(p/5));p=previous.get(p);}return route.reverse();}
  for(const next of graph.get(current)||[]){const dir=roadHeading(current,next,incoming===4?null:incoming);if(incoming!==4&&dir===(incoming+2)%4&&!(current<B.layerOffset&&uturns.has(current)))continue;const key=next*5+(dir??4),c=cost+travelTime(current,next)*vot+(tolls.get(next)?.price||0);if(c<(distance.get(key)??Infinity)){distance.set(key,c);previous.set(key,state);queue.push([key,c]);}}
 }return null;
}
