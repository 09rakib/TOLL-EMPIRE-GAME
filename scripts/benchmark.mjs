import {Simulation} from '../src/simulation.js';
import {B} from '../src/balance.js';
import {id} from '../src/world.js';
let seed=7341;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const game=new Simulation(null,random);game.coins=100000;
game.upgrades.traffic=5;game.upgrades.faster=3;game.setPolicy('tourism');
for(let x=7;x<=31;x++)game.build(id(x,20),'main');
game.build(id(19,20),'toll');game.build(id(16,19),'road');game.build(id(16,21),'road');game.build(id(16,20),'signal');
for(const x of [10,14,18,22,26]){game.build(id(x,19),'home');game.upgradeBuilding(id(x,19));game.upgradeBuilding(id(x,19));}
game.build(id(12,21),'office');game.build(id(20,21),'clinic');game.build(id(28,21),'hotel');
const ticks=36000,start=performance.now();let maxCars=0;
for(let i=0;i<ticks;i++){game.update(B.fixedStep);maxCars=Math.max(maxCars,game.cars.length);}
const elapsed=performance.now()-start;
console.log(JSON.stringify({simulatedMinutes:20,cpuMilliseconds:Math.round(elapsed),millisecondsPerTick:+(elapsed/ticks).toFixed(3),peakCars:maxCars,completedTrips:game.campaign.trips,tollCustomers:game.served,businessVisitors:game.buildings.reduce((s,b)=>s+(b.visitors||0),0),earnedCoins:Math.floor(game.earned),routeCacheEntries:game.routeCache.size},null,2));
if(!game.campaign.trips||!game.served||maxCars>B.maxCars||!game.cars.every(c=>Number.isFinite(c.progress)))process.exit(1);
