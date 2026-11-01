import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {serialize,validateSave} from '../src/storage.js';
import {citySatisfaction} from '../src/satisfaction.js';
test('campuses can be placed before roads and only open after a real city connection',()=>{
 for(const kind of ['university','supermarket','police','clinic','parking']){
  const g=new Simulation(null,()=>.4);g.trees.clear();g.coins=20000;const n=id(18,25);assert.equal(g.build(n,kind),null,kind);const b=g.buildingAt(n);assert.equal(b.footprint,4);assert.equal(g.buildingEntrance(b),null);assert.ok(!g.businessDestinations.some(s=>s.building===n));assert.equal(b.revenue,0);assert.ok(validateSave(serialize(g)));assert.ok(g.upgradeBuilding(n));
  for(let y=21;y<=24;y++)assert.equal(g.build(id(18,y),'road'),null);assert.notEqual(g.buildingEntrance(b),null);assert.equal(g.upgradeBuilding(n),null);if(['supermarket','clinic','parking'].includes(kind))assert.ok(g.businessDestinations.some(s=>s.building===n));
 }
});
test('wooded off-road civic sites quote and clear all sixteen cells atomically',()=>{
 for(const kind of ['university','supermarket','police']){const g=new Simulation(null,()=>.4);g.coins=20000;const n=id(18,25),before=g.coins;assert.equal(g.buildBuilding(n,kind,{clearTrees:true}),null);assert.ok(g.coins<before);assert.equal(g.buildingAt(id(21,28)).kind,kind);const saved=serialize(g);assert.ok(validateSave(saved));assert.equal(new Simulation(saved).buildingAt(n).kind,kind);g.undo();assert.equal(g.buildingAt(n),undefined);assert.equal(g.coins,before);}
});
