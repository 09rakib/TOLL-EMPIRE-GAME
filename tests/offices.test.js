import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {B} from '../src/balance.js';
import {plotCells} from '../src/plots.js';
import {parkingCell,parkingRoads} from '../src/offices.js';
import {serialize,validateSave} from '../src/storage.js';
const city=()=>{const g=new Simulation(null,()=>.4);g.trees.clear();g.coins=20000;return g;};
const run=(g,seconds)=>{for(let i=0;i<seconds/B.fixedStep;i++)g.update(B.fixedStep);};
test('L-office reserves four tiles, selects from any cell and orients parking toward its road',()=>{
  const g=city(),n=id(18,21);assert.equal(g.build(n,'office'),null);const b=g.buildingAt(n);assert.equal(b.footprint,2);assert.equal(plotCells(b).length,4);assert.equal(b.parkingCorner,1);assert.equal(parkingCell(b).x,19);
  for(const tile of plotCells(b)){assert.equal(g.buildingAt(tile),b);assert.equal(g.tiles[tile],'building');assert.ok(g.build(tile,'road'));}
  assert.ok(parkingRoads(b).includes(g.buildingEntrance(b)));assert.ok(g.build(id(63,63),'office'));
});
test('parking occupies a real reserved tile and a full footprint validates and restores from save',()=>{
  const g=city();g.build(id(18,21),'office');const saved=serialize(g);assert.ok(validateSave(saved));const restored=new Simulation(saved,()=>.4),b=restored.buildingAt(id(19,22));assert.equal(b.footprint,2);assert.equal(b.parkingCorner,1);assert.equal(restored.tiles[id(19,21)],'building');
  const invalid=structuredClone(saved);invalid.tiles[id(19,22)]='grass';assert.equal(validateSave(invalid),false);
  const balance=g.coins;g.demolish(id(19,21));assert.equal(g.buildings.length,0);assert.equal(g.coins,balance+Math.round(B.officePrice*B.refund));g.undo();assert.equal(g.tiles.filter(t=>t==='building').length,4);
});
test('a real car drives into a bay, stops, pays once, leaves and returns to its origin',()=>{
  const g=city(),n=id(18,21);g.build(n,'office');const b=g.buildingAt(n),entrance=g.buildingEntrance(b);g.cars=[];g.addPlannerCar(id(7,20),entrance,n,'car');const car=g.cars[0],seen=new Set();let stop=null,returned=false;
  for(let i=0;i<2400;i++){
    g.update(B.fixedStep);if(car.parkingPhase)seen.add(car.parkingPhase);
    const active=g.cars.filter(c=>c.parkingOffice===n&&Number.isInteger(c.parkingSlot)&&!c.done);assert.ok(active.length<=2);assert.equal(new Set(active.map(c=>c.parkingSlot)).size,active.length);
    if(car.parkingPhase==='parked'&&car.parkingPaid&&!stop)stop={x:car.worldX,y:car.worldY,time:g.time};
    if(stop&&g.time-stop.time<5&&car.parkingPhase==='parked'){assert.equal(car.worldX,stop.x);assert.equal(car.worldY,stop.y);}
    if(seen.has('leaving')&&car.parkingPhase===null){assert.equal(car.targetBuilding,null);assert.equal(car.destination,id(7,20));assert.equal(car.route.at(-1),id(7,20));returned=true;break;}
  }
  assert.ok(seen.has('entering')&&seen.has('parked')&&seen.has('leaving'));assert.equal(returned,true);assert.ok(b.visitors>0);assert.equal(b.revenue,b.visitors*14);
});
test('parking does not earn on road arrival and a disconnected parked vehicle remains stopped',()=>{
  const g=city(),n=id(18,21);g.build(n,'office');const b=g.buildingAt(n),entry=g.buildingEntrance(b);g.cars=[];g.addPlannerCar(id(7,20),entry,n,'car');const c=g.cars[0];
  for(let i=0;i<1500&&c.parkingPhase!=='parked';i++){g.update(B.fixedStep);if(c.parkingPhase==='waiting'||c.parkingPhase==='entering')assert.equal(b.revenue,0);}
  assert.equal(c.parkingPhase,'parked');g.removeRoad(entry);const x=c.worldX,y=c.worldY,revenue=b.revenue;run(g,25);assert.equal(c.worldX,x);assert.equal(c.worldY,y);assert.equal(b.revenue,revenue);assert.equal(g.buildingEntrance(b),null);
  g.demolish(n);run(g,1);assert.ok(!g.cars.includes(c)||c.parkingOffice!==n);
});
test('clearing and building an office is atomic and preserves an older compact office save',()=>{
  const g=city(),n=id(18,21);g.trees.add(id(19,22));const fee=g.treeRemovalCost(id(19,22)),before=g.coins;assert.equal(g.buildBuilding(n,'office',{clearTrees:true}),null);assert.equal(g.coins,before-fee-B.officePrice);g.undo();assert.equal(g.coins,before);assert.ok(g.trees.has(id(19,22)));
  const saved=serialize(city());saved.buildings=[{x:18,y:19,type:2,kind:'office',level:2,managed:true,investment:1100}];saved.tiles[id(18,19)]='building';assert.ok(validateSave(saved));const old=new Simulation(saved);assert.equal(old.buildingAt(id(18,19)).footprint,undefined);assert.equal(old.tiles[id(19,19)],'grass');assert.equal(old.coins,saved.coins);
});
