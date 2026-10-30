import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {B} from '../src/balance.js';
import {id} from '../src/world.js';
import {plotCells,plannedPlot} from '../src/plots.js';
import {serialize,validateSave} from '../src/storage.js';
import {pavementAt,buildSidewalkGraph,findSidewalkRoute} from '../src/walkways.js';
const city=()=>{const g=new Simulation(null,()=>.4);g.coins=10000;g.trees.clear();return g;};
function run(g,seconds){for(let i=0;i<seconds/B.fixedStep;i++)g.update(B.fixedStep);}

test('City Park reserves exactly 16 cells, can be placed off-road, and any cell selects the same park',()=>{
  const g=city(),n=id(18,23),before=g.coins;assert.equal(g.build(n,'park'),null);const b=g.buildingAt(n);
  assert.equal(b.footprint,4);assert.equal(g.tiles.filter(t=>t==='building').length,16);assert.equal(g.coins,before-B.parkPrice);assert.equal(g.buildingEntrance(b),null);
  for(const cell of plotCells(b)){assert.equal(g.tiles[cell],'building');assert.equal(g.buildingAt(cell),b);assert.ok(g.build(cell,'road'));assert.ok(g.build(cell,'home'));}
  assert.ok(g.validateBuilding(id(20,24),'park'));
});
test('park footprint checks all 16 cells for forest, boundaries, roads and structures before charging',()=>{
  const g=city(),n=id(18,23),before=g.coins;g.trees.add(id(21,26));assert.match(g.build(n,'park'),/Clear the trees/);assert.equal(g.coins,before);
  g.clearTreeArea(plotCells(plannedPlot(n,'park')));g.tiles[id(21,26)]='road';assert.match(g.build(n,'park'),/16 empty tiles/);g.tiles[id(21,26)]='grass';
  assert.ok(g.build(id(62,62),'park'));assert.equal(g.build(n,'park'),null);
});
test('only a city-connected perimeter road opens a park to actual walking visits',()=>{
  const g=city(),n=id(18,22);g.build(n,'park');const b=g.buildingAt(n);run(g,90);assert.equal(b.walkingVisits||0,0);assert.ok(g.walkers.every(w=>w.park===null));
  assert.equal(g.build(id(18,21),'road'),null);assert.equal(g.buildingEntrance(b),id(18,21));run(g,120);assert.ok(b.walkingVisits>0);assert.ok(g.walkers.some(w=>w.park===n));
  const visits=b.walkingVisits;g.removeRoad(id(18,20));run(g,20);assert.equal(g.buildingEntrance(b),null);assert.equal(b.walkingVisits,visits);assert.ok(g.walkers.every(w=>w.park===null));
});
test('all four park edges can connect, including roads far from the anchor tile',()=>{
  for(const [x,y]of [[17,25],[22,25],[21,22],[21,27]]){
    const g=city();g.build(id(18,23),'park');const b=g.buildingAt(id(18,23));g.cityConnected=new Set([id(x,y)]);assert.equal(g.buildingEntrance(b),id(x,y));
  }
});
test('park deletion from an interior tile refunds once; undo and saves restore the whole footprint',()=>{
  const g=city();g.build(id(18,23),'park');const saved=serialize(g);assert.ok(validateSave(saved));const restored=new Simulation(saved,()=>.4);assert.equal(restored.buildingAt(id(21,26)).footprint,4);
  const before=g.coins;g.demolish(id(20,25));assert.equal(g.coins,before+Math.round(B.parkPrice*B.refund));assert.equal(g.tiles.filter(t=>t==='building').length,0);
  g.undo();assert.equal(g.tiles.filter(t=>t==='building').length,16);assert.equal(g.buildingAt(id(21,26)).footprint,4);
  const broken=structuredClone(saved);broken.tiles[id(21,26)]='grass';assert.equal(validateSave(broken),false);
});
test('walkers use footpaths, honor pause, avoid demolished road routes and never produce park income',()=>{
  const g=city(),a=id(18,20),b=id(19,20),points=findSidewalkRoute(buildSidewalkGraph(g.tiles),a,b).points;assert.ok(points.length>=2);assert.ok(points.every(p=>pavementAt(g.tiles,...p)));
  assert.ok(g.walkers.length);const w=g.walkers[0],x=w.x,y=w.y;g.paused=true;g.update(1);assert.equal(w.x,x);assert.equal(w.y,y);g.paused=false;
  const before=g.coins;run(g,5);assert.equal(g.coins,before);assert.ok(g.walkers.some(p=>p.x!==x||p.y!==y));g.removeRoad(id(19,20));run(g,1);assert.ok(g.walkers.every(p=>p.nodes.every(n=>g.graph.has(n))));
});
test('park walking routes go around the fountain instead of through its water',()=>{
  const g=city();g.build(id(18,22),'park');g.build(id(18,21),'road');const cx=20*B.tile,cy=24*B.tile;let seen=false;
  for(let i=0;i<5400;i++){g.update(B.fixedStep);for(const w of g.walkers)if(w.park!==null){assert.ok(Math.hypot(w.x-cx,w.y-cy)>18);if(w.stage==='visiting')seen=true;}}
  assert.equal(seen,true);
});
