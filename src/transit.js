import {B} from './balance.js';
import {isRoad} from './world.js';
export const STOP_PRICE=100,LINE_PRICE=350;
export const emptyTransit=()=>({stops:[],lines:[],nextId:1,passengers:0});
export function transitValid(t){return !!t&&Array.isArray(t.stops)&&t.stops.length<=24&&new Set(t.stops).size===t.stops.length&&t.stops.every(n=>Number.isInteger(n)&&n>=0&&n<B.layerOffset)&&Array.isArray(t.lines)&&t.lines.length<=4&&Number.isInteger(t.nextId)&&t.nextId>0&&Number.isFinite(t.passengers)&&t.passengers>=0&&t.lines.every(l=>l&&typeof l==='object')&&new Set(t.lines.map(l=>l.id)).size===t.lines.length&&t.lines.every(l=>Number.isInteger(l.id)&&l.id>0&&l.id<t.nextId&&typeof l.paused==='boolean'&&Array.isArray(l.stops)&&l.stops.length>=2&&l.stops.length<=8&&new Set(l.stops).size===l.stops.length&&l.stops.every(n=>t.stops.includes(n)));}
export const transitMethods={
 validateStop(n){if(this.mode!=='planner')return 'Bus services are available in Planner cities.';if(!isRoad(this.tiles[n])||!this.cityConnected.has(n))return 'Place the stop on a city-connected ground road.';if(this.transit.stops.includes(n))return 'There is already a bus stop here.';if(this.transit.stops.length>=24)return 'The city supports up to 24 bus stops.';if(this.coins<STOP_PRICE)return 'A bus stop costs 100 coins.';return null;},
 buildStop(n){const error=this.validateStop(n);if(error)return error;const before=this.actionSnapshot();this.coins-=STOP_PRICE;this.transit.stops.push(n);this.record(before);this.rebuild();return null;},
 removeStop(n){if(!this.transit.stops.includes(n))return 'Choose a bus stop.';if(this.transit.lines.some(l=>l.stops.includes(n)))return 'Remove routes using this stop first.';const before=this.actionSnapshot();this.transit.stops=this.transit.stops.filter(s=>s!==n);this.coins+=60;this.record(before);this.rebuild();return null;},
 planTransit(stops){
   if(!Array.isArray(stops)||stops.length<2||stops.length>8||new Set(stops).size!==stops.length||stops.some(n=>!this.transit.stops.includes(n)||!isRoad(this.tiles[n])||!this.cityConnected.has(n)))return 'Choose 2-8 different connected bus stops in travel order.';
   let heading=null;for(let i=0;i<stops.length*2;i++){const a=stops[i%stops.length],b=stops[(i+1)%stops.length],route=this.route(a,b,.5,heading);if(!route||route.length<2)return 'No legal round trip. Add U-turn points at end stops or build a road loop.';let j=route.length-2;while(j>=0&&route[j]%B.layerOffset===b)j--;if(j>=0){const from=route[j]%B.layerOffset,dx=b%B.size-from%B.size,dy=Math.floor(b/B.size)-Math.floor(from/B.size);heading=dx>0?0:dy>0?1:dx<0?2:3;}}
   return null;
 },
 createTransitLine(stops){const error=this.planTransit(stops);if(error)return error;if(this.transit.lines.length>=4)return 'The city supports four routes.';if(this.coins<LINE_PRICE)return 'A route and its bus cost 350 coins.';const before=this.actionSnapshot();this.coins-=LINE_PRICE;this.transit.lines.push({id:this.transit.nextId++,stops:[...stops],paused:false});this.record(before);this.rebuild();return null;},
 removeTransitLine(key){const line=this.transit.lines.find(l=>l.id===key);if(!line)return 'Route not found.';const before=this.actionSnapshot();this.transit.lines=this.transit.lines.filter(l=>l!==line);this.coins+=210;this.record(before);this.rebuild();return null;},
 transitDemandAt(n){
   const seen=new Set([n]),q=[[n,0]];for(let i=0;i<q.length;i++){const [node,d]=q[i];if(d>=8)continue;for(const next of this.graph.get(node)||[])if(!seen.has(next)){seen.add(next);q.push([next,d+1]);}}
   let demand=0;for(const b of this.buildings)if(b.managed&&[0,1,2,4,5].includes(b.type)&&!['police','university','school'].includes(b.kind)&&seen.has(this.buildingEntrance(b)))demand+=(b.level||1);return Math.min(6,demand);
 },
 transitRelief(){this.transitArrivals??=[];while(this.transitArrivals.length&&this.transitArrivals[0].time<this.time-60)this.transitArrivals.shift();return Math.min(.2,this.transitArrivals.reduce((s,e)=>s+e.count,0)*.01);},
 updateTransit(){
   if(this.mode!=='planner')return;this.transitClock=(this.transitClock||0)+B.fixedStep;if(this.transitClock<1)return;this.transitClock=0;
   for(const line of this.transit.lines){if(line.paused||this.cars.some(c=>c.transitId===line.id)||this.cars.length>=(this.settings.lowPower?B.lowPowerCars:B.maxCars)||this.planTransit(line.stops))continue;
     if(this.addPlannerCar(line.stops[0],line.stops[1],null,'bus')){const car=this.cars.at(-1);car.transitId=line.id;car.transitNext=1;car.transitDwellUntil=null;car.transitRiders=Math.min(this.transitDemandAt(line.stops[0]),this.transitDemandAt(line.stops[1]));car.color='#3a9dab';}
   }
 },
 advanceTransitStop(car,dt){
   const line=this.transit.lines.find(l=>l.id===car.transitId),current=car.route[car.index];car.age+=dt;
   if(!line){car.transitId=null;car.transitRiders=0;if(!this.continueToExit(car))car.stranded=true;return;}
   if(current!==line.stops[car.transitNext]||!this.cityConnected.has(current)||!isRoad(this.tiles[current]))return;
   if(car.transitDwellUntil===null){const count=car.transitRiders||0;this.transit.passengers+=count;this.transitArrivals??=[];if(count)this.transitArrivals.push({time:this.time,count});car.transitRiders=0;car.transitDwellUntil=this.time+4;}
   if(line.paused||this.time<car.transitDwellUntil||!this.cityConnected.has(current)||!isRoad(this.tiles[current]))return;
   const next=(car.transitNext+1)%line.stops.length,destination=line.stops[next];if(!this.cityConnected.has(destination)||!isRoad(this.tiles[destination]))return;
   const route=this.route(current,destination,.5,car.heading);if(!route||route.length<2)return;
   car.transitRiders=Math.min(this.transitDemandAt(current),this.transitDemandAt(destination));car.transitNext=next;car.transitDwellUntil=null;car.route=route;car.index=0;car.progress=0;car.destination=destination;car.revision=this.revision;car.exiting=false;car.stranded=false;
 },
};
