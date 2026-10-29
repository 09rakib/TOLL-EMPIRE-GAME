import {legacyGame} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {B} from '../src/balance.js';
import {Simulation} from '../src/simulation.js';
import {id,graphFrom} from '../src/world.js';
import {findRoute} from '../src/pathfinder.js';
import {capacityFor,speedFactor} from '../src/traffic.js';
import {StatsTracker} from '../src/stats.js';
import {serialize,migrate,validateSave} from '../src/storage.js';

test('elevated crossings connect only at ramps, with independent ground nodes',()=>{
  const game=legacyGame(()=>.4);game.coins=10000;
  const start=id(12,16),end=id(20,16),cross=id(16,16);
  assert.equal(game.buildSpan(start,end,'flyover'),null);
  assert.ok(game.graph.get(start).includes(start+B.layerOffset));
  assert.ok(!game.graph.get(cross).includes(cross+B.layerOffset));
  assert.ok(!game.graph.get(cross+B.layerOffset).includes(cross));
  const path=game.route(start,end,.5);assert.ok(path.some(n=>n>=B.layerOffset));
  game.density.set(cross,20);assert.equal(game.speedAt(cross+B.layerOffset),B.flyoverSpeed);
  assert.equal(game.speedAt(cross),B.minSpeedRatio);
  assert.ok(game.buildSpan(id(12,16),id(20,22),'flyover'));
  assert.ok(game.buildSpan(start,end,'flyover'));
});

test('bridge spans the complete river, connects banks, rejects invalid terrain and refunds as a unit',()=>{
  const game=legacyGame(()=>.4),a=id(28,22),b=id(28,24);
  // Create a controlled river crossing while preserving the regular city elsewhere.
  game.tiles[a]='road';game.tiles[id(28,23)]='river';game.tiles[b]='grass';game.rebuild();
  const before=game.coins;
  assert.equal(game.buildSpan(a,b,'bridge'),null);
  assert.equal(game.tiles[id(28,23)],'bridge');assert.equal(game.tiles[b],'road');
  assert.deepEqual(findRoute(game.graph,a,b,1),[a,id(28,23),b]);
  const cost=B.bridgePrice+B.roadPrice;assert.equal(game.coins,before-cost);
  assert.equal(game.demolish(id(28,23)),null);assert.equal(game.tiles[id(28,23)],'river');
  assert.equal(game.coins,before-cost+Math.round(cost*B.refund));
  assert.equal(game.undo(),null);assert.equal(game.tiles[id(28,23)],'bridge');
  assert.ok(game.planSpan(id(10,16),id(16,16),'bridge').error);
});

test('main roads and roundabouts improve capacity; signals actually alternate',()=>{
  const game=legacyGame(()=>.4),n=id(16,16);
  const initial=game.speedAt(n);assert.equal(game.build(n,'main'),null);assert.ok(game.speedAt(n)>initial);
  assert.equal(capacityFor('mainRoad'),capacityFor('road')*2);
  assert.equal(game.build(n,'roundabout'),null);assert.ok(capacityFor('roundabout')>capacityFor('road'));
  const signal=id(22,16);assert.equal(game.build(signal,'signal'),null);
  game.time=0;assert.equal(game.signalAllows(id(21,16),signal),true);assert.equal(game.signalAllows(id(22,15),signal),false);
  game.time=B.signalCycle/2;assert.equal(game.signalAllows(id(21,16),signal),false);assert.equal(game.signalAllows(id(22,15),signal),true);
  assert.ok(game.build(id(18,16),'signal'));
});

test('BPR congestion slows speed monotonically and influences route cost',()=>{
  const values=[0,1,3,6,12].map(n=>speedFactor(n,3));assert.ok(values.every((v,i)=>!i||v<=values[i-1]));assert.equal(values.at(-1),B.minSpeedRatio);
  assert.ok(speedFactor(6,6)>speedFactor(6,3));
  const game=legacyGame(()=>.4),n=id(19,16);
  assert.ok(game.route(id(7,16),id(31,16),1).includes(n));
  for(let x=15;x<=22;x++)game.density.set(id(x,16),15);game.time+=B.routeCacheSeconds;assert.equal(game.congestionAt(n),'jammed');assert.ok(!game.route(id(7,16),id(31,16),1).includes(n));
});

test('booth queues serve at capacity and never charge before service',()=>{
  const game=legacyGame(()=>.4),n=id(19,16);game.cars=[];game.build(n,'toll');
  const car=()=>({route:[id(18,16),n,id(20,16)],index:0,progress:.99,age:0,edgeAge:0,waitingNode:null,revision:game.revision,destination:id(20,16)});
  const first=car(),second=car(),third=car();game.cars.push(first,second,third);const before=game.coins;
  game.advance(first,.1);game.advance(second,.1);game.advance(third,.1);
  assert.equal(game.coins,before+10);assert.equal(game.queueLength(n),2);
  game.time=60/game.boothCapacity(n);game.advance(second,.01);assert.equal(game.coins,before+20);assert.equal(game.queueLength(n),1);
  game.advance(third,.01);assert.equal(game.coins,before+20);
  game.time=2*60/game.boothCapacity(n);game.advance(third,.01);assert.equal(game.coins,before+30);
});

test('booth levels 1–5 and permanent upgrades spend money and persist',()=>{
  const game=legacyGame(()=>.4),n=id(19,16);game.coins=10000;game.build(n,'toll');
  let old=game.boothCapacity(n);for(let i=2;i<=5;i++){assert.equal(game.upgradeBooth(n),null);assert.equal(game.tolls.get(n).level,i);assert.ok(game.boothCapacity(n)>old);old=game.boothCapacity(n);}
  assert.ok(game.upgradeBooth(n));assert.equal(game.buyUpgrade('booths'),null);assert.ok(game.boothCapacity(n)>old);
  const speed=game.speedAt(n);assert.equal(game.buyUpgrade('faster'),null);assert.ok(game.speedAt(n)>speed);
  assert.equal(game.buyUpgrade('traffic'),null);assert.equal(game.buyUpgrade('repair'),null);assert.equal(game.buyUpgrade('offline'),null);
  const save=serialize(game);assert.ok(validateSave(save));const restored=new Simulation(save,()=>.4);
  assert.equal(restored.tolls.get(n).level,5);assert.equal(restored.upgrades.faster,1);assert.equal(restored.coins,game.coins);
});

test('undo preserves intervening income and prevents negative balances',()=>{
  const game=legacyGame(()=>.4),n=id(19,16),before=game.coins;
  game.build(n,'main');game.coins+=77;assert.equal(game.undo(),null);assert.equal(game.coins,before+77);assert.equal(game.tiles[n],'road');
  game.build(n,'toll');game.removeToll(n);game.coins=0;assert.ok(game.undo());assert.equal(game.tolls.has(n),false);
});

test('undo affects only the construction, preserving later toll price decisions',()=>{
  const game=legacyGame(()=>.4),booth=id(19,16);game.coins=10000;game.build(booth,'toll');
  game.build(id(20,16),'main');game.setToll(booth,23);assert.equal(game.undo(),null);assert.equal(game.tolls.get(booth).price,23);
  game.upgradeBooth(booth);game.setToll(booth,17);assert.equal(game.undo(),null);assert.equal(game.tolls.get(booth).level,1);assert.equal(game.tolls.get(booth).price,17);
});

test('removing a booth beneath a flyover leaves the elevated structure intact',()=>{
  const game=legacyGame(()=>.4);game.coins=10000;
  game.buildSpan(id(12,16),id(20,16),'flyover');game.build(id(16,16),'toll');
  assert.equal(game.removeToll(id(16,16)),null);assert.equal(game.flyovers.length,1);assert.equal(game.tolls.size,0);
});

test('rolling stats record real travel, retain ten-minute history and capture before/after snapshots',()=>{
  const tracker=new StatsTracker(),n=12,graph=new Map([[n,[]]]);
  tracker.passage(1,n,4);tracker.payment(1,n,10);tracker.update(5,graph);
  assert.deepEqual(tracker.stats(n,5),{cars:1,avgTime:4,income:10});
  tracker.update(65,graph);assert.equal(tracker.stats(n,65).cars,0);assert.equal(tracker.history.get(n).length,2);
  tracker.update(610,graph);assert.ok(tracker.history.get(n).every(s=>s.time>=10));
  const game=legacyGame(()=>.4),booth=id(19,16);game.tracker.passage(0,booth,3);game.build(booth,'toll');
  assert.equal(game.tolls.get(booth).baseline.cars,1);game.tracker.passage(0,booth,5);game.setToll(booth,20);
  assert.equal(game.tolls.get(booth).baseline.cars,2);assert.equal(game.tolls.get(booth).baseline.avgTime,4);
});

test('version-1 saves migrate without losing city, money or toll price',()=>{
  const game=legacyGame(()=>.4),n=id(19,16);game.build(n,'toll');
  const legacy={version:1,tiles:game.tiles,buildings:game.buildings,coins:731,tolls:[[n,{price:17}]],earned:600,served:60};
  const migrated=migrate(legacy);assert.ok(validateSave(migrated));const restored=new Simulation(migrated,()=>.4);
  assert.equal(restored.coins,731);assert.equal(restored.tolls.get(n).price,17);assert.equal(restored.tolls.get(n).level,1);
  assert.equal(migrate({version:99}),null);assert.equal(validateSave({...migrated,coins:-1}),false);
  assert.equal(validateSave({...migrated,tolls:[[n,{price:10,level:8}]]}),false);
});

test('demolishing occupied roads and undoing bridges leaves no invalid active routes',()=>{
  const game=legacyGame(()=>.4);const n=id(19,16);assert.equal(game.demolish(n),null);
  for(const car of game.cars)assert.ok(car.route.every(a=>game.graph.has(a)));
  assert.equal(game.undo(),null);assert.equal(game.tiles[n],'road');
  for(let i=0;i<300;i++)game.update(B.fixedStep);assert.ok(game.cars.every(c=>Number.isFinite(c.progress)));
});
