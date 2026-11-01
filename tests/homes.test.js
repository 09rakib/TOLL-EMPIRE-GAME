import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {plotCells} from '../src/plots.js';
import {serialize,validateSave} from '../src/storage.js';
test('two-tile home reserves house and parking, saves and removes as one property',()=>{
 const g=new Simulation(null,()=>.4);g.trees.clear();g.coins=5000;
 assert.equal(g.build(id(18,21),'garage-home'),null);const b=g.buildingAt(id(19,21));assert.equal(b.kind,'garage-home');assert.equal(plotCells(b).length,2);assert.equal(g.population,20);assert.ok(validateSave(serialize(g)));
 assert.equal(g.demolish(id(19,21)),null);assert.equal(g.buildings.length,0);g.undo();assert.equal(g.buildingAt(id(19,21)).kind,'garage-home');assert.ok(g.build(id(63,21),'garage-home'));
});
test('home parking receives and releases residents without charging a business fee',()=>{
 const g=new Simulation(null,()=>.4);g.trees.clear();g.coins=5000;const n=id(18,21);g.build(n,'garage-home');const b=g.buildingAt(n);g.cars=[];g.addPlannerCar(id(7,20),g.buildingEntrance(b),n,'car');const car=g.cars[0],seen=new Set();for(let i=0;i<4000;i++){g.update(1/30);if(car.parkingPhase)seen.add(car.parkingPhase);if(seen.has('leaving')&&!car.parkingPhase)break;}assert.ok(seen.has('parked'));assert.ok(seen.has('leaving'));assert.equal(b.revenue,0);
});
