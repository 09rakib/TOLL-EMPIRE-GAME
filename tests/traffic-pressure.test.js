import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {B} from '../src/balance.js';
import {id} from '../src/world.js';
const city=()=>{const g=new Simulation(null,()=>.4);g.trees.clear();g.coins=100000;g.cars=[];g.spawnClock=-1e6;return g;};
test('growth demand respects the road network and does not build a spawn backlog',()=>{
 const g=city();for(let x=8;x<=30;x++){g.build(id(x,19),'home');for(let i=0;i<4;i++)g.upgradeBuilding(id(x,19));}
 g.upgrades.traffic=5;g.setPolicy('tourism');assert.ok(g.plannerInterval()>=1.8);assert.ok(g.trafficBudget()<=20);
 g.spawnClock=1000;let spawns=0;g.spawn=()=>{spawns++;return false;};g.update(B.fixedStep);g.update(B.fixedStep);assert.equal(spawns,1);
});
test('full destinations reject new private trips until a reserved visit finishes',()=>{
 const g=city(),n=id(18,21);g.build(n,'clinic');
 for(const x of [8,10])assert.equal(g.addPlannerCar(id(x,20),id(18,20),n,'car'),true);
 assert.equal(g.destinationAvailable(n),false);const original=g.addPlannerCar;g.addPlannerCar=()=>{throw Error('Spawned into a full hospital');};assert.equal(g.spawnPlanner(),false);g.addPlannerCar=original;
 // A departing visitor still occupies its bay until it reaches the road.
 Object.assign(g.cars[0],{targetBuilding:null,parkingOffice:n,parkingPhase:'leaving'});assert.equal(g.destinationAvailable(n),false);
 g.cars[0].parkingPhase=null;assert.equal(g.destinationAvailable(n),true);
});
test('expired toll service waits for downstream space and pays exactly once',()=>{
 const g=city(),toll=id(20,20);g.spawn=()=>false;g.build(toll,'toll');
 g.addPlannerCar(id(19,20),id(31,20),null,'car');const car=g.cars[0];Object.assign(car,{progress:.99,waitingNode:toll,serviceAt:0,heading:0});
 g.addPlannerCar(toll,id(31,20),null,'car');const leader=g.cars[1];leader.progress=.1;leader.heading=0;g.prepareLeaders();const coins=g.coins;
 g.advance(car,B.fixedStep);assert.equal(car.index,0);assert.equal(g.coins,coins);assert.equal(car.waitingNode,toll);
 leader.progress=.8;g.prepareLeaders();g.advance(car,B.fixedStep);assert.equal(car.index,1);assert.equal(car.waitingNode,null);assert.equal(g.coins,coins+10);
 g.advance(car,B.fixedStep);assert.equal(g.coins,coins+10);
});
