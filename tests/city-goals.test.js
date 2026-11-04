import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {neighborhoodGoal,goalState} from '../src/city-goals.js';
import {serialize,validateSave} from '../src/storage.js';
test('district goals advance once per claim, count fresh paid visitors and survive save/load',()=>{
 const g=new Simulation();g.trees.clear();g.coins=100000;
 assert.equal(neighborhoodGoal(g,'central').value,0);g.build(id(10,19),'home');g.build(id(11,19),'home');
 assert.equal(g.claimNeighborhood('central'),null);assert.ok(g.claimNeighborhood('central'));g.build(id(18,21),'clinic');assert.equal(g.claimNeighborhood('central'),null);
 const b=g.buildingAt(id(18,21)),car={targetBuilding:id(18,21),destination:g.buildingEntrance(b),kind:'bus',age:10};
 for(let i=0;i<10;i++){g.time+=20;assert.ok(g.settleVisit(car)>0);}
 assert.equal(neighborhoodGoal(g,'central').value,30);assert.equal(g.claimNeighborhood('central'),null);
 g.campaign.trips+=10;g.density.set(id(10,20),3);for(let i=0;i<29;i++)g.updateCityGoals(1);assert.equal(neighborhoodGoal(g,'central').ready,false);
 g.updateCityGoals(1);assert.equal(neighborhoodGoal(g,'central').ready,true);const saved=serialize(g);assert.ok(validateSave(saved));
 const restored=new Simulation(saved);assert.equal(restored.claimNeighborhood('central'),null);assert.equal(neighborhoodGoal(restored,'central').complete,true);assert.ok(restored.claimNeighborhood('central'));
});
test('traffic goal resets when roads jam and malformed optional goal saves are rejected',()=>{
 const g=new Simulation();g.trees.clear();g.coins=10000;g.build(id(10,19),'home');g.build(id(11,19),'home');const s=goalState(g,'central');s.stage=3;s.steady=20;g.density.set(id(10,20),20);g.updateCityGoals(1);assert.equal(s.steady,0);
 const saved=serialize(g);saved.campaign.neighborhoods.districts.central.stage=8;assert.equal(validateSave(saved),false);
});
