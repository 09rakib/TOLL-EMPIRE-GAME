import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {B} from '../src/balance.js';
import {id} from '../src/world.js';
const city=()=>{const g=new Simulation(null,()=>.4);g.trees.clear();g.coins=100000;g.cars=[];g.spawn=()=>false;return g;};
test('a resident from a dead-end home completes a business visit and leaves without an illegal road U-turn',()=>{
 const g=city();for(let y=17;y<20;y++)g.build(id(18,y),'road');g.build(id(18,16),'home');g.build(id(18,21),'clinic');
 const n=id(18,21),b=g.buildingAt(n);assert.equal(g.addPlannerCar(id(18,17),g.buildingEntrance(b),n,'car'),true);
 const car=g.cars[0],phases=new Set();for(let i=0;i<9000&&!car.done;i++){g.update(B.fixedStep);if(car.parkingPhase)phases.add(car.parkingPhase);if(!car.done)assert.ok(g.cars.includes(car));}
 assert.ok(phases.has('parked'));assert.ok(phases.has('leaving'));assert.equal(car.done,true);assert.ok(g.endpoints.includes(car.destination));assert.equal(b.visitors,1);assert.ok(b.revenue>=24&&b.revenue<=25.2);assert.equal(g.uturns.size,0);
});
test('a driveway holds a departing visitor until its outgoing lane has a gap',()=>{
 const g=city(),n=id(18,21);g.build(n,'home');const b=g.buildingAt(n),entry=g.buildingEntrance(b),path=g.parkingExitRoute({origin:id(7,20),vot:.4},entry);
 const visitor={origin:id(7,20),vot:.4,route:[entry],index:0,progress:0,parkingOffice:n,parkingSite:{...b},parkingSlot:0,parkingPhase:'leaving',parkingPath:[[18.5*B.tile,21*B.tile],[18.5*B.tile,20.5*B.tile]],parkingIndex:0,parkingDistance:0,worldX:18.5,worldY:21,age:0,targetBuilding:n};g.cars=[];
 assert.equal(g.addPlannerCar(entry,id(7,20),null,'car'),true);g.cars.unshift(visitor);const blocker=g.cars[1];blocker.progress=.1;g.prepareLeaders();
 assert.equal(g.parkingMergeClear(visitor,path),false);g.updateOfficeParking(visitor,B.fixedStep);assert.equal(visitor.worldY,21);assert.equal(visitor.parkingIndex,0);
 blocker.done=true;assert.equal(g.parkingMergeClear(visitor,path),true);for(let i=0;i<100&&visitor.parkingPhase;i++)g.updateOfficeParking(visitor,B.fixedStep);
 assert.equal(visitor.parkingPhase,null);assert.equal(visitor.destination,id(7,20));assert.equal(visitor.parkingSlot,null);assert.equal(visitor.stranded,false);
});
