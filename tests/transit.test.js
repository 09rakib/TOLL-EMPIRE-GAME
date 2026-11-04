import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {serialize,validateSave} from '../src/storage.js';
const city=()=>{const g=new Simulation(null,()=>.4);g.trees.clear();g.coins=100000;g.cars=[];g.spawn=()=>false;return g;};
test('bus stops and routes charge once, enforce legal return paths and preserve saves',()=>{
 const g=city(),a=id(12,20),b=id(22,20),before=g.coins;assert.equal(g.build(a,'bus-stop'),null);assert.ok(g.build(a,'bus-stop'));assert.equal(g.build(b,'bus-stop'),null);
 assert.match(g.createTransitLine([a,b]),/U-turn/);assert.equal(g.coins,before-200);g.build(a,'uturn');g.build(b,'uturn');assert.equal(g.createTransitLine([a,b]),null);assert.ok(validateSave(serialize(g)));
 const restored=new Simulation(serialize(g));assert.equal(restored.transit.lines.length,1);assert.ok(g.removeStop(a));assert.equal(g.removeTransitLine(1),null);assert.equal(g.removeStop(a),null);assert.equal(g.undo(),null);assert.ok(g.transit.stops.includes(a));
});
test('scheduled bus drives stops, dwells, delivers real riders and reduces private demand only after arrival',()=>{
 const g=city(),a=id(12,20),b=id(22,20);for(const n of [a,b]){g.build(n,'bus-stop');g.build(n,'uturn');}g.build(id(12,19),'home');g.build(id(22,19),'home');g.createTransitLine([a,b]);
 assert.equal(g.transitRelief(),0);let bus,arrived=false,dwell=false;
 for(let i=0;i<6000;i++){g.update(1/30);bus=g.cars.find(c=>c.transitId===1);if(bus?.transitDwellUntil!==null&&bus?.transitDwellUntil!==undefined)dwell=true;if(g.transit.passengers>=4){arrived=true;break;}}
 assert.ok(bus);assert.ok(dwell);assert.ok(arrived);assert.ok(g.transitRelief()>0&&g.transitRelief()<=.2);assert.equal(g.earned,0);
 g.transit.lines[0].paused=true;const visits=g.transit.passengers;for(let i=0;i<3600;i++)g.update(1/30);assert.ok(g.transit.passengers<=visits+6);assert.equal(g.transitRelief(),0);
});
test('disconnected route stays visible and resumes after a road is repaired',()=>{
 const g=city(),a=id(12,20),b=id(22,20);for(const n of [a,b]){g.build(n,'bus-stop');g.build(n,'uturn');}g.createTransitLine([a,b]);for(let i=0;i<100;i++)g.update(1/30);const bus=g.cars.find(c=>c.transitId);assert.ok(bus);
 g.removeRoad(id(17,20));for(let i=0;i<1800;i++)g.update(1/30);assert.ok(g.cars.includes(bus));assert.equal(g.cars.filter(c=>c.transitId).length,1);g.build(id(17,20),'road');for(let i=0;i<1800;i++)g.update(1/30);assert.ok(Number.isFinite(bus.worldX+bus.worldY));
 const save=serialize(g);save.transit.lines[0].stops=[a,a];assert.equal(validateSave(save),false);
});
