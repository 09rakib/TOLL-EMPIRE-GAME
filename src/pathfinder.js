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
