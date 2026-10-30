import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {B} from '../src/balance.js';
import {serialize,validateSave} from '../src/storage.js';
import {plotCells,plannedPlot} from '../src/plots.js';

test('planner grows a dense persistent forest only on empty grass, including old saves',()=>{
  const g=new Simulation(null,()=>.4);
  assert.ok(g.trees.size>1800);assert.ok([...g.trees].every(n=>g.tiles[n]==='grass'));
  const saved=serialize(g);assert.ok(validateSave(saved));delete saved.trees;
  saved.tiles[id(18,19)]='building';saved.buildings.push({x:18,y:19,type:0,managed:true,level:1});
  const old=new Simulation(saved,()=>.4);assert.ok(old.trees.size>1800);assert.equal(old.trees.has(id(18,19)),false);
});
test('wooded plots block every building and road until the quoted clearing fee is paid',()=>{
  for(const kind of ['home','office','clinic','hotel','park','road','main']){
    const g=new Simulation(null,()=>.4),n=id(18,kind==='park'?21:19);g.coins=10000;const area=plotCells(plannedPlot(n,kind));for(const cell of area)g.trees.delete(cell);g.trees.add(n);const balance=g.coins,cost=g.treeRemovalCost(n);
    assert.match(g.build(n,kind),/Clear the trees/);assert.equal(g.coins,balance);
    assert.equal(g.clearTrees(n),null);assert.equal(g.coins,balance-cost);assert.equal(g.trees.has(n),false);
    assert.equal(g.build(n,kind),null);
  }
});
test('clearing rejects insufficient money, charges once, saves and supports two-stage undo',()=>{
  const g=new Simulation(null,()=>.4),n=id(18,19);g.trees.add(n);const cost=g.treeRemovalCost(n);g.coins=cost-1;
  assert.ok(g.clearTrees(n));assert.equal(g.coins,cost-1);assert.ok(g.trees.has(n));
  g.coins=1000;assert.equal(g.clearTrees(n),null);const balance=g.coins;assert.ok(g.clearTrees(n));assert.equal(g.coins,balance);
  const saved=serialize(g);assert.ok(validateSave(saved));assert.equal(new Simulation(saved).trees.has(n),false);
  g.build(n,'home');g.undo();assert.equal(g.trees.has(n),false);assert.equal(g.tiles[n],'grass');
  g.coins+=20;g.undo();assert.equal(g.coins,1020);assert.equal(g.trees.has(n),true);
});
test('removing a road removes its fixtures and disconnects businesses; undo restores all',()=>{
  const g=new Simulation(null,()=>.4),road=id(18,20),plot=id(18,19);g.trees.delete(plot);g.coins=10000;
  g.build(plot,'clinic');g.build(road,'toll');g.upgradeBooth(road);const before=g.coins,refund=Math.round((B.roadPrice+B.tollPrice+B.boothUpgradePrices[0])*B.refund);
  assert.equal(g.removeRoad(road),null);assert.equal(g.coins,before+refund);assert.equal(g.tiles[road],'grass');assert.equal(g.tolls.has(road),false);assert.equal(g.buildingEntrance(g.buildingAt(plot)),null);
  assert.ok(g.clearTrees(road));g.undo();assert.equal(g.coins,before);assert.equal(g.tiles[road],'road');assert.equal(g.tolls.get(road).level,2);assert.notEqual(g.buildingEntrance(g.buildingAt(plot)),null);
  assert.ok(g.removeRoad(g.endpoints[0]));
});
test('removing any city building refunds investment, preserves cleared land and is undoable',()=>{
  for(const kind of ['home','office','clinic','hotel','park']){
    const g=new Simulation(null,()=>.4),n=id(18,kind==='park'?21:19);g.coins=10000;for(const cell of plotCells(plannedPlot(n,kind)))g.trees.delete(cell);g.trees.add(n);g.clearTrees(n);g.build(n,kind);const value=g.buildingAt(n).investment,balance=g.coins;
    assert.equal(g.demolish(n),null);assert.equal(g.tiles[n],'grass');assert.equal(g.coins,balance+Math.round(value*B.refund));assert.equal(g.trees.has(n),false);
    g.undo();assert.equal(g.tiles[n],'building');assert.equal(g.buildingAt(n).kind,kind);
  }
});
test('forest save validation rejects trees on roads, duplicate nodes and out-of-world nodes',()=>{
  const saved=serialize(new Simulation());for(const trees of [[id(18,20)],[id(18,19),id(18,19)],[B.layerOffset]])assert.equal(validateSave({...saved,trees}),false);
});
