// Dense narrow city with 115 home levels, private visitors, a toll and a flyover.
// No player save or browser profile is accessed.
import {Simulation} from '../src/simulation.js';
import {B} from '../src/balance.js';
import {id} from '../src/world.js';
let seed=7341;const g=new Simulation(null,()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;});
g.trees.clear();g.coins=1e7;g.upgrades.traffic=5;g.setPolicy('tourism');
for(let x=7;x<=31;x++)g.build(id(x,20),'main');
for(let x=8;x<=30;x++){g.build(id(x,19),'home');for(let i=0;i<4;i++)g.upgradeBuilding(id(x,19));}
for(const x of [10,14,18])g.build(id(x,21),'shop');g.build(id(23,21),'clinic');
g.build(id(20,20),'toll');g.buildSpan(id(12,20),id(25,20),'flyover');
const minutes=Number(process.argv.find(a=>a.startsWith('--minutes='))?.split('=')[1]||30);if(!Number.isFinite(minutes)||minutes<10||minutes>180)throw Error('Choose 10-180 minutes');
const still=new WeakMap(),ticks=Math.round(minutes*60/B.fixedStep);let peakCars=0,roadTotal=0,lastTenTrips=0,maxStopped=0;
for(let i=0;i<ticks;i++){
 g.update(B.fixedStep);peakCars=Math.max(peakCars,g.cars.length);let onRoad=0,stopped=0;
 for(const c of g.cars){const previous=still.get(c);if(!previous||c.age<previous.age||Math.hypot(previous.x-c.worldX,previous.y-c.worldY)>.05)still.set(c,{x:c.worldX,y:c.worldY,time:g.time,age:c.age});
  if(!c.parkingPhase||c.parkingPhase==='waiting'){onRoad++;if(g.time-still.get(c).time>30)stopped++;}}
 roadTotal+=onRoad;maxStopped=Math.max(maxStopped,stopped);
 if(i===ticks-18000)lastTenTrips=g.campaign.trips;
}
const result={simulatedMinutes:minutes,peakCars,finalCars:g.cars.length,meanRoadCars:+(roadTotal/ticks).toFixed(1),trafficBudget:g.trafficBudget(),completedTrips:g.campaign.trips,finalTenMinuteTrips:g.campaign.trips-lastTenTrips,tollCustomers:g.served,businessVisitors:g.buildings.reduce((s,b)=>s+(b.visitors||0),0),earnedCoins:Math.floor(g.earned),maxRoadCarsStationaryOver30Seconds:maxStopped};
console.log(JSON.stringify(result,null,2));
if(peakCars>g.trafficBudget()||maxStopped||result.finalTenMinuteTrips<10||!g.served||!result.businessVisitors||!g.cars.every(c=>Number.isFinite(c.progress)))process.exitCode=1;
