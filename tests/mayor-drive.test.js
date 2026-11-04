import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {serialize,validateSave} from '../src/storage.js';
test('mayor drives real roads, brakes and exits without changing saves or generating receipts',()=>{
 const g=new Simulation();g.cars=[];g.spawn=()=>false;const before=g.coins;assert.equal(g.startMayorDrive(),null);const c=g.cars[0];c.accelerator=true;for(let i=0;i<180;i++)g.update(1/30);assert.ok(c.worldX>8);assert.ok(g.cars.includes(c));assert.equal(g.coins,before);c.accelerator=false;c.brake=true;for(let i=0;i<60;i++)g.update(1/30);const x=c.worldX;for(let i=0;i<60;i++)g.update(1/30);assert.equal(c.worldX,x);assert.ok(validateSave(serialize(g)));g.endMayorDrive();assert.equal(g.cars.length,0);assert.equal(new Simulation(serialize(g)).cars.some(c=>c.mayor),false);
});
test('mayor cannot reverse on unmarked roads or disappear at a road end',()=>{
 const g=new Simulation();g.cars=[];g.spawn=()=>false;g.startMayorDrive();const c=g.cars[0];c.accelerator=true;c.steering=2;for(let i=0;i<1600;i++)g.update(1/30);assert.ok(g.cars.includes(c));assert.equal(c.done,false);assert.equal(c.driveSpeed,0);assert.ok(c.worldX<=32);g.coins=10000;g.build(c.route[c.index],'uturn');c.steering=2;for(let i=0;i<200;i++)g.update(1/30);assert.ok(c.worldX<31.5);
});
