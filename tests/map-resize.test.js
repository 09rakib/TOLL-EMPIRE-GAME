import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {B} from '../src/balance.js';
import {id} from '../src/world.js';
import {serialize,migrate,validateSave} from '../src/storage.js';
function oldCity(){
 const g=new Simulation();g.trees.clear();g.coins=100000;g.build(id(14,19),'home');g.upgradeBuilding(id(14,19));g.build(id(12,20),'toll');g.build(id(14,20),'bus-stop');g.build(id(22,20),'bus-stop');g.build(id(14,20),'uturn');g.build(id(22,20),'uturn');g.createTransitLine([id(14,20),id(22,20)]);g.build(id(40,40),'flowerbed');
 const d=structuredClone(serialize(g)),remap=n=>Math.floor(n/55)*64+n%55,tiles=Array(4096).fill('grass');for(let n=0;n<d.tiles.length;n++)tiles[remap(n)]=d.tiles[n];
 d.tiles=tiles;d.mapSize=64;d.tolls=d.tolls.map(([n,t])=>[remap(n),t]);d.uturns=d.uturns.map(remap);d.transit.stops=d.transit.stops.map(remap);d.transit.lines=d.transit.lines.map(l=>({...l,stops:l.stops.map(remap)}));d.decorations=d.decorations.map(d=>({...d,node:remap(d.node)}));return d;
}
test('64 to 55 migration remaps roads, tolls, transit and decorations while preserving city progress',()=>{
 const original=oldCity(),raw=JSON.stringify(original),d=migrate(original);assert.ok(validateSave(d));assert.equal(d.tiles.length,3025);assert.equal(B.size,55);assert.equal(d.coins,original.coins);assert.deepEqual(d.buildings,original.buildings);assert.equal(d.buildings[0].level,2);assert.ok(d.tolls.some(([n])=>n===id(12,20)));assert.deepEqual(d.transit.lines[0].stops,[id(14,20),id(22,20)]);assert.equal(d.decorations[0].node,id(40,40));assert.equal(JSON.stringify(d.mapArchive),raw);assert.equal(JSON.stringify(original),raw);
 const g=new Simulation(d);assert.ok(validateSave(serialize(g)));assert.equal(g.buildingAt(id(14,19)).level,2);assert.deepEqual(migrate(d),d);
});
test('outer and boundary-crossing properties remain recoverable in the original-city archive',()=>{
 const original=oldCity();original.buildings.push({x:54,y:40,width:2,height:1,kind:'garage-home',type:0,level:3,managed:true,investment:220});original.tiles[40*64+54]='building';original.tiles[40*64+55]='building';original.tiles[60*64+60]='road';
 const d=migrate(original);assert.ok(validateSave(d));assert.equal(d.tiles[id(54,40)],'grass');assert.equal(d.buildings.length,1);assert.equal(d.mapArchive.buildings.length,2);assert.equal(d.mapArchive.tiles[60*64+60],'road');assert.match(d.mapResizeNotice,/preserved/);
});
