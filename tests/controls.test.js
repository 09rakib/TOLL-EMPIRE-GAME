import {legacyGame} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {traceTiles} from '../src/brush.js';
import {Simulation} from '../src/simulation.js';
import {id} from '../src/world.js';
import {updateTutorial} from '../src/tutorial.js';
import {serialize} from '../src/storage.js';

test('sparse pointer samples produce contiguous four-connected road traces',()=>{
  for(const [a,b] of [[id(2,2),id(9,2)],[id(9,9),id(2,2)],[id(39,0),id(0,1)],[id(10,20),id(10,5)]]){
    const path=traceTiles(a,b);assert.equal(path[0],a);assert.equal(path.at(-1),b);
    for(let i=1;i<path.length;i++){const x1=path[i-1]%40,y1=Math.floor(path[i-1]/40),x2=path[i]%40,y2=Math.floor(path[i]/40);assert.equal(Math.abs(x1-x2)+Math.abs(y1-y2),1);}
    assert.equal(new Set(path).size,path.length);
  }
  assert.deepEqual(traceTiles(-1,2),[]);assert.deepEqual(traceTiles(1600,2),[]);
});
test('a drag builds all sampled road tiles and one undo restores the complete stroke',()=>{
  const g=legacyGame(()=>.4),before=g.coins,tiles=traceTiles(id(15,15),id(15,11));g.beginStroke('road');
  for(const n of tiles)assert.equal(g.build(n,'road'),null);
  const result=g.endStroke();assert.equal(result.actions,5);assert.equal(g.undoStack.length,1);assert.equal(g.coins,before-125);
  assert.equal(g.undo(),null);assert.equal(g.coins,before);assert.ok(tiles.every(n=>g.tiles[n]==='grass'));
});
test('grouped undo preserves income earned between pointer events',()=>{
  const g=legacyGame(()=>.4),before=g.coins;g.beginStroke('main');g.build(id(18,16),'main');g.coins+=70;g.build(id(19,16),'main');g.endStroke();
  assert.equal(g.undoStack.length,1);g.undo();assert.equal(g.coins,before+70);assert.equal(g.tiles[id(18,16)],'road');assert.equal(g.tiles[id(19,16)],'road');
});
test('failed brush placement does not charge coins or create an undo action',()=>{
  const g=legacyGame(()=>.4);g.beginStroke('road');assert.ok(g.build(id(0,0),'road'));assert.equal(g.endStroke().actions,0);assert.equal(g.undoStack.length,0);assert.equal(g.coins,1000);
});
test('tutorial follows real actions, persists progress and finishes at the city board',()=>{
  const g=legacyGame(()=>.4);updateTutorial(g);assert.equal(g.campaign.tutorial.step,0);
  g.build(id(15,15),'road');updateTutorial(g);assert.equal(g.campaign.tutorial.step,1);
  g.build(id(19,16),'toll');updateTutorial(g);assert.equal(g.campaign.tutorial.step,2);
  const loaded=new Simulation(serialize(g),()=>.4);assert.equal(loaded.campaign.tutorial.step,2);
  loaded.build(id(18,15),'home');updateTutorial(loaded);assert.equal(loaded.campaign.tutorial.step,3);
  loaded.campaign.tutorial.boardOpened=true;updateTutorial(loaded);assert.equal(loaded.campaign.tutorial.done,true);
});
test('existing saves without tutorial metadata keep their city and skip automatic onboarding',()=>{
  const g=legacyGame(()=>.4),saved=serialize(g);delete saved.campaign.tutorial;
  const loaded=new Simulation(saved,()=>.4);assert.equal(loaded.campaign.tutorial.done,true);assert.equal(loaded.coins,g.coins);
});
