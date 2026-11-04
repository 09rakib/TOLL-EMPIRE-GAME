import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {constructionQuote} from '../src/construction.js';
test('construction quotes match actual cleared purchase and explain invalid sites',()=>{
 const g=new Simulation();g.coins=100000;const n=id(40,40),q=constructionQuote(g,n,'clinic');
 assert.ok(q.valid);assert.match(q.text,/Road needed/);const before=g.coins;
 assert.equal(g.buildBuilding(n,'clinic',{clearTrees:true}),null);assert.equal(before-g.coins,q.cost);
 assert.equal(constructionQuote(g,n,'clinic').valid,false);assert.match(constructionQuote(g,id(54,54),'clinic').text,/inside the city/);
 g.coins=0;assert.equal(constructionQuote(g,id(35,35),'parking').valid,false);
 assert.equal(constructionQuote(g,-1,'road').valid,false);
});
test('span quote uses the real planner cost and error',()=>{
 const g=new Simulation();g.trees.clear();g.coins=100000;const start=id(12,20),end=id(17,20),q=constructionQuote(g,end,'flyover',{start});
 assert.equal(q.cost,g.planSpan(start,end,'flyover').cost);assert.ok(q.valid);
 const before=g.coins;g.buildSpan(start,end,'flyover');assert.equal(before-g.coins,q.cost);
 assert.match(constructionQuote(g,id(30,30),'bridge',{start}).text,/bridge|water|bank|river|road/i);
});
