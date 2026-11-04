// Reproduce a long residential cul-de-sac beyond the original city gate.
import {Simulation} from '../src/simulation.js';
import {B} from '../src/balance.js';
import {id} from '../src/world.js';
let seed=9127;const g=new Simulation(null,()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;});
g.trees.clear();g.coins=1e6;g.upgrades.traffic=5;g.setPolicy('tourism');
for(let x=7;x<=43;x++)g.build(id(x,20),'main');
for(let x=34;x<=41;x++)for(const y of [19,21]){g.build(id(x,y),'home');g.upgradeBuilding(id(x,y));g.upgradeBuilding(id(x,y));}
g.build(id(12,21),'shop');g.build(id(16,21),'office');g.build(id(22,21),'clinic');
const legacyReturn=process.argv.includes('--legacy-return');
if(legacyReturn)g.parkingExitRoute=(car,entry)=>g.route(entry,g.graph.has(car.origin)?car.origin:g.endpoints.find(n=>n!==entry),car.vot);
const minutes=Number(process.argv.find(a=>a.startsWith('--minutes='))?.split('=')[1]||30);if(!Number.isFinite(minutes)||minutes<10||minutes>120)throw Error('Choose 10-120 minutes');
const ticks=Math.round(minutes*60/B.fixedStep),positions=new WeakMap();let peak=0,maxStalled=0,previousTrips=0;
for(let i=0;i<ticks;i++){
 g.update(B.fixedStep);peak=Math.max(peak,g.cars.length);let stalled=0;
 for(const c of g.cars){const last=positions.get(c);if(!last||c.age<last.age||Math.hypot(c.worldX-last.x,c.worldY-last.y)>.05)positions.set(c,{x:c.worldX,y:c.worldY,time:g.time,age:c.age});
  if((!c.parkingPhase||['waiting','leaving'].includes(c.parkingPhase))&&g.time-positions.get(c).time>30)stalled++;}
 maxStalled=Math.max(maxStalled,stalled);if(i===ticks-18000)previousTrips=g.campaign.trips;
}
const report={legacyReturn,minutes,homes:16,peakCars:peak,finalCars:g.cars.length,maxCarsStationaryOver30Seconds:maxStalled,completedTrips:g.campaign.trips,finalTenMinuteTrips:g.campaign.trips-previousTrips,businessVisitors:g.buildings.reduce((s,b)=>s+(b.visitors||0),0),earnedCoins:Math.floor(g.earned),stranded:g.cars.filter(c=>c.stranded).length};console.log(JSON.stringify(report,null,2));
if(maxStalled||report.stranded||report.finalTenMinuteTrips<10||!report.businessVisitors)process.exitCode=1;
