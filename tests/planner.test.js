import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {createCity,id} from '../src/world.js';
import {B} from '../src/balance.js';
import {visitFee,visitCapacity,architectureTier} from '../src/planner.js';
import {buildingStyle} from '../src/architecture.js';
import {serialize,storage,SAVE_KEY,validateSave,migrate} from '../src/storage.js';
import {legacyGame} from './fixtures.js';
import {updateTutorial} from '../src/tutorial.js';
// Economy fixtures use already-cleared land; forest behavior has dedicated tests.
const city=()=>{const g=new Simulation(null,()=>.4);g.trees.clear();return g;};
test('planner begins with empty land, one continuous road, a bus and a car',()=>{
  const map=createCity(),g=city();assert.equal(map.buildings.length,0);assert.equal(map.tiles.filter(t=>t==='building').length,0);
  assert.ok(map.tiles.every((t,n)=>t!=='road'||Math.floor(n/B.size)===20));assert.equal(g.cars.length,2);assert.deepEqual(g.cars.map(c=>c.kind).sort(),['bus','car']);assert.equal(g.mode,'planner');assert.equal(g.trafficBudget(),2);assert.equal(g.population,0);
});
test('buying and upgrading homes increases residents, traffic supply and visual tier',()=>{
  const g=city(),n=id(18,21),base=g.plannerInterval();g.coins=10000;g.build(n,'home');assert.equal(g.population,20);assert.equal(g.trafficBudget(),6);assert.ok(g.plannerInterval()<base);
  const before=buildingStyle(g.buildingAt(n)),tier=architectureTier(g.buildingAt(n));g.upgradeBuilding(n);assert.equal(g.population,40);assert.equal(g.trafficBudget(),10);assert.ok(buildingStyle(g.buildingAt(n)).height>before.height);assert.notEqual(architectureTier(g.buildingAt(n)),tier);
});
test('hospital earns nothing while idle, and a real patient arrival credits the receipt',()=>{
  const g=city(),n=id(18,21);g.coins=10000;g.build(n,'clinic');const before=g.coins;g.updateGrowth(600);assert.equal(g.coins,before);
  const car={route:[id(17,20),id(18,20)],index:0,progress:.5,age:0,edgeAge:0,waitingNode:null,revision:g.revision,destination:id(18,20),targetBuilding:n,kind:'car'};
  g.syncCarPosition(car);g.advance(car,.01);assert.equal(g.coins,before);g.advance(car,.5);assert.equal(g.coins,before);g.advance(car,1);assert.equal(g.coins,before);for(let i=0;i<2400&&!car.parkingPaid;i++){g.time+=B.fixedStep;if(car.parkingPhase)g.updateOfficeParking(car,B.fixedStep);else g.advance(car,B.fixedStep);g.syncCarPosition(car);}assert.equal(car.parkingPhase,'parked');assert.equal(g.coins,before+24);assert.equal(g.buildingAt(n).visitors,1);assert.equal(g.buildingAt(n).revenue,24);
});
test('office, hotel and hospital upgrades raise both visitor fees and service capacity',()=>{
  for(const kind of ['office','hotel','clinic']){const g=city(),n=id(18,21);g.coins=100000;assert.equal(g.build(n,kind),null);const b=g.buildingAt(n),fee=visitFee(b),cap=visitCapacity(b);const before=g.coins;g.settleVisit({targetBuilding:n,destination:id(18,20),age:10,kind:'car'});assert.equal(g.coins,before+fee);
    g.upgradeBuilding(n);assert.ok(visitFee(b)>fee);assert.ok(visitCapacity(b)>cap);g.time=60;const balance=g.coins;g.settleVisit({targetBuilding:n,destination:id(18,20),age:10,kind:'car'});assert.ok(g.coins>balance+fee);
  }
});
test('capacity and road connections are required before a business can admit more visitors',()=>{
  const g=city(),n=id(18,21);g.coins=10000;g.build(n,'clinic');const car={targetBuilding:n,destination:id(18,20),age:10,kind:'car'};
  assert.equal(g.settleVisit(car),24);assert.equal(g.settleVisit(car),0);g.time=60;g.demolish(id(18,20));assert.equal(g.settleVisit(car),0);
});
test('a bus brings three paying visitors, with matching ledger and rolling statistics',()=>{
  const g=city(),n=id(18,21);g.coins=10000;g.build(n,'hotel');assert.equal(g.settleVisit({targetBuilding:n,destination:id(18,20),age:10,kind:'bus'}),60);
  assert.equal(g.buildingAt(n).visitors,3);assert.equal(g.businessTracker.stats(n,0).cars,3);assert.equal(g.totalIncome,60);
});
test('higher-level toll booths unlock posted rates and collect exactly the displayed charge',()=>{
  const g=city(),n=id(19,20);g.coins=10000;g.build(n,'toll');const car=()=>({route:[id(18,20),n,id(20,20)],index:0,progress:.99,age:0,edgeAge:0,waitingNode:null,revision:g.revision,destination:id(20,20)});
  let before=g.coins;g.advance(car(),.1);assert.equal(g.coins-before,10);g.upgradeBooth(n);g.time=3;before=g.coins;g.advance(car(),.1);assert.equal(g.coins-before,20);
});
test('more homes produce measurably more actual traffic and completed trips',()=>{
  const bare=city(),grown=city();grown.coins=10000;for(const x of [18,20,22])grown.build(id(x,19),'home');let basePeak=0,grownPeak=0;
  for(let i=0;i<3600;i++){bare.update(B.fixedStep);grown.update(B.fixedStep);basePeak=Math.max(basePeak,bare.cars.length);grownPeak=Math.max(grownPeak,grown.cars.length);}
  assert.ok(basePeak<=2);assert.ok(grownPeak>basePeak);assert.ok(grown.campaign.trips>bare.campaign.trips);
});
test('planner progress and visit receipts persist, while an older city is preserved separately',()=>{
  const previous=globalThis.localStorage,map=new Map(),legacy=serialize(legacyGame());map.set('toll-empire-v1',JSON.stringify(legacy));globalThis.localStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  try{assert.equal(storage.load(),null);const g=city();g.coins=10000;g.build(id(18,21),'clinic');g.settleVisit({targetBuilding:id(18,21),destination:id(18,20),age:10,kind:'car'});assert.equal(storage.save(g),true);assert.equal(map.get('toll-empire-v1'),JSON.stringify(legacy));assert.ok(storage.legacyBackup().buildings.length>0);assert.ok(map.has(SAVE_KEY));const saved=storage.load();assert.ok(validateSave(saved));const restored=new Simulation(saved,()=>.4);assert.equal(restored.mode,'planner');assert.equal(restored.buildingAt(id(18,21)).revenue,24);}
  finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
test('planner tutorial begins with homes, then tolls, then a working business',()=>{
  const g=city();g.coins=10000;updateTutorial(g);assert.equal(g.campaign.tutorial.step,0);g.build(id(18,21),'home');updateTutorial(g);assert.equal(g.campaign.tutorial.step,1);g.build(id(19,20),'toll');updateTutorial(g);assert.equal(g.campaign.tutorial.step,2);g.build(id(22,21),'office');updateTutorial(g);assert.equal(g.campaign.tutorial.step,3);
});
test('undoing a building upgrade preserves later visitor receipts and paint',()=>{
  const g=city(),n=id(18,21);g.coins=10000;g.build(n,'clinic');g.upgradeBuilding(n);g.paintBuilding(n,3);
  const payment=g.settleVisit({targetBuilding:n,destination:id(18,20),age:10,kind:'car'}),balance=g.coins;
  g.undo();const b=g.buildingAt(n);assert.equal(b.level,1);assert.equal(b.visitors,1);assert.equal(b.revenue,payment);assert.equal(b.paint,3);assert.equal(g.coins,balance+1575);
});
test('booth levels enforce 10/20/30/40/50 caps, persist, and undo restores a legal rate',()=>{
  const g=city(),n=id(19,20);g.coins=10000;g.build(n,'toll');
  for(let level=1;level<=5;level++){
    assert.equal(g.tollLimit(g.tolls.get(n)),level*10);g.setToll(n,1000);assert.equal(g.tolls.get(n).price,level*10);
    assert.ok(validateSave(serialize(g)));g.setToll(n,-1);assert.equal(g.tolls.get(n).price,0);g.setToll(n,level*10);
    if(level<5){g.upgradeBooth(n);assert.equal(g.tolls.get(n).price,(level+1)*10);}
  }
  g.undo();assert.equal(g.tolls.get(n).level,4);assert.equal(g.tolls.get(n).price,40);
});
test('40x40 saves expand to 64x64 preserving structures, coordinates, city money and UI settings',()=>{
  const saved=serialize(city()),old=(x,y)=>y*40+x;
  saved.tiles=Array(1600).fill('grass');saved.tiles[old(18,20)]='road';saved.tiles[old(18,19)]='building';saved.tiles[old(19,20)]='road';
  saved.buildings=[{x:18,y:19,type:0,level:2,managed:true,investment:330}];saved.tolls=[[old(18,20),{level:1,price:30,alternativeBefore:{node:old(19,20)}}]];
  saved.flyovers=[{nodes:[old(18,20),old(19,20),old(20,20)],cost:270}];saved.bridges=[{nodes:[old(1,32),old(1,33),old(1,34)],cost:100}];saved.signals=[old(19,20)];saved.coins=1234;saved.settings.hideGoal=true;delete saved.mapSize;
  const expanded=migrate(saved);assert.ok(validateSave(expanded));assert.equal(expanded.tiles.length,4096);assert.equal(expanded.tiles[id(18,19)],'building');assert.equal(expanded.tiles[id(63,63)],'grass');assert.equal(expanded.coins,1234);
  assert.equal(expanded.tolls[0][0],id(18,20));assert.equal(expanded.tolls[0][1].price,10);assert.equal(expanded.tolls[0][1].alternativeBefore.node,id(19,20));assert.deepEqual(expanded.signals,[id(19,20)]);assert.equal(expanded.flyovers[0].nodes[2],id(20,20));assert.equal(expanded.bridges[0].nodes[1],id(1,33));
  const g=new Simulation(expanded,()=>.4);assert.equal(g.buildingAt(id(18,19)).level,2);assert.equal(g.settings.hideGoal,true);
});
test('expanded land supports connected construction past the old city boundary',()=>{
  const g=city();g.coins=10000;for(let x=32;x<=48;x++)assert.equal(g.build(id(x,20),'road'),null);
  assert.equal(g.build(id(48,16),'clinic'),null);assert.ok(g.businessDestinations.some(d=>d.building===id(48,16)));
});
