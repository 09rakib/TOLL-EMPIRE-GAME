import {capacityFor} from './traffic.js';
const clamp=n=>Math.max(0,Math.min(100,n));
function distances(g,sites){const d=new Map(),q=[];for(const b of sites){const n=g.buildingEntrance(b),seed=-3*((b.level||1)-1);if(n!==null&&(d.get(n)??Infinity)>seed){d.set(n,seed);q.push(n);}}for(let i=0;i<q.length;i++)for(const n of g.graph.get(q[i])||[]){const next=d.get(q[i])+1;if(next<(d.get(n)??Infinity)){d.set(n,next);q.push(n);}}return d;}
export function citySatisfaction(g){
 const homes=g.buildings.filter(b=>b.managed&&b.type===0),population=homes.reduce((s,b)=>s+20*(b.level||1),0),services=kind=>g.buildings.filter(b=>b.managed&&(kind==='clinic'?b.type===4:b.kind===kind));
 const access=(kind,range)=>{const sites=services(kind),d=distances(g,sites);if(!homes.length)return 70;return homes.reduce((s,b)=>{const entrance=g.buildingEntrance(b),distance=entrance===null?Infinity:d.get(entrance)??Infinity;return s+clamp(100-distance*100/range)*(b.level||1)*20;},0)/population;};
 let load=0,vehicles=0;for(const [n,count]of g.density){const ratio=count/capacityFor(g.tiles[n],g.signals.has(n));load+=clamp((ratio-.45)*65)*count;vehicles+=count;}
 const traffic=clamp(100-(vehicles?load/vehicles:0)),prices=[...g.tolls.values()].map(t=>t.price),averageToll=prices.length?prices.reduce((a,b)=>a+b,0)/prices.length:0,tolls=clamp(100-averageToll*2.5);
 const health=access('clinic',32),safety=access('police',38),education=access('university',48),parks=access('park',30);
 const factors=[{name:'Traffic flow',score:traffic,weight:.25,tip:'Relieve crowded roads with alternate routes, main roads and flyovers.'},{name:'Toll affordability',score:tolls,weight:.2,tip:'Lower toll rates. Current average: $'+averageToll.toFixed(1)+'.'},{name:'Hospital access',score:health,weight:.3,tip:'Place connected hospitals closer to residential streets.'},{name:'Safety',score:safety,weight:.12,tip:'Connect police stations near homes.'},{name:'Green space',score:parks,weight:.08,tip:'Add road-connected parks near residents.'},{name:'Education',score:education,weight:.05,tip:'Connect a university to the city road network.'}];
 const score=homes.length?Math.round(factors.reduce((s,f)=>s+f.score*f.weight,0)):70;return {score,population,label:score>=80?'Thriving':score>=60?'Content':score>=40?'Concerned':'Unhappy',factors:factors.map(f=>({...f,score:Math.round(f.score)})),mayor:true};
}
