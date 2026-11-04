import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {serialize,validateSave} from '../src/storage.js';
import {serviceDistances,cityOverlay} from '../src/city-insights.js';
import {citySatisfaction} from '../src/satisfaction.js';
import {visitFee,visitCapacity} from '../src/planner.js';
const city=()=>{const g=new Simulation();g.trees.clear();g.coins=100000;return g;};
test('school provides connected local education without commercial income, persists through upgrades and edits',()=>{
 const g=city(),n=id(18,21);g.build(id(16,19),'home');const before=citySatisfaction(g).factors.find(f=>f.name==='Education').score;
 assert.equal(g.build(n,'school'),null);let b=g.buildingAt(n);
 assert.equal(visitFee(b),0);assert.equal(visitCapacity(b),0);assert.ok(!g.businessDestinations.some(d=>d.building===n));
 assert.ok(citySatisfaction(g).factors.find(f=>f.name==='Education').score>before);
 assert.ok(cityOverlay(g,'school').markers.some(m=>m.label==='COVERED'));
 const entrance=g.buildingEntrance(b);assert.equal(serviceDistances(g,'school').get(entrance),-0);
 for(let level=2;level<=5;level++)assert.equal(g.upgradeBuilding(n),null);
 assert.equal(serviceDistances(g,'school').get(entrance),-12);
 assert.equal(g.rotateBuilding(n),null);assert.equal(g.moveBuilding(n,id(23,21)),null);
 const saved=serialize(g);assert.ok(validateSave(saved));const loaded=new Simulation(saved);b=loaded.buildingAt(id(23,21));
 assert.equal(b.kind,'school');assert.equal(b.level,5);assert.equal(b.rotation,1);assert.equal(visitFee(b),0);
 const coins=loaded.coins;loaded.settleVisit({targetBuilding:id(23,21),destination:loaded.buildingEntrance(b)});assert.equal(loaded.coins,coins);
});
test('isolated school has no coverage and leaves existing university education intact',()=>{
 const g=city();g.build(id(16,19),'home');g.build(id(40,40),'school');
 assert.equal(serviceDistances(g,'school').size,0);assert.ok(cityOverlay(g,'school').markers.every(m=>m.label==='NO COVER'));
 const before=citySatisfaction(g).factors.find(f=>f.name==='Education').score;g.build(id(18,21),'university');
 assert.ok(citySatisfaction(g).factors.find(f=>f.name==='Education').score>before);
});
