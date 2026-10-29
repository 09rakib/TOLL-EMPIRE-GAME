import {legacyGame} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {B} from '../src/balance.js';
import {id} from '../src/world.js';
import {serialize,migrate,validateSave,storage,SAVE_KEY} from '../src/storage.js';
import {contractProgress,xpThreshold} from '../src/campaign.js';
import {MinHeap} from '../src/heap.js';
const city=()=>legacyGame(()=>.4);

test('homes and businesses create connected destinations, residents and real recurring income',()=>{
  const g=city();assert.equal(g.build(id(15,15),'home'),null);assert.equal(g.population,20);assert.ok(g.destinations.includes(id(16,15))||g.destinations.includes(id(15,16)));
  assert.equal(g.build(id(18,15),'shop'),null);assert.equal(g.businessRate,8);const money=g.coins;
  g.updateGrowth(30);assert.ok(Math.abs(g.coins-money-4)<.001);assert.equal(g.earned,4);
  assert.ok(g.build(id(0,0),'home'));assert.ok(g.build(id(18,15),'park'));
});

test('building upgrades, paint, demolition and undo survive persistence',()=>{
  const g=city(),n=id(15,15);g.coins=10000;g.build(n,'shop');const base=g.businessRate;
  g.upgradeBuilding(n);g.paintBuilding(n,4);assert.ok(g.businessRate>base);assert.equal(g.buildingAt(n).level,2);
  const copy=serialize(g);assert.ok(validateSave(copy));const loaded=new Simulation(copy,()=>.4);
  assert.equal(loaded.buildingAt(n).paint,4);assert.equal(loaded.buildingAt(n).level,2);
  g.demolish(n);assert.equal(g.buildingAt(n),undefined);assert.equal(g.businessRate,0);g.undo();assert.equal(g.buildingAt(n).level,2);assert.ok(g.businessRate>base);
});

test('business benefits switch off when a building loses all road connections',()=>{
  const g=city(),n=id(18,15);g.build(n,'shop');assert.equal(g.businessRate,8);
  for(const neighbor of g.neighbors(n))if(g.graph.has(neighbor))g.tiles[neighbor]='grass';
  g.rebuild();assert.equal(g.businessRate,0);assert.equal(g.destinations.length,0);
});

test('an isolated road beside a business does not count as a working city connection',()=>{
  const g=city(),n=id(18,15);g.build(n,'shop');
  g.tiles[id(17,16)]='grass';g.tiles[id(19,16)]='grass';g.rebuild();assert.ok(g.graph.has(id(18,16)));assert.equal(g.businessRate,0);
});

test('contract rewards are earned once and the board keeps supplying new goals',()=>{
  const g=city(),contract=g.campaign.contracts.find(c=>c.key==='managed');assert.equal(contractProgress(g,contract),0);assert.ok(g.claimContract(contract.id));
  g.build(id(15,15),'home');assert.equal(contractProgress(g,contract),1);const before=g.coins;
  assert.equal(g.claimContract(contract.id),null);assert.equal(g.coins,before+contract.reward);assert.equal(g.campaign.claimed,1);assert.ok(g.claimContract(contract.id));assert.equal(g.campaign.contracts.length,3);
  const id0=g.campaign.contracts[0].id,reward=g.campaign.contracts[0].reward;for(let i=0;i<50;i++)g.swapContract(g.campaign.contracts[0].id);assert.notEqual(g.campaign.contracts[0].id,id0);assert.equal(g.campaign.contracts[0].reward,reward);
});

test('undoing construction removes its contract progress instead of farming rewards',()=>{
  const g=city(),c=g.campaign.contracts.find(c=>c.key==='managed');g.build(id(15,15),'home');assert.equal(contractProgress(g,c),1);g.undo();assert.equal(contractProgress(g,c),0);assert.ok(g.claimContract(c.id));
});

test('districts require real development and city levels, spend money and increase growth',()=>{
  const g=city();g.coins=20000;assert.ok(g.developDistrict('north'));g.build(id(9,9),'home');
  const demand=g.demandBonus,before=g.coins;assert.equal(g.developDistrict('north'),null);assert.equal(g.coins,before-800);assert.ok(g.demandBonus>demand);
  assert.ok(g.developDistrict('harbor'));g.campaign.xp=xpThreshold(9);assert.equal(g.cityLevel,9);
  g.developDistrict('north');g.developDistrict('north');assert.equal(g.campaign.districts.north,3);assert.ok(g.developDistrict('north'));
});

test('optional city events change traffic conditions and award only completed objectives once',()=>{
  const g=city();g.time=B.eventInterval;g.updateGrowth(0);assert.equal(g.campaign.event.status,'offer');
  assert.equal(g.acceptEvent(),null);assert.equal(g.eventSpec().demand,1.5);assert.ok(g.finishEvent());
  g.campaign.trips+=g.eventSpec().target;g.time=g.campaign.event.endsAt;g.updateGrowth(0);assert.equal(g.campaign.event.status,'won');
  const before=g.coins,reward=g.campaign.event.reward;assert.equal(g.finishEvent(),null);assert.equal(g.coins,before+reward);assert.ok(g.finishEvent());
});

test('policy tradeoffs affect actual driving and business income',()=>{
  const g=city();g.build(id(18,15),'shop');const speed=g.speedAt(id(19,16)),income=g.totalIncome;
  g.setPolicy('express');assert.ok(g.speedAt(id(19,16))>speed);assert.ok(g.totalIncome<income);
  g.setPolicy('tourism');assert.ok(g.speedAt(id(19,16))<speed);assert.ok(g.totalIncome>income);assert.ok(g.setPolicy('invalid'));
});

test('offline earnings use the saved rate, respect the eight-hour cap and collect once',()=>{
  const g=city(),saved=serialize(g);saved.lastSaved=Date.now()-24*3600*1000;saved.incomePerMinute=60;
  const loaded=new Simulation(saved,()=>.4);assert.equal(loaded.campaign.pendingOffline,14400);const money=loaded.coins;
  assert.equal(loaded.claimOffline(),14400);assert.equal(loaded.coins,money+14400);assert.equal(loaded.claimOffline(),0);
});

test('old saves migrate to growth mode without losing roads, booths or coins',()=>{
  const g=city();g.build(id(19,16),'toll');const v2={...serialize(g),version:2,coins:4567};delete v2.campaign;delete v2.settings;
  const migrated=migrate(v2);assert.ok(validateSave(migrated));assert.equal(migrated.version,3);const loaded=new Simulation(migrated,()=>.4);
  assert.equal(loaded.coins,4567);assert.equal(loaded.tolls.get(id(19,16)).price,10);assert.equal(loaded.campaign.contracts.length,3);
});

test('car interpolation positions stay finite and low-power mode bounds new spawns',()=>{
  const g=city();g.settings.lowPower=true;for(let i=0;i<900;i++)g.update(B.fixedStep);
  assert.ok(g.cars.length<=B.lowPowerCars);assert.ok(g.cars.every(c=>[c.worldX,c.worldY,c.prevX,c.prevY,c.angle].every(Number.isFinite)));
});

test('heap maintains lowest-cost-first ordering and routing caches invalidate on toll changes',()=>{
  const heap=new MinHeap();for(const n of [4,9,0,3,1,12,2])heap.push([n,n]);const order=[];while(heap.size)order.push(heap.pop()[0]);assert.deepEqual(order,[0,1,2,3,4,9,12]);
  const g=city(),n=id(19,16),start=id(7,16),end=id(31,16);g.build(n,'toll');g.setToll(n,0);assert.ok(g.route(start,end,.2).includes(n));g.setToll(n,30);assert.ok(!g.route(start,end,.2).includes(n));
});

test('milestone rewards cannot be collected twice',()=>{const g=city();g.served=500;const before=g.coins;assert.equal(g.claimAchievement('commuter'),null);assert.equal(g.coins,before+900);assert.ok(g.claimAchievement('commuter'));});

test('heavy congestion cannot trap cars forever at a cycling signal',()=>{
  const g=city(),from=id(16,15),signal=id(16,16);g.build(signal,'signal');g.density.set(from,200);
  const car={route:[from,signal,id(16,17)],index:0,progress:.99,age:0,edgeAge:0,waitingNode:null,revision:g.revision,destination:id(16,17)};
  g.time=0;g.advance(car,B.fixedStep);assert.equal(car.index,0);
  g.time=B.signalCycle/2;for(let i=0;i<10;i++)g.advance(car,B.fixedStep);assert.equal(car.index,1);
});

test('invalid growth data is rejected and an intact browser backup recovers a broken main save',()=>{
  const g=city(),save=serialize(g),copy=structuredClone(save);copy.campaign.contracts[0].target=0;assert.equal(validateSave(copy),false);
  const previous=globalThis.localStorage,values=new Map();globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  try{assert.equal(storage.save(g),true);g.coins=321;assert.equal(storage.save(g),true);values.set(SAVE_KEY,'{broken');const restored=storage.load();assert.ok(restored);assert.equal(restored.coins,1000);}finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
