import {B} from './balance.js';
import {id,isRoad} from './world.js';
import {DISTRICTS,POLICIES,EVENTS,ACHIEVEMENTS,levelForXp,ensureContracts,newContract,contractProgress,districtFor} from './campaign.js';
import {PROJECTS} from './projects.js';
export const BUILDINGS={home:{type:0,name:'Home',price:B.homePrice},shop:{type:1,name:'Shop',price:B.shopPrice},office:{type:2,name:'Office',price:B.officePrice},park:{type:3,name:'Park',price:B.parkPrice},clinic:{type:4,name:'Hospital',price:B.hospitalPrice},hotel:{type:5,name:'Hotel',price:B.hotelPrice}};
export const growthMethods={
  metrics(){return {served:this.served,earned:Math.floor(this.earned),trips:this.campaign.trips,roads:this.tiles.filter(isRoad).length,main:this.tiles.filter(t=>t==='mainRoad').length,managed:this.buildings.filter(b=>b.managed&&(!b.project||b.projectStage===2)).length,buildingLevels:this.buildings.reduce((n,b)=>n+(b.managed?(b.level||1)-1:0),0),boothLevels:[...this.tolls.values()].reduce((s,t)=>s+t.level-1,0)};},
  buildingAt(n){return this.buildings.find(b=>id(b.x,b.y)===n);},
  buildingEntrance(b){return this.neighbors(id(b.x,b.y)).find(n=>this.cityConnected?.has(n))??null;},
  refreshDevelopment(){
    const connected=new Set(),queue=this.endpoints.filter(n=>this.graph.has(n));for(const n of queue)connected.add(n);
    for(let i=0;i<queue.length;i++)for(const n of this.graph.get(queue[i])||[])if(!connected.has(n)){connected.add(n);queue.push(n);}this.cityConnected=connected;
    this.destinations=[];this.businessRate=0;this.managedLevels=0;this.population=0;this.parkLevels=0;
    this.homeLevels=0;this.commercialLevels=0;this.homeDestinations=[];this.businessDestinations=[];
    this.projectEffects={capacity:0,speed:0,repair:0,demand:0};
    const ranks=Object.values(this.campaign.districts).reduce((s,v)=>s+v,0);
    for(const b of this.buildings){
      const entrance=this.buildingEntrance(b);if(!b.managed||entrance===null)continue;
      const level=b.level||1;this.destinations.push(entrance);
      if(b.project){if(b.projectStage===2){const spec=PROJECTS[b.project];this.businessRate+=spec.income;for(const key of Object.keys(this.projectEffects))this.projectEffects[key]+=spec[key]||0;}continue;}
      this.managedLevels+=level;
      if(b.type===0){this.population+=level*20;this.homeLevels+=level;this.homeDestinations.push(entrance);}
      if(b.type===3)this.parkLevels+=level;
      if([1,2,4,5].includes(b.type)){this.commercialLevels+=level;this.businessDestinations.push({node:entrance,building:id(b.x,b.y)});}
      if(this.mode!=='planner')this.businessRate+=(B.buildingRevenue[b.type]||0)*Math.pow(1.45,level-1);
    }
    this.businessRate*=1+ranks*B.districtRevenueBoost;
    this.demandBonus=1+Math.min(1.5,this.managedLevels*B.managedDemandPerLevel)+ranks*B.districtDemandBoost+this.projectEffects.demand;
  },
  validateBuilding(n,kind){
    if(!BUILDINGS[kind]||!Number.isInteger(n)||n<0||n>=B.layerOffset)return 'Choose a building and a city tile.';
    if(this.tiles[n]!=='grass')return 'Buildings need empty grass next to a road.';
    if(!this.neighbors(n).some(a=>this.cityConnected.has(a)))return 'Connect this site to the city road network first.';
    if(this.flyovers.some(s=>s.nodes.includes(n)))return 'Keep the flyover corridor clear.';
    if(this.coins<BUILDINGS[kind].price)return `You need ${BUILDINGS[kind].price} coins for this building.`;
    return null;
  },
  buildBuilding(n,kind){
    const error=this.validateBuilding(n,kind);if(error)return error;
    const before=this.snapshot(),spec=BUILDINGS[kind],x=n%B.size,y=Math.floor(n/B.size);
    this.coins-=spec.price;this.tiles[n]='building';this.buildings.push({x,y,type:spec.type,kind,variant:0,level:1,managed:true,investment:spec.price,paint:0,visitors:0,revenue:0});
    this.record(before);this.rebuild();return null;
  },
  buildingUpgradeCost(b){if(b.project)return PROJECTS[b.project].costs[(b.projectStage||0)+1]||0;const spec=Object.values(BUILDINGS).find(s=>s.type===b.type);return Math.round(spec.price*Math.pow(B.buildingUpgradeFactor,b.level||1));},
  upgradeBuilding(n){
    const b=this.buildingAt(n);if(!b)return 'Select a building.';
    if(b.project)return this.advanceProject(n);
    if(this.buildingEntrance(b)===null)return 'Connect this building to a road first.';
    if((b.level||1)>=B.buildingMaxLevel)return 'This building is fully developed.';
    const cost=this.buildingUpgradeCost(b);if(this.coins<cost)return `You need ${cost} coins for this upgrade.`;
    const before=this.snapshot();this.coins-=cost;b.level=(b.level||1)+1;b.managed=true;b.investment=(b.investment||0)+cost;
    this.record(before);this.rebuild();return null;
  },
  paintBuilding(n,paint){const b=this.buildingAt(n);if(b&&Number.isInteger(paint)&&paint>=0&&paint<5)b.paint=paint;},
  districtCost(key){return Math.round(B.districtPrice*Math.pow(B.districtPriceFactor,this.campaign.districts[key]||0));},
  developDistrict(key){
    const district=DISTRICTS.find(d=>d.id===key);if(!district)return 'Choose a district.';
    const rank=this.campaign.districts[key]||0;if(rank>=B.districtMaxRank)return 'District fully developed.';
    if(levelForXp(this.campaign.xp)<district.level)return `Reach city level ${district.level} to develop ${district.name}.`;
    if(!this.buildings.some(b=>b.managed&&(!b.project||b.projectStage===2)&&districtFor(b)?.id===key&&this.buildingEntrance(b)!==null))return 'Build or upgrade a connected building in this district first.';
    const cost=this.districtCost(key);if(this.coins<cost)return `District development costs ${cost} coins.`;
    this.coins-=cost;this.campaign.districts[key]=rank+1;this.campaign.xp+=100*(rank+1);this.refreshDevelopment();return null;
  },
  claimContract(contractId){
    const index=this.campaign.contracts.findIndex(c=>c.id===contractId);if(index<0)return 'This contract has already been claimed.';
    const c=this.campaign.contracts[index];if(contractProgress(this,c)<c.target)return 'Complete the contract objective first.';
    this.coins+=c.reward;this.campaign.xp+=c.xp;this.campaign.claimed++;
    this.campaign.contracts[index]=newContract(this);return null;
  },
  swapContract(contractId){const i=this.campaign.contracts.findIndex(c=>c.id===contractId);if(i<0)return 'Contract not found.';this.campaign.contracts[i]=newContract(this);return null;},
  claimAchievement(key){const spec=ACHIEVEMENTS.find(a=>a.id===key);if(!spec||this.campaign.achievements.includes(key))return 'This milestone has already been collected.';if(this.metrics()[spec.key]<spec.target)return 'Reach the milestone first.';this.campaign.achievements.push(key);this.coins+=spec.reward;this.campaign.xp+=spec.reward*.15;return null;},
  eventSpec(){return this.campaign.event?EVENTS.find(e=>e.kind===this.campaign.event.kind):null;},
  acceptEvent(){const event=this.campaign.event;if(!event||event.status!=='offer')return 'No event is waiting.';const spec=this.eventSpec();event.status='active';event.endsAt=this.time+B.eventDuration;event.start=this.metrics()[spec.key];return null;},
  eventProgress(){const e=this.campaign.event,spec=this.eventSpec();return e&&spec?Math.max(0,this.metrics()[spec.key]-(e.start||0)):0;},
  finishEvent(){
    const event=this.campaign.event;if(!event)return 'No current event.';
    if(event.status==='active')return 'This event is still running.';
    if(event.status==='won'){this.coins+=event.reward;this.campaign.xp+=80;}
    this.campaign.event=null;this.campaign.nextEvent=this.time+B.eventInterval;return null;
  },
  updateGrowth(dt){
    this.campaign.playTime+=dt;
    const spec=this.eventSpec(),event=this.campaign.event;
    const business=this.mode==='planner'?0:this.businessRate*POLICIES[this.settings.policy].revenue*(event?.status==='active'&&spec.kind==='festival'?2:1)*dt/60;
    this.coins+=business;this.earned+=business;this.campaign.xp+=business*B.xpPerCoin;
    if(event?.status==='active'&&this.time>=event.endsAt){event.status=this.eventProgress()>=spec.target?'won':'finished';}
    if(!event&&this.time>=this.campaign.nextEvent){const spec=EVENTS[this.campaign.eventRound++%EVENTS.length];this.campaign.event={kind:spec.kind,status:'offer',reward:B.eventReward+this.campaign.eventRound*35};}
    ensureContracts(this);
  },
  setPolicy(policy){if(!POLICIES[policy])return 'Choose a valid city policy.';this.settings.policy=policy;this.revision++;return null;},
  claimOffline(){const amount=this.campaign.pendingOffline||0;this.coins+=amount;this.campaign.pendingOffline=0;return amount;},
};
