import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {cityOverlay,serviceDistances} from '../src/city-insights.js';
test('overlays expose isolated sites, connected service reach and full parking without mutating city',()=>{
 const g=new Simulation();g.trees.clear();g.coins=100000;
 g.build(id(18,21),'clinic');g.build(id(40,40),'clinic');g.build(id(14,19),'home');g.build(id(23,21),'parking');
 const before=g.coins,remote=id(40,40);assert.ok(cityOverlay(g,'connections').markers.some(m=>m.node===remote));
 assert.ok(serviceDistances(g,'clinic').has(id(18,20)));assert.ok(!serviceDistances(g,'clinic').has(remote));
 const home=cityOverlay(g,'clinic').markers.find(m=>m.node===id(14,19));assert.equal(home.label,'COVERED');
 g.cars=Array.from({length:4},(_,parkingSlot)=>({parkingOffice:id(23,21),parkingSlot}));
 assert.match(cityOverlay(g,'parking').markers[0].label,/4\/4 FULL/);assert.equal(g.coins,before);
 g.density.set(id(10,20),20);assert.equal(cityOverlay(g,'traffic').tiles.get(id(10,20)),'#b44739');
});
