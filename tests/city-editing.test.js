import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {plotCells} from '../src/plots.js';
import {parkingCell,parkingRoads} from '../src/offices.js';
import {serialize,validateSave} from '../src/storage.js';
const city=()=>{const g=new Simulation();g.trees.clear();g.coins=100000;g.cars=[];g.walkers=[];return g;};
test('move preserves upgrades paint and later income through undo and rejects occupied destinations',()=>{
 const g=city(),from=id(12,19),to=id(14,19);g.build(from,'home');g.upgradeBuilding(from);g.paintBuilding(from,3);const b=g.buildingAt(from);b.visitors=9;b.revenue=40;
 assert.equal(g.moveBuilding(from,to),null);assert.equal(g.buildingAt(to),b);assert.equal(g.tiles[from],'grass');assert.equal(b.level,2);assert.equal(b.paint,3);
 b.visitors+=2;b.revenue+=10;g.coins+=10;const coins=g.coins;assert.equal(g.undo(),null);const old=g.buildingAt(from);assert.equal(old.visitors,11);assert.equal(old.revenue,50);assert.equal(g.coins,coins+50);
 const before=g.coins;assert.ok(g.moveBuilding(from,id(15,20)));assert.equal(g.coins,before);assert.equal(g.buildingAt(from),old);assert.ok(validateSave(serialize(g)));
});
test('active approach and pedestrian visits prevent move or rotation without charging',()=>{
 const g=city(),n=id(12,19);g.build(n,'home');const before=g.coins;g.cars=[{targetBuilding:n}];assert.match(g.moveBuilding(n,id(14,19)),/Wait/);assert.match(g.rotateBuilding(n),/Wait/);assert.equal(g.coins,before);
 g.cars=[];g.walkers=[{park:n}];assert.match(g.rotateBuilding(n),/Wait/);
});
test('garage homes rotate the real footprint and parking entrance, survive saves and four rotations',()=>{
 const g=city(),n=id(12,21);g.build(n,'garage-home');const original=plotCells(g.buildingAt(n));
 // Connected roads on all four sides keep each real driveway open.
 for(const [x,y]of [[11,21],[11,22],[12,23],[13,23],[14,22],[14,21],[13,22]])if(g.tiles[id(x,y)]==='grass')g.build(id(x,y),'road');
 for(let r=1;r<=4;r++){assert.equal(g.rotateBuilding(n),null);const b=g.buildingAt(n),p=parkingCell(b);assert.equal(b.rotation,r%4);assert.equal(plotCells(b).length,2);assert.ok(parkingRoads(b).some(a=>g.cityConnected.has(a)));assert.ok(plotCells(b).includes(id(p.x,p.y)));assert.ok(validateSave(serialize(g)));}
 assert.deepEqual(plotCells(g.buildingAt(n)),original);
});
test('decorations protect occupied plots, refund once, undo and persist without passive income',()=>{
 for(const kind of ['bench','flowerbed','fountain']){const g=city(),n=id(40,40),before=g.coins;assert.equal(g.build(n,kind),null);assert.ok(g.build(n,'road'));assert.ok(validateSave(serialize(g)));const value=g.decorations[0].investment;assert.equal(g.demolish(n),null);assert.equal(g.coins,before-value+Math.round(value*.6));g.undo();assert.equal(g.decorations[0].kind,kind);assert.equal(g.tiles[n],'decoration');assert.ok(validateSave(serialize(g)));}
});
test('undo relocation waits for current visitors and restores their later ledger once clear',()=>{
 const g=city(),from=id(12,19),to=id(14,19);g.build(from,'home');g.moveBuilding(from,to);g.cars=[{targetBuilding:to}];const before=g.coins;assert.match(g.undo(),/Wait/);assert.equal(g.coins,before);assert.ok(g.buildingAt(to));g.cars=[];g.buildingAt(to).visitors=15;assert.equal(g.undo(),null);assert.equal(g.buildingAt(from).visitors,15);
});
