import {legacyGame} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {B} from '../src/balance.js';
import {findRoute,valueOfTime} from '../src/pathfinder.js';
import {createLegacyCity as createCity,graphFrom,id} from '../src/world.js';
import {Simulation} from '../src/simulation.js';
test('pathfinder finds shortest path and avoids an expensive toll',()=>{
  const graph=new Map([[0,[1,3]],[1,[0,2]],[2,[1,5]],[3,[0,4]],[4,[3,5]],[5,[4,2]]]);
  assert.deepEqual(findRoute(graph,0,2,1),[0,1,2]);
  assert.deepEqual(findRoute(graph,0,2,1,new Map([[1,{price:30}]])),[0,3,4,5,2]);
  assert.equal(findRoute(graph,0,99,1),null);
});
test('calibrated detour: toll elasticity and income hump',()=>{
  const graph=new Map([[0,[1,3]],[1,[2]],[2,[]]]);
  // Alternative is exactly 12 road tiles (40 seconds) longer.
  for(let n=3;n<16;n++)graph.set(n,[n===15?2:n+1]);
  const expected=[100,85,60,25,8],prices=[0,5,10,20,30],traffic=[];
  for(let i=0;i<prices.length;i++){
    let count=0;
    for(let q=0;q<1000;q++)if(findRoute(graph,0,2,valueOfTime((q+.5)/1000),new Map([[1,{price:prices[i]}]])).includes(1))count++;
    const share=count/10;traffic.push(share);assert.ok(Math.abs(share-expected[i])<1,`${prices[i]} coins: ${share}%`);
  }
  assert.ok(traffic.every((n,i)=>!i||n<=traffic[i-1]));
  const alternative=traffic.map(n=>100-n);assert.ok(alternative.every((n,i)=>!i||n>=alternative[i-1]));
  const revenue=traffic.map((n,i)=>n*prices[i]);assert.ok(revenue[2]>revenue[1]&&revenue[2]>revenue[3]&&revenue[2]>revenue[4]);
});
test('legacy city retains a usable free alternative to Willow Boulevard',()=>{
  const graph=graphFrom(createCity().tiles),start=id(7,16),end=id(31,16),booth=id(19,16);
  assert.ok(findRoute(graph,start,end,.25).includes(booth));
  assert.ok(!findRoute(graph,start,end,.25,new Map([[booth,{price:30}]] )).includes(booth));
});
test('construction validates money, adjacency, legal terrain and multiple booths',()=>{
  const game=legacyGame(()=>.4);
  assert.ok(game.build(id(0,0),'road'));assert.equal(game.coins,1000);
  assert.equal(game.build(id(8,15),'road'),null);assert.equal(game.coins,975);
  assert.equal(game.build(id(19,16),'toll'),null);assert.equal(game.coins,825);
  assert.equal(game.build(id(20,16),'toll'),null);assert.equal(game.tolls.size,2);
  game.removeToll(id(19,16));assert.equal(game.coins,765);
  game.coins=0;assert.ok(game.build(id(19,16),'toll'));
});
test('crossing a booth pays exactly once, paused simulation stops, saves restore',()=>{
  const game=legacyGame(()=>.4),n=id(19,16);game.build(n,'toll');
  const car={route:[id(18,16),n,id(20,16)],index:0,progress:.99,age:0,revision:game.revision,destination:id(20,16)};
  const before=game.coins;game.advance(car,.1);assert.equal(game.coins,before+10);assert.equal(game.income,10);
  game.advance(car,.01);assert.equal(game.coins,before+10);
  game.paused=true;const time=game.time;game.update(1);assert.equal(game.time,time);
  const saved={tiles:game.tiles,buildings:game.buildings,coins:game.coins,tolls:[...game.tolls],earned:game.earned,served:game.served};
  const restored=new Simulation(saved,()=>.4);assert.equal(restored.coins,game.coins);assert.equal(restored.tolls.get(n).price,10);
});
test('fixed-step simulation stays within the car cap and produces real toll revenue',()=>{
  let seed=1234;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const game=legacyGame(random);game.build(id(19,16),'toll');
  for(let i=0;i<5400;i++)game.update(B.fixedStep);
  assert.ok(game.cars.length<=B.maxCars);assert.ok(game.earned>0);assert.ok(game.served>0);assert.ok(game.coins>850);
});
