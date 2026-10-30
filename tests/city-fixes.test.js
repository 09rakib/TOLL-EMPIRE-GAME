import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {B} from '../src/balance.js';
import {id} from '../src/world.js';
import {plotCells,plannedPlot} from '../src/plots.js';
import {buildSidewalkGraph,pavementAt} from '../src/walkways.js';
import {serialize,migrate,validateSave} from '../src/storage.js';
import {riverCells} from '../src/river.js';
import {buildingStyle} from '../src/architecture.js';
const city=()=>{const g=new Simulation(null,()=>.4);g.coins=20000;g.trees.clear();return g;};
test('every sidewalk edge stays on pavement through bends, junctions and dead ends',()=>{
  const g=city();for(const [x,y]of [[19,21],[15,19],[15,18],[15,17],[16,17],[17,17],[20,21],[20,22],[21,22],[22,22]])g.tiles[id(x,y)]='road';
  const net=buildSidewalkGraph(g.tiles);for(const [node,links]of net.graph)for(const other of links){const a=net.positions.get(node),b=net.positions.get(other);for(let i=0;i<=20;i++){const x=a[0]+(b[0]-a[0])*i/20,y=a[1]+(b[1]-a[1])*i/20;assert.ok(pavementAt(g.tiles,x,y));}}
});
test('street walkers never step onto asphalt or grass, including turns',()=>{
  const g=city();for(let y=21;y<25;y++)g.build(id(18,y),'road');
  for(let i=0;i<3000;i++){g.update(B.fixedStep);for(const w of g.walkers)if(w.park===null)assert.ok(pavementAt(g.tiles,w.x,w.y));}
});
test('clear and build park charges the reviewed total atomically and undoes both operations',()=>{
  const g=city(),n=id(18,22),cells=plotCells(plannedPlot(n,'park'));g.trees.add(cells[0]);g.trees.add(cells[15]);const clearing=cells.reduce((s,p)=>s+g.treeRemovalCost(p),0),before=g.coins;
  assert.equal(g.buildBuilding(n,'park',{clearTrees:true}),null);assert.equal(g.coins,before-clearing-B.parkPrice);assert.equal(g.buildingAt(cells[15]).footprint,4);assert.ok(cells.every(p=>!g.trees.has(p)));
  g.undo();assert.equal(g.coins,before);assert.equal(g.buildings.length,0);assert.ok(g.trees.has(cells[15]));
  g.coins=clearing+B.parkPrice-1;assert.ok(g.buildBuilding(n,'park',{clearTrees:true}));assert.ok(g.trees.has(cells[15]));assert.equal(g.buildings.length,0);
});
test('park arrivals earn tickets exactly once and upgrades raise the next visitor receipt',()=>{
  const g=city(),n=id(18,21);g.build(n,'park');const b=g.buildingAt(n);for(let i=0;i<3600;i++)g.update(B.fixedStep);
  assert.ok(b.walkingVisits>0);assert.equal(b.revenue,b.walkingVisits*B.parkTicketFees[0]);const visits=b.walkingVisits,revenue=b.revenue;g.upgradeBuilding(n);for(let i=0;i<1800;i++)g.update(B.fixedStep);assert.ok(b.walkingVisits>visits);assert.equal(b.revenue-revenue,(b.walkingVisits-visits)*B.parkTicketFees[1]);
});
test('bent flyovers reserve a contiguous elevated route over clear grass and undo cleanly',()=>{
  const g=city();for(let y=19;y>=17;y--)g.build(id(20,y),'road');const start=id(15,20),bend=id(15,17),end=id(20,17),before=g.coins;
  const plan=g.planBentFlyover(start,bend,end);assert.equal(plan.error,null);assert.equal(plan.nodes.length,9);assert.equal(g.buildBentFlyover(start,bend,end),null);assert.equal(g.tiles[bend],'grass');assert.ok(g.graph.has(bend+B.layerOffset));assert.equal(g.coins,before-plan.cost);g.undo();assert.equal(g.flyovers.length,0);assert.equal(g.coins,before);
  g.tiles[bend]='building';assert.ok(g.planBentFlyover(start,bend,end).error);
});
test('cars completing a toll trip remain visible while driving out and pay only once',()=>{
  const g=city(),n=id(19,20);g.build(n,'toll');const car={route:[id(18,20),n],index:0,progress:.99,age:0,edgeAge:0,waitingNode:null,revision:g.revision,destination:n,targetBuilding:null,angle:0};const before=g.coins;
  g.advance(car,.1);assert.equal(car.done,undefined);assert.equal(g.coins,before+10);g.advance(car,.5);g.syncCarPosition(car);assert.ok(car.worldX>19.5);assert.equal(car.done,undefined);g.advance(car,1);assert.equal(car.done,true);assert.equal(g.coins,before+10);
});
test('upgraded building bodies fit their own tile and river reaches the northeast corner safely',()=>{
  for(let level=1;level<=5;level++){const style=buildingStyle({level});assert.ok(style.height<=40);assert.ok(style.width<=44);}
  assert.ok([...riverCells()].some(n=>Math.floor(n/B.size)===0&&n%B.size>=60));const g=city(),saved=serialize(g);delete saved.riverLayout;saved.tiles[id(60,5)]='building';saved.buildings.push({x:60,y:5,type:0,managed:true,level:1});const updated=migrate(saved);assert.equal(updated.tiles[id(60,5)],'building');assert.equal(updated.coins,g.coins);assert.ok(validateSave(updated));assert.equal(updated.riverLayout,2);
});
