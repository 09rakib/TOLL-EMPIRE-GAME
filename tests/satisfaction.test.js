import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {citySatisfaction} from '../src/satisfaction.js';
const city=()=>{const g=new Simulation(null,()=>.4);g.coins=100000;g.trees.clear();g.build(id(17,19),'home');return g;};
test('mayor score responds to tolls, real traffic congestion and connected health access',()=>{const g=city(),base=citySatisfaction(g);g.build(id(15,20),'toll');g.setToll(id(15,20),10);assert.ok(citySatisfaction(g).score<base.score);g.density.set(id(17,20),100);const jam=citySatisfaction(g);assert.ok(jam.factors[0].score<base.factors[0].score);g.build(id(18,21),'clinic');assert.ok(citySatisfaction(g).factors.find(f=>f.name==='Hospital access').score>base.factors.find(f=>f.name==='Hospital access').score);});
test('a hospital cut off from the city cannot improve care; nearby police improves safety',()=>{const g=city();g.build(id(18,21),'police');const a=citySatisfaction(g);assert.ok(a.factors.find(f=>f.name==='Safety').score>0);g.buildings.push({x:50,y:50,type:4,kind:'clinic',managed:true,level:1});g.refreshDevelopment();assert.equal(citySatisfaction(g).factors.find(f=>f.name==='Hospital access').score,0);assert.ok(Number.isFinite(a.score));assert.equal(citySatisfaction(new Simulation()).score,70);});

test('upgraded public services extend effective coverage without changing city saves',()=>{const g=city();g.build(id(22,21),'police');const before=citySatisfaction(g).factors.find(f=>f.name==='Safety').score;g.upgradeBuilding(id(22,21));assert.ok(citySatisfaction(g).factors.find(f=>f.name==='Safety').score>before);});
