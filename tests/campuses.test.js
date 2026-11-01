import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {plotCells} from '../src/plots.js';
import {serialize,validateSave} from '../src/storage.js';
import {visitFee} from '../src/planner.js';
const city=()=>{const g=new Simulation(null,()=>.4);g.trees.clear();g.coins=100000;return g;};
test('new campuses reserve all sixteen cells, survive saves and remove/undo together',()=>{
 for(const kind of ['clinic','police','parking','supermarket','university']){const g=city(),n=id(18,21);assert.equal(g.build(n,kind),null,kind);const b=g.buildingAt(n);assert.equal(plotCells(b).length,16);for(const tile of plotCells(b))assert.equal(g.buildingAt(tile),b);assert.ok(validateSave(serialize(g)),kind);g.demolish(id(21,24));assert.equal(g.buildings.length,0);g.undo();assert.equal(g.buildingAt(id(21,24)).kind,kind);const fee=visitFee(b);assert.equal(g.upgradeBuilding(n),null);if(fee)assert.ok(visitFee(g.buildingAt(n))>fee);}
});
test('store occupies four tiles and older compact hospitals retain their neighbors',()=>{
 const g=city();assert.equal(g.build(id(18,21),'shop'),null);assert.equal(plotCells(g.buildingAt(id(19,22))).length,4);assert.ok(validateSave(serialize(g)));const save=serialize(city());save.buildings=[{x:18,y:19,type:4,kind:'clinic',level:2,managed:true}];save.tiles[id(18,19)]='building';assert.ok(validateSave(save));const old=new Simulation(save);assert.equal(plotCells(old.buildingAt(id(18,19))).length,1);
});
test('standalone parking accepts cars, bills once after stopping and releases them',()=>{
 const g=city(),n=id(18,21);g.build(n,'parking');const b=g.buildingAt(n);g.cars=[];g.addPlannerCar(id(7,20),g.buildingEntrance(b),n,'car');const car=g.cars[0],seen=new Set();for(let i=0;i<5000;i++){g.update(1/30);if(car.parkingPhase)seen.add(car.parkingPhase);if(seen.has('leaving')&&!car.parkingPhase)break;}assert.ok(seen.has('parked'));assert.ok(seen.has('leaving'));assert.ok(b.revenue>=6);
});
