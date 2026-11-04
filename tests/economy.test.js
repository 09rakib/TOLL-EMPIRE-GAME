import test from 'node:test';
import assert from 'node:assert/strict';
import {satisfactionEconomy} from '../src/economy.js';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {visitFee} from '../src/planner.js';
test('satisfaction effects stay bounded with a neutral midpoint and no negative business fee',()=>{
 for(const score of [-100,0,25,50,70,100,500,NaN]){const e=satisfactionEconomy(score);assert.ok(e.demand>=.95&&e.demand<=1.1);assert.ok(e.businessBonus>=0&&e.businessBonus<=.05);}
 assert.deepEqual(satisfactionEconomy(50),{demand:1,businessBonus:0});
});
test('good satisfaction changes only real visitor receipts, never posted toll prices or idle income',()=>{
 const g=new Simulation(null,()=>.4);g.trees.clear();g.coins=100000;g.build(id(18,21),'clinic');const b=g.buildingAt(id(18,21));
 g.cityEconomy=()=>({score:100,demand:1.1,businessBonus:.05});const before=g.coins;
 const car={targetBuilding:id(18,21),destination:g.buildingEntrance(b),kind:'car',age:10};assert.equal(g.settleVisit(car),visitFee(b)*1.05);assert.ok(Math.abs(g.coins-before-visitFee(b)*1.05)<1e-8);
 assert.equal(g.settleVisit(car),0);g.build(id(15,20),'toll');const toll=g.tolls.get(id(15,20));assert.equal(toll.price,10);
 const interval=g.plannerInterval();g.cityEconomy=()=>({score:0,demand:.95,businessBonus:0});assert.ok(g.plannerInterval()>interval);
});
