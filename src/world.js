import { B } from './balance.js';
import {riverCells} from './river.js';
export const id = (x,y) => y*B.size+x;
export const point = n => ({x:n%B.size,y:Math.floor((n%B.layerOffset)/B.size)});
export function createCity(){
  const tiles=Array(B.size*B.size).fill('grass');
  for(let x=7;x<=31;x++)tiles[id(x,20)]='road';
  for(const n of riverCells())tiles[n]='river';
  return {tiles,buildings:[],worldMode:'planner',riverLayout:3};
}
// Retained for reading old city backups and regression-testing the road engine.
export function createLegacyCity() {
  const tiles = Array(B.size*B.size).fill('grass');
  for(let y=0;y<B.size;y++) for(let x=0;x<B.size;x++) {
    const river = Math.floor(35-x*.43);
    if(y>=river && y<river+2) tiles[id(x,y)]='river';
  }
  for(const y of [10,16,22]) for(let x=7;x<=31;x++) if(tiles[id(x,y)]!=='river') tiles[id(x,y)]='road';
  for(const x of [10,16,22,28]) for(let y=7;y<=31;y++) {
    if(tiles[id(x,y)]!=='river') tiles[id(x,y)]='road';
    else if(x===22) tiles[id(x,y)]='bridge';
  }
  // Connect the south bank to the existing bridge.
  for(let x=10;x<=28;x++) if(tiles[id(x,29)]!=='river') tiles[id(x,29)]='road';
  const buildings=[];
  for(let y=8;y<33;y+=3) for(let x=8;x<33;x+=3) {
    if(tiles[id(x,y)]!=='grass' || tiles[id(x+1,y)]!=='grass') continue;
    if((x*7+y*11)%5===0) continue;
    const type=(x+y)%4;
    buildings.push({x,y,type,variant:(x*13+y*7)%5});
    tiles[id(x,y)]='building';
  }
  return {tiles,buildings};
}
export const isRoad = type => type==='road'||type==='bridge'||type==='mainRoad'||type==='roundabout';
export function graphFrom(tiles,flyovers=[]) {
  const graph=new Map();
  for(let n=0;n<tiles.length;n++) if(isRoad(tiles[n])) {
    const {x,y}=point(n), neighbors=[];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx,ny=y+dy;
      if(nx>=0&&ny>=0&&nx<B.size&&ny<B.size&&isRoad(tiles[id(nx,ny)])) neighbors.push(id(nx,ny));
    }
    graph.set(n,neighbors);
  }
  // Elevated tiles have separate nodes; only the two ramp ends touch ground.
  for(const span of flyovers) {
    for(let i=0;i<span.nodes.length;i++) {
      const ground=span.nodes[i],node=ground+B.layerOffset;
      if(!graph.has(node))graph.set(node,[]);
      for(const neighbor of [span.nodes[i-1],span.nodes[i+1]]) {
        if(neighbor!==undefined&&!graph.get(node).includes(neighbor+B.layerOffset))graph.get(node).push(neighbor+B.layerOffset);
      }
      if((i===0||i===span.nodes.length-1)&&graph.has(ground)) {
        graph.get(ground).push(node);graph.get(node).push(ground);
      }
    }
  }
  return graph;
}
