import {B} from './balance.js';
import {createCity,graphFrom,id,isRoad,point} from './world.js';
import {findRoute,valueOfTime} from './pathfinder.js';
import {capacityFor,speedFactor,congestion,roadName} from './traffic.js';
import {StatsTracker} from './stats.js';
import {createCampaign,createSettings,ensureContracts,POLICIES,levelForXp} from './campaign.js';
import {growthMethods,BUILDINGS} from './growth.js';
import {PROJECTS,projectMethods} from './projects.js';
import {plannerMethods} from './planner.js';
import {forestFor,forestMethods} from './forest.js';
import {plotCells} from './plots.js';
import {pedestrianMethods} from './pedestrians.js';
import {officeMethods} from './offices.js';
export const upgradeTypes={
  faster:{name:'Faster Cars',description:'+10% driving speed per level',icon:'road'},
  booths:{name:'Bigger Toll Booths',description:'+15% service capacity per level',icon:'toll'},
  traffic:{name:'More Traffic',description:'+15% city traffic demand per level',icon:'car'},
  repair:{name:'Auto Repair Roads',description:'Reduces congestion slowdown by 10% per level',icon:'repair'},
  offline:{name:'Offline Income Boost',description:'+10% offline efficiency per level, up to 8 hours',icon:'clock'},
};
export class Simulation {
  constructor(saved=null,random=Math.random) {
    const city=saved||createCity();
    this.mode=saved?(saved.worldMode||'legacy'):'planner';
    this.riverLayout=city.riverLayout||0;
    this.tiles=[...city.tiles];this.buildings=structuredClone(city.buildings);this.coins=saved?.coins??B.startCoins;
    this.trees=new Set(saved?.trees??(this.mode==='planner'?forestFor(this.tiles):[]));
    this.walkers=[];this.walkClock=0;
    this.tolls=new Map((saved?.tolls||[]).map(([n,t])=>[n,{...t,level:t.level||1}]));
    if(this.mode==='planner')for(const toll of this.tolls.values())toll.price=Math.min(toll.price,this.tollLimit(toll));
    this.flyovers=structuredClone(saved?.flyovers||[]);this.signals=new Set(saved?.signals||[]);
    this.bridges=structuredClone(saved?.bridges||[]);this.upgrades={faster:0,booths:0,traffic:0,repair:0,offline:0,...saved?.upgrades};
    this.graph=graphFrom(this.tiles,this.flyovers);
    this.walkTopology=0;this.walkTopologySignature=[...this.graph.keys()].filter(n=>n<B.layerOffset).join(',');
    this.random=random;this.cars=[];this.pool=[];this.earned=saved?.earned||0;this.served=saved?.served||0;
    this.campaign=createCampaign(saved?.campaign,this.earned);this.settings=createSettings(saved?.settings);
    if(saved&&!saved.campaign?.tutorial)this.campaign.tutorial={step:0,done:true};
    this.time=saved?.simulationTime||0;this.spawnClock=0;this.paused=false;this.revision=0;this.undoStack=[];this.routeCache=new Map();
    this.tracker=new StatsTracker();this.businessTracker=new StatsTracker();this.admissionNext=new Map();this.visitEffects=[];this.density=new Map();this.serviceNext=new Map();this.replanClock=0;this.alternativeCache=new Map();
    this.travelTime=(from,to)=>{
      if(from%B.layerOffset===to%B.layerOffset&&from!==to)return B.tileTravelTime*.4;
      return B.tileTravelTime/Math.max(.04,this.speedAt(to))+this.queueLength(to)*60/this.boothCapacity(to)+(this.signals.has(to)?B.signalCycle/4:0);
    };
    this.endpoints=this.mode==='planner'?[id(7,20),id(31,20)]:[id(7,16),id(31,16),id(10,7),id(28,7),id(10,29),id(28,29)];
    this.refreshDevelopment();ensureContracts(this);
    const elapsed=saved?.lastSaved?Math.max(0,(Date.now()-saved.lastSaved)/1000):0;
    if(elapsed>=B.offlineMinimumSeconds&&Number.isFinite(saved?.incomePerMinute))this.campaign.pendingOffline+=Math.floor(Math.min(elapsed,B.maxOfflineSeconds)/60*saved.incomePerMinute*Math.min(1,B.offlineEfficiency+this.upgrades.offline*.1));
    this.colors=['#f2bd44','#e98674','#e8f1e8','#5fb9b4','#92aacd','#bd90a5'];
    this.warming=true;
    if(this.mode==='planner'){for(let i=0;i<2;i++){this.addPlannerCar(this.endpoints[i],this.endpoints[1-i],null,i?'car':'bus');const car=this.cars.at(-1);if(car){car.index=Math.min(car.route.length-2,Math.floor(car.route.length/2)-2);car.progress=.25;}}}
    else{for(let i=0;i<32;i++){this.spawn();for(const c of this.cars)this.advance(c,.25);}}
    this.warming=false;
    for(const car of this.cars){this.syncCarPosition(car);car.prevX=car.worldX;car.prevY=car.worldY;}
    if(this.mode==='planner')for(let i=0;i<4;i++){this.spawnWalker(true);const w=this.walkers.at(-1);if(w){w.index=Math.floor(w.path.length*(.4+i*.045));const p=w.path[w.index];w.x=p[0];w.y=p[1];}}
  }
  get cityLevel(){return levelForXp(this.campaign.xp);}
  get totalIncome(){return this.mode==='planner'?this.income+this.businessTracker.income:this.income+this.businessRate*POLICIES[this.settings.policy].revenue;}
  route(a,b,vot){
    const key=`${a}:${b}:${Math.round(vot*40)}:${this.revision}:${Math.floor(this.time/B.routeCacheSeconds)}`;
    if(this.routeCache.has(key))return this.routeCache.get(key);
    const route=findRoute(this.graph,a,b,vot,this.tolls,this.travelTime);
    if(this.routeCache.size>=B.routeCacheLimit)this.routeCache.clear();this.routeCache.set(key,route);return route;
  }
  spawn() {
    if(this.mode==='planner')return this.spawnPlanner();
    if(this.cars.length>=(this.settings.lowPower?B.lowPowerCars:B.maxCars))return;
    let a,b;
    if(this.destinations.length&&this.random()<.4){a=this.endpoints[Math.floor(this.random()*this.endpoints.length)];b=this.destinations[Math.floor(this.random()*this.destinations.length)];if(this.random()<.5)[a,b]=[b,a];}
    else if(this.random()<.76){a=id(7,16);b=id(31,16);if(this.random()<.5)[a,b]=[b,a];}
    else{a=this.endpoints[Math.floor(this.random()*this.endpoints.length)];b=this.endpoints[Math.floor(this.random()*this.endpoints.length)];}
    if(a===b)return;
    const vot=valueOfTime(this.random()),route=this.route(a,b,vot);
    if(!route||route.length<2)return;
    if(this.cars.some(c=>c.route[c.index]===a&&c.progress<.8))return;
    const car=this.pool.pop()||{};
    Object.assign(car,{route,index:0,progress:0,vot,color:this.colors[Math.floor(this.random()*this.colors.length)],destination:b,revision:this.revision,age:0,edgeAge:0,waitingNode:null,serviceAt:0,done:false});
    this.syncCarPosition(car);car.prevX=car.worldX;car.prevY=car.worldY;
    this.cars.push(car);
  }
  boothCapacity(n){const t=this.tolls.get(n);return (t?B.boothCapacities[t.level-1]:B.boothCapacities[0])*(1+this.upgrades.booths*B.boothBoostPerLevel)*(1+(this.projectEffects?.capacity||0));}
  queueLength(n){let count=0;for(const c of this.cars)if(c.waitingNode===n)count++;return count;}
  speedAt(n){
    const elevated=n>=B.layerOffset,type=this.tiles[n],capacity=capacityFor(type,this.signals.has(n));
    const free=(elevated?B.flyoverSpeed:type==='mainRoad'?B.mainSpeed:1)*(1+this.upgrades.faster*B.fasterBoostPerLevel);
    const event=this.campaign.event?.status==='active'?this.eventSpec():null;
    return free*(1+(this.projectEffects?.speed||0))*POLICIES[this.settings.policy].speed*(event?.speed||1)*speedFactor(this.density.get(n)||0,capacity,this.upgrades.repair+Math.min(2,this.parkLevels*.1)+(this.projectEffects?.repair||0));
  }
  congestionAt(n){return congestion((this.density.get(n)||0)/capacityFor(this.tiles[n],this.signals.has(n)));}
  signalAllows(from,to){
    if(!this.signals.has(to))return true;
    const a=point(from),b=point(to),horizontal=a.x!==b.x;
    return (Math.floor(this.time/(B.signalCycle/2))%2===0)===horizontal;
  }
  advance(car,dt){
    if(car.done)return;
    const current=car.route[car.index],next=car.route[car.index+1];
    if(next===undefined){if(this.mode==='planner'&&!this.warming){if(car.targetBuilding!==null&&car.targetBuilding!==undefined&&this.beginOfficeParking(car))return;car.progress+=dt*B.carTilesPerSecond;car.age+=dt;if(car.progress<1)return;this.campaign.trips++;this.campaign.xp+=B.xpPerTrip;this.settleVisit(car);}car.done=true;return;}
    car.age+=dt;car.edgeAge=(car.edgeAge||0)+dt;
    if(car.waitingNode!==null&&car.waitingNode!==undefined){
      if(!this.tolls.has(car.waitingNode)){car.waitingNode=null;}
      else if(this.time<car.serviceAt)return;
    }else{
      car.progress+=dt*B.carTilesPerSecond*this.speedAt(current);
      if(car.progress<1)return;
      if(!this.signalAllows(current,next)){car.progress=.99;return;}
      if(this.tolls.has(next)&&!this.warming){
        const ready=Math.max(this.time,this.serviceNext.get(next)||0);
        this.serviceNext.set(next,ready+60/this.boothCapacity(next));
        if(ready>this.time){car.waitingNode=next;car.serviceAt=ready;car.progress=.99;return;}
      }
    }
    car.waitingNode=null;car.progress=Math.max(0,car.progress-1);car.index++;
    const node=car.route[car.index];
    if(!this.warming)this.tracker.passage(this.time,node,car.edgeAge*B.tileTravelTime*B.carTilesPerSecond);car.edgeAge=0;
    const booth=this.tolls.get(node);
    if(booth&&!this.warming){const receipt=booth.price;this.coins+=receipt;this.earned+=receipt;this.campaign.xp+=receipt*B.xpPerCoin;this.served++;this.tracker.payment(this.time,node,receipt);}
    if(car.index>=car.route.length-1){if(this.mode==='planner'&&!this.warming){car.progress=0;return;}car.done=true;if(!this.warming){this.campaign.trips++;this.campaign.xp+=B.xpPerTrip;}return;}
    if(car.revision!==this.revision){
      const route=this.route(node,car.destination,car.vot);
      if(!route){car.done=true;return;}car.route=route;car.index=0;car.revision=this.revision;
    }
  }
  update(dt){
    if(this.paused)return;
    this.time+=dt;this.spawnClock+=dt;this.replanClock+=dt;
    this.density.clear();for(const c of this.cars){if(c.parkingPhase&&c.parkingPhase!=='waiting')continue;const n=c.waitingNode??c.route[c.index];this.density.set(n,(this.density.get(n)||0)+1);}
    const event=this.campaign.event?.status==='active'?this.eventSpec():null;
    const interval=this.mode==='planner'?this.plannerInterval()/(event?.demand||1):B.spawnInterval/((1+this.upgrades.traffic*B.trafficBoostPerLevel)*this.demandBonus*POLICIES[this.settings.policy].demand*(event?.demand||1));
    if(this.spawnClock>=interval){this.spawnClock=Math.min(this.spawnClock,interval);if(this.mode!=='planner'||this.cars.length<this.trafficBudget()){this.spawnClock-=interval;this.spawn();}}
    if(this.replanClock>=B.replanSeconds){this.replanClock=0;for(const car of this.cars)if(this.random()<B.replanShare)car.revision=-1;}
    for(let i=this.cars.length-1;i>=0;i--){const car=this.cars[i];car.prevX=car.worldX;car.prevY=car.worldY;if(car.parkingPhase)this.updateOfficeParking(car,dt);else this.advance(car,dt);this.syncCarPosition(car);if(car.done){this.pool.push(car);this.cars.splice(i,1);}}
    this.tracker.update(this.time,this.graph);
    this.businessTracker.trim(this.time);
    while(this.visitEffects.length&&this.visitEffects[0].time<this.time-2)this.visitEffects.shift();
    this.updateGrowth(dt);
    this.updateWalkers(dt);
  }
  syncCarPosition(car){
    if(car.parkingPhase)return;
    const from=car.route[car.index],to=car.route[Math.min(car.index+1,car.route.length-1)],a=point(from),b=point(to);let dx=b.x-a.x,dy=b.y-a.y,progress=car.progress;
    if(this.mode==='planner'&&car.index===car.route.length-1){const previous=point(car.route[Math.max(0,car.index-1)]);dx=a.x-previous.x;dy=a.y-previous.y;if(!dx&&!dy){dx=Math.cos(car.angle||0);dy=Math.sin(car.angle||0);}progress*=.9;}
    car.worldX=a.x+.5+dx*progress-dy*9/B.tile;car.worldY=a.y+.5+dy*progress+dx*9/B.tile;car.angle=Math.atan2(dy,dx);
  }
  get income(){return this.tracker.income;}
  stats(node){return this.tracker.stats(node,this.time);}
  snapshot(){return {tiles:[...this.tiles],trees:[...this.trees],buildings:structuredClone(this.buildings),tolls:structuredClone([...this.tolls]),flyovers:structuredClone(this.flyovers),bridges:structuredClone(this.bridges),signals:[...this.signals],coins:this.coins};}
  beginStroke(tool){this.endStroke();this.stroke={tool,entry:null,actions:0};}
  endStroke(){const result=this.stroke;this.stroke=null;return result;}
  record(before){
    const delta=this.coins-before.coins,after=this.snapshot();
    if(this.stroke?.entry){this.stroke.entry.cashDelta+=delta;this.stroke.entry.after=after;this.stroke.actions++;return;}
    before.cashDelta=delta;before.after=after;this.undoStack.push(before);if(this.undoStack.length>B.undoLimit)this.undoStack.shift();
    if(this.stroke){this.stroke.entry=before;this.stroke.actions=1;}
  }
  rebuild(){
    this.graph=graphFrom(this.tiles,this.flyovers);this.revision++;
    const signature=[...this.graph.keys()].filter(n=>n<B.layerOffset).join(',');if(signature!==this.walkTopologySignature){this.walkTopology++;this.walkTopologySignature=signature;}
    this.refreshDevelopment();
    for(const n of this.serviceNext.keys())if(!this.tolls.has(n))this.serviceNext.delete(n);
    for(const car of this.cars){if(car.waitingNode!==null&&!this.tolls.has(car.waitingNode))car.waitingNode=null;if(!car.parkingPhase&&car.route.some(n=>!this.graph.has(n)))car.done=true;}
    for(let i=this.cars.length-1;i>=0;i--)if(this.cars[i].done){this.pool.push(this.cars[i]);this.cars.splice(i,1);}
  }
  undo(){
    this.endStroke();
    const previous=this.undoStack.at(-1);if(!previous)return 'Nothing to undo yet.';
    if(this.coins-previous.cashDelta<0)return 'Not enough coins to reverse this refund.';
    this.undoStack.pop();this.coins-=previous.cashDelta;
    const beforeTrees=new Set(previous.trees),afterTrees=new Set(previous.after.trees);
    for(const n of new Set([...beforeTrees,...afterTrees]))if(beforeTrees.has(n)!==afterTrees.has(n)){if(beforeTrees.has(n))this.trees.add(n);else this.trees.delete(n);}
    for(let i=0;i<this.tiles.length;i++)if(previous.tiles[i]!==previous.after.tiles[i])this.tiles[i]=previous.tiles[i];
    if(JSON.stringify(previous.buildings)!==JSON.stringify(previous.after.buildings)){
      const current=new Map(this.buildings.map(b=>[id(b.x,b.y),b]));
      this.buildings=previous.buildings.map(b=>{
        const live=current.get(id(b.x,b.y));
        if(live)for(const key of ['visitors','walkingVisits','revenue','turnedAway','paint'])if(live[key]!==undefined)b[key]=live[key];
        return b;
      });
    }
    const beforeTolls=new Map(previous.tolls),afterTolls=new Map(previous.after.tolls);
    for(const node of new Set([...beforeTolls.keys(),...afterTolls.keys()])){
      const before=beforeTolls.get(node),after=afterTolls.get(node);
      if(!before&&after)this.tolls.delete(node);
      else if(before&&!after)this.tolls.set(node,before);
      else if(before&&after){const current=this.tolls.get(node);if(current)for(const key of new Set([...Object.keys(before),...Object.keys(after)]))if(JSON.stringify(before[key])!==JSON.stringify(after[key]))current[key]=before[key];}
    }
    if(JSON.stringify(previous.flyovers)!==JSON.stringify(previous.after.flyovers))this.flyovers=previous.flyovers;
    if(JSON.stringify(previous.bridges)!==JSON.stringify(previous.after.bridges))this.bridges=previous.bridges;
    const beforeSignals=new Set(previous.signals),afterSignals=new Set(previous.after.signals);
    for(const n of new Set([...beforeSignals,...afterSignals]))if(beforeSignals.has(n)!==afterSignals.has(n)){if(beforeSignals.has(n))this.signals.add(n);else this.signals.delete(n);}
    if(this.mode==='planner')for(const toll of this.tolls.values())toll.price=Math.min(toll.price,this.tollLimit(toll));
    this.rebuild();return null;
  }
  neighbors(n){const {x,y}=point(n);return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&b>=0&&a<B.size&&b<B.size).map(([a,b])=>id(a,b));}
  roadRemovalCost(n){const t=this.tolls.get(n);return (this.tiles[n]==='mainRoad'?B.mainPrice:this.tiles[n]==='roundabout'?B.roadPrice+B.roundaboutPrice:B.roadPrice)+(this.signals.has(n)?B.signalPrice:0)+(t?B.tollPrice+B.boothUpgradePrices.slice(0,t.level-1).reduce((s,v)=>s+v,0):0);}
  removeRoad(n){
    if(!isRoad(this.tiles[n]))return 'Select a road to remove.';
    if(this.endpoints.includes(n))return 'Keep the city entrance connected.';
    if(this.tiles[n]==='bridge'||this.flyovers.some(s=>s.nodes.includes(n))||this.bridges.some(s=>s.nodes.includes(n)))return 'Remove this bridge or flyover with the Demolish tool first.';
    const before=this.snapshot(),refund=Math.round(this.roadRemovalCost(n)*B.refund);
    this.tolls.delete(n);this.signals.delete(n);this.tiles[n]='grass';this.coins+=refund;this.record(before);this.rebuild();return null;
  }
  buildCost(tool){return {road:B.roadPrice,main:B.mainPrice,toll:B.tollPrice,signal:B.signalPrice,roundabout:B.roundaboutPrice}[tool]||0;}
  validate(n,tool){
    if(tool==='clear-trees')return this.trees.has(n)?this.coins<this.treeRemovalCost(n)?`You need $${this.treeRemovalCost(n)} to clear these trees.`:null:'Tap a wooded plot to clear it.';
    if(['road','main'].includes(tool)&&this.trees.has(n))return 'Clear the trees on this plot before building a road.';
    if(PROJECTS[tool])return this.validateProject(n,tool);
    if(BUILDINGS[tool])return this.validateBuilding(n,tool);
    if(!Number.isInteger(n)||n<0||n>=this.tiles.length)return 'Choose a tile inside the city.';
    const type=this.tiles[n];
    if(tool==='demolish'){
      if(type==='building')return null;
      if(this.flyovers.some(s=>s.nodes.includes(n))||this.bridges.some(s=>s.nodes.includes(n)))return null;
      if(!isRoad(type))return 'Select a road, booth, signal or structure to remove.';
      if(type==='bridge')return 'The starter river bridge cannot be demolished.';
      if(this.endpoints.includes(n))return 'Keep the city entrance connected.';
      return null;
    }
    if(tool==='toll'){
      if(!isRoad(type))return 'Toll booths need an existing road.';
      if(this.tolls.has(n))return 'There is already a toll booth here.';
      if(this.tolls.size>=B.maxBooths)return `Maximum ${B.maxBooths} toll booths reached.`;
    }else if(tool==='signal'||tool==='roundabout'){
      if(!isRoad(type)||this.neighbors(n).filter(a=>isRoad(this.tiles[a])).length<3)return 'Choose an intersection with at least three roads.';
      if(this.tolls.has(n))return 'Move the toll booth off this intersection first.';
      if(type==='roundabout'||this.signals.has(n))return 'This intersection is already managed.';
    }else if(tool==='main'){
      if(type!=='grass'&&type!=='road')return 'Use empty grass or upgrade a local road.';
      if(type==='grass'&&!this.neighbors(n).some(a=>isRoad(this.tiles[a])))return 'Connect your road to the existing network.';
    }else if(tool==='road'){
      if(type!=='grass')return 'Build on empty grass, next to a road.';
      if(!this.neighbors(n).some(a=>isRoad(this.tiles[a])))return 'Connect your new road to the existing network.';
    }else return 'Choose a construction tool.';
    const cost=this.buildCost(tool);if(this.coins<cost)return `You need ${cost} coins for this construction.`;
    return null;
  }
  build(n,tool){
    if(tool==='clear-trees')return this.clearTrees(n);
    if(PROJECTS[tool])return this.buildProject(n,tool);
    if(BUILDINGS[tool])return this.buildBuilding(n,tool);
    if(tool==='demolish')return this.demolish(n);
    const error=this.validate(n,tool);if(error)return error;
    const before=this.snapshot();this.coins-=this.buildCost(tool);
    if(tool==='toll')this.tolls.set(n,{price:B.initialToll,level:1,baseline:this.stats(n),alternativeBefore:this.alternativeStats(n)});
    else if(tool==='signal')this.signals.add(n);
    else this.tiles[n]=tool==='main'?'mainRoad':tool==='roundabout'?'roundabout':'road';
    this.record(before);this.rebuild();return null;
  }
  planSpan(start,end,tool){
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<0||start>=B.layerOffset||end>=B.layerOffset)return {error:'Choose two points inside the city.'};
    const a=point(start),b=point(end),length=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
    if(a.x!==b.x&&a.y!==b.y)return {error:'Keep the span straight: choose the same row or column.'};
    if(length<2||length>B.maxSpan)return {error:`Choose a span between 2 and ${B.maxSpan} tiles long.`};
    const dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y),nodes=[];
    for(let i=0;i<=length;i++)nodes.push(id(a.x+dx*i,a.y+dy*i));
    if(!isRoad(this.tiles[start]))return {error:'Start on an existing road.'};
    if(tool==='flyover'){
      if(!isRoad(this.tiles[end]))return {error:'The second ramp must end on an existing road.'};
      if(nodes.some(n=>this.tiles[n]==='river'||this.tiles[n]==='building'||this.tiles[n]==='bridge'))return {error:'Flyovers cross grass and ground roads, not water or buildings.'};
      if(nodes.some(n=>this.trees.has(n)))return {error:'Clear the trees along the flyover corridor first.'};
      if(this.flyovers.some(s=>s.nodes.some(n=>nodes.includes(n))))return {error:'This span overlaps an existing flyover.'};
    }else{
      if(this.trees.has(end))return {error:'Clear the trees at the bridge landing first.'};
      if(this.tiles[end]!=='grass'&&!isRoad(this.tiles[end]))return {error:'End your bridge on clear land or a road on the other bank.'};
      if(nodes.slice(1,-1).some(n=>this.tiles[n]!=='river'))return {error:'A bridge must cross only river tiles between its two banks.'};
    }
    const cost=(tool==='flyover'?nodes.length:nodes.length-2)*(tool==='flyover'?B.flyoverPrice:B.bridgePrice)+(tool==='bridge'&&this.tiles[end]==='grass'?B.roadPrice:0);
    return {nodes,cost,error:this.coins<cost?`This ${tool} costs ${cost} coins.`:null};
  }
  buildSpan(start,end,tool){
    const plan=this.planSpan(start,end,tool);if(plan.error)return plan.error;
    const before=this.snapshot();this.coins-=plan.cost;
    if(tool==='flyover')this.flyovers.push({nodes:plan.nodes,cost:plan.cost});
    else{for(const n of plan.nodes)this.tiles[n]=this.tiles[n]==='river'?'bridge':isRoad(this.tiles[n])?this.tiles[n]:'road';this.bridges.push({nodes:plan.nodes,cost:plan.cost});}
    this.record(before);this.rebuild();return null;
  }
  planBentFlyover(start,bend,end){
    const a=point(start),b=point(bend),c=point(end),nodes=[];
    if(![start,bend,end].every(n=>Number.isInteger(n)&&n>=0&&n<B.layerOffset)||start===bend||bend===end||start===end)return {error:'Choose two ramps and a separate bend tile.'};
    if((a.x!==b.x&&a.y!==b.y)||(b.x!==c.x&&b.y!==c.y))return {error:'Align each leg of the bend with the tile grid.'};
    if(!isRoad(this.tiles[start])||!isRoad(this.tiles[end]))return {error:'Both ramps must connect to existing roads.'};
    for(const [p,q]of [[a,b],[b,c]]){const len=Math.abs(q.x-p.x)+Math.abs(q.y-p.y),dx=Math.sign(q.x-p.x),dy=Math.sign(q.y-p.y);for(let i=nodes.length?1:0;i<=len;i++)nodes.push(id(p.x+dx*i,p.y+dy*i));}
    if(nodes.length-1>B.maxSpan*2||new Set(nodes).size!==nodes.length)return {error:'Keep each flyover under 28 tiles without doubling back.'};
    if(nodes.some(n=>!['grass','road','mainRoad','roundabout'].includes(this.tiles[n])||this.trees.has(n)||this.flyovers.some(s=>s.nodes.includes(n))))return {error:'Clear the corridor first. Flyovers cannot overlap trees, buildings, water or another flyover.'};
    const cost=nodes.length*B.flyoverPrice;return {nodes,cost,error:this.coins<cost?`This flyover costs ${cost} coins.`:null};
  }
  buildBentFlyover(start,bend,end){const plan=this.planBentFlyover(start,bend,end);if(plan.error)return plan.error;const before=this.snapshot();this.coins-=plan.cost;this.flyovers.push({nodes:plan.nodes,cost:plan.cost,bent:true});this.record(before);this.rebuild();return null;}
  demolish(n){
    const error=this.validate(n,'demolish');if(error)return error;
    const before=this.snapshot();let value=0;
    const fly=this.flyovers.find(s=>s.nodes.includes(n)),bridge=this.bridges.find(s=>s.nodes.includes(n));
    if(this.tiles[n]==='building'){const b=this.buildingAt(n);value=b?.investment||0;if(b){for(const cell of plotCells(b))this.tiles[cell]='grass';this.buildings=this.buildings.filter(item=>item!==b);}}
    else if(fly){value=fly.cost;this.flyovers=this.flyovers.filter(s=>s!==fly);}
    else if(bridge){value=bridge.cost;for(const a of bridge.nodes.slice(1,-1)){this.tiles[a]='river';this.tolls.delete(a);this.signals.delete(a);}this.bridges=this.bridges.filter(s=>s!==bridge);}
    else if(this.tolls.has(n)){const t=this.tolls.get(n);value=B.tollPrice+B.boothUpgradePrices.slice(0,t.level-1).reduce((s,v)=>s+v,0);this.tolls.delete(n);}
    else if(this.signals.has(n)){value=B.signalPrice;this.signals.delete(n);}
    else{value=this.tiles[n]==='mainRoad'?B.mainPrice:this.tiles[n]==='roundabout'?B.roundaboutPrice+B.roadPrice:B.roadPrice;this.tiles[n]='grass';}
    this.coins+=Math.round(value*B.refund);this.record(before);this.rebuild();return null;
  }
  alternativeNode(n){
    const key=`${n}:${this.revision}:${Math.floor(this.time/B.replanSeconds)}`;
    if(this.alternativeCache.has(key))return this.alternativeCache.get(key);
    const avoid=new Map(this.tolls);avoid.set(n,{price:Number.MAX_SAFE_INTEGER/2});
    const route=findRoute(this.graph,this.endpoints[0],this.endpoints[1],.4,avoid,this.travelTime);
    const {x}=point(n),alternatives=route&&!route.includes(n)?route.filter(a=>a<B.layerOffset&&roadName(a)!==roadName(n)):[];
    const result=alternatives.find(a=>point(a).x===x)??alternatives[Math.floor(alternatives.length/2)]??null;
    if(this.alternativeCache.size>30)this.alternativeCache.clear();this.alternativeCache.set(key,result);return result;
  }
  alternativeStats(n){const a=this.alternativeNode(n);return a===null?null:{node:a,...this.stats(a)};}
  tollLimit(toll){return this.mode==='planner'?B.boothTollLimits[(toll?.level||1)-1]:B.maxToll;}
  setToll(node,price){const t=this.tolls.get(node);if(t&&Number.isFinite(price)){const next=Math.max(0,Math.min(this.tollLimit(t),Math.round(price)));if(next===t.price)return;t.baseline=this.stats(node);t.alternativeBefore=this.alternativeStats(node);t.price=next;this.revision++;}}
  removeToll(node){
    const t=this.tolls.get(node);if(!t)return 'No booth to remove.';
    const before=this.snapshot(),value=B.tollPrice+B.boothUpgradePrices.slice(0,t.level-1).reduce((s,v)=>s+v,0);
    this.coins+=Math.round(value*B.refund);this.tolls.delete(node);this.record(before);this.rebuild();return null;
  }
  upgradeBooth(node){
    const t=this.tolls.get(node);if(!t)return 'Select a toll booth first.';
    if(t.level>=5)return 'This booth is already at level 5.';
    const cost=B.boothUpgradePrices[t.level-1];if(this.coins<cost)return `You need ${cost} coins to upgrade this booth.`;
    const before=this.snapshot();this.coins-=cost;t.level++;if(this.mode==='planner')t.price=this.tollLimit(t);this.record(before);this.revision++;return null;
  }
  upgradeCost(type){return Math.round(B.upgradeBasePrice*Math.pow(B.upgradePriceMultiplier,this.upgrades[type]||0));}
  buyUpgrade(type){
    if(!upgradeTypes[type]||upgradeTypes[type].locked)return 'Offline earnings arrive in Phase 3.';
    if(this.upgrades[type]>=B.upgradeMaxLevel)return 'Already upgraded to the maximum level.';
    const cost=this.upgradeCost(type);if(this.coins<cost)return `You need ${cost} coins for this upgrade.`;
    this.coins-=cost;this.upgrades[type]++;this.revision++;return null;
  }
}
Object.assign(Simulation.prototype,growthMethods);
Object.assign(Simulation.prototype,projectMethods);
Object.assign(Simulation.prototype,plannerMethods);
  Object.assign(Simulation.prototype,forestMethods);
  Object.assign(Simulation.prototype,pedestrianMethods);
  Object.assign(Simulation.prototype,officeMethods);
