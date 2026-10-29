import {legacyGame} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {PROJECTS,projectStatus} from '../src/projects.js';
import {xpThreshold} from '../src/campaign.js';
import {id} from '../src/world.js';
import {serialize,validateSave} from '../src/storage.js';
const city=()=>{const g=legacyGame(()=>.4);g.coins=50000;g.campaign.xp=xpThreshold(10);return g;};
function complete(g,n,kind){
  assert.equal(g.build(n,kind),null);g.campaign.trips+=PROJECTS[kind].trips;assert.equal(g.upgradeBuilding(n),null);
  if(PROJECTS[kind].metric==='managed'){for(const tile of [id(18,15),id(24,15),id(25,15),id(27,15),id(29,15)])if(!g.buildingAt(tile))g.build(tile,'home');}
  else{for(let x=7;x<=31;x++)g.build(id(x,16),'main');}
  g.served+=PROJECTS[kind].served;assert.equal(g.upgradeBuilding(n),null);
}
test('projects enforce levels, connected grass, uniqueness and foundation cost',()=>{
  const g=city(),n=id(15,15);g.campaign.xp=0;assert.ok(g.build(n,'hospital'));g.campaign.xp=xpThreshold(3);const coins=g.coins;
  assert.ok(g.build(id(0,0),'hospital'));assert.equal(g.build(n,'hospital'),null);assert.equal(g.coins,coins-720);assert.equal(g.metrics().managed,0);assert.equal(g.businessRate,0);assert.ok(g.build(id(18,15),'hospital'));
});
test('stages require fresh trips, real city development and fresh toll customers',()=>{
  const g=city(),n=id(15,15);g.build(n,'hospital');assert.ok(g.upgradeBuilding(n));g.campaign.trips+=80;assert.equal(projectStatus(g,g.buildingAt(n)).ready,true);assert.equal(g.upgradeBuilding(n),null);
  assert.ok(g.upgradeBuilding(n));g.served+=40;assert.ok(g.upgradeBuilding(n));for(const tile of [id(18,15),id(24,15),id(25,15)])g.build(tile,'home');assert.equal(g.upgradeBuilding(n),null);assert.equal(g.buildingAt(n).investment,2400);assert.equal(g.businessRate,20);assert.equal(g.projectEffects.repair,1);assert.ok(g.upgradeBuilding(n));
});
test('stadium bonus is active only when complete and connected',()=>{
  const g=city(),n=id(15,15);complete(g,n,'stadium');assert.equal(g.projectEffects.demand,.2);assert.equal(g.businessRate,80);
  for(const tile of g.neighbors(n))g.tiles[tile]='grass';g.rebuild();assert.equal(g.projectEffects.demand,0);assert.equal(g.businessRate,0);
});
test('transit hub improves booth service and driving after commissioning',()=>{
  const g=city(),n=id(15,15),capacity=g.boothCapacity(id(19,16));complete(g,n,'transit');assert.equal(g.projectEffects.capacity,.15);assert.ok(g.boothCapacity(id(19,16))>capacity);assert.equal(g.projectEffects.speed,.1);
});
test('project stage, objective baseline, paint and investments survive save/load',()=>{
  const g=city(),n=id(15,15);g.build(n,'hospital');g.campaign.trips+=35;g.paintBuilding(n,4);const saved=serialize(g);assert.ok(validateSave(saved));const loaded=new Simulation(saved,()=>.4);const b=loaded.buildingAt(n);assert.equal(b.projectStage,0);assert.equal(b.paint,4);assert.equal(projectStatus(loaded,b).requirements[0].value,35);
  const invalid=structuredClone(saved);invalid.buildings.find(b=>b.project).projectStage=7;assert.equal(validateSave(invalid),false);
});
test('undo commissioning removes bonuses without changing trip progress, and demolition refunds investment',()=>{
  const g=city(),n=id(15,15);complete(g,n,'hospital');const trips=g.campaign.trips;assert.equal(g.undo(),null);assert.equal(g.buildingAt(n).projectStage,1);assert.equal(g.businessRate,0);assert.equal(g.campaign.trips,trips);
  const before=g.coins,invested=g.buildingAt(n).investment;assert.equal(g.demolish(n),null);assert.equal(g.coins,before+Math.round(invested*.6));g.undo();assert.equal(g.buildingAt(n).project,'hospital');
});
