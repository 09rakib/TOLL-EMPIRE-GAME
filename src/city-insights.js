import {B} from './balance.js';
import {id,isRoad} from './world.js';
import {plotCells,plotPerimeter} from './plots.js';
import {hasParking} from './offices.js';
import {parkingCapacity} from './campus-art.js';

export const serviceRanges={clinic:32,police:38,university:48,school:28,park:30};
// Road distance, including upgrade reach; disconnected services never seed coverage.
export function serviceDistances(g,kind){
  const distances=new Map(),queue=[];
  for(const b of g.buildings){if(!b.managed||(kind==='clinic'?b.type!==4:kind==='park'?b.type!==3:b.kind!==kind))continue;
    const node=g.buildingEntrance(b);if(node===null)continue;
    const value=-3*((b.level||1)-1);if(value<(distances.get(node)??Infinity)){distances.set(node,value);queue.push(node);}}
  for(let i=0;i<queue.length;i++)for(const n of g.graph.get(queue[i])||[]){const d=distances.get(queue[i])+1;if(d<(distances.get(n)??Infinity)){distances.set(n,d);queue.push(n);}}
  return distances;
}
export function cityOverlay(g,mode){
  const tiles=new Map(),markers=[];
  const mark=(b,label,color)=>{for(const n of plotCells(b))tiles.set(n,color);markers.push({node:id(b.x,b.y),label,color});};
  if(mode==='connections')for(const b of g.buildings){if(b.managed&&g.buildingEntrance(b)===null)mark(b,'NO ROAD','#b44739');}
  if(mode==='parking')for(const b of g.buildings){if(!hasParking(b))continue;const node=id(b.x,b.y),capacity=b.kind==='parking'?parkingCapacity(b):2,used=g.parkingOccupancy(node).size;mark(b,`${used}/${capacity}${used>=capacity?' FULL':''}`,used>=capacity?'#b44739':'#337d76');}
  if(mode==='traffic')for(const n of g.graph.keys()){if(n>=B.layerOffset||!isRoad(g.tiles[n]))continue;tiles.set(n,{free:'#39866c',busy:'#b08020',jammed:'#b44739'}[g.congestionAt(n)]);}
  if(serviceRanges[mode]){const distances=serviceDistances(g,mode),range=serviceRanges[mode];for(const [n,d]of distances)if(n<B.layerOffset&&d<range)tiles.set(n,'#337d76');
    for(const b of g.buildings)if(b.managed&&b.type===0){const n=g.buildingEntrance(b),covered=n!==null&&(distances.get(n)??Infinity)<range;mark(b,covered?'COVERED':'NO COVER',covered?'#337d76':'#b44739');}}
  if(mode==='connections')for(const n of g.graph.keys())if(n<B.layerOffset&&!g.cityConnected.has(n))tiles.set(n,'#b08020');
  return {tiles,markers};
}
export function siteConnected(g,plot){return plotPerimeter(plot).some(n=>g.cityConnected.has(n));}
