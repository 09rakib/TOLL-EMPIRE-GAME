import test from 'node:test';
import assert from 'node:assert/strict';
import {tollAxis} from '../src/toll-art.js';
import {Simulation} from '../src/simulation.js';
import {B} from '../src/balance.js';
import {id} from '../src/world.js';
import {serialize,validateSave} from '../src/storage.js';
test('toll orientation follows road edits and saved booth upgrades retain their price and investment',()=>{
 const g=new Simulation();g.trees.clear();g.coins=100000;const n=id(18,20);g.build(n,'toll');assert.equal(tollAxis(g.tiles,n),0);
 for(const level of [2,3,4,5]){assert.equal(g.upgradeBooth(n),null);assert.equal(g.tolls.get(n).level,level);}
 const booth={...g.tolls.get(n)};g.removeRoad(id(17,20));g.removeRoad(id(19,20));g.build(id(18,19),'road');g.build(id(18,21),'road');assert.equal(tollAxis(g.tiles,n),1);
 const saved=serialize(g);assert.ok(validateSave(saved));const restored=new Simulation(saved);assert.equal(tollAxis(restored.tiles,n),1);assert.deepEqual(restored.tolls.get(n),booth);
});
test('axis detection handles map edges, bends and main-road priority at crossings',()=>{
 const tiles=Array(B.layerOffset).fill('grass');tiles[id(0,0)]='road';tiles[id(0,1)]='road';tiles[id(54,0)]='road';assert.equal(tollAxis(tiles,id(0,0)),1);
 const n=id(15,15);tiles[n]='road';for(const [x,y]of [[14,15],[16,15]])tiles[id(x,y)]='road';for(const [x,y]of [[15,14],[15,16]])tiles[id(x,y)]='mainRoad';assert.equal(tollAxis(tiles,n),1);
 tiles[id(15,14)]='grass';tiles[id(15,16)]='grass';assert.equal(tollAxis(tiles,n),0);
 tiles[id(16,15)]='grass';tiles[id(15,16)]='road';assert.equal(tollAxis(tiles,n),0);
});
