import {B} from './balance.js';
import {id} from './world.js';
import {valueOfTime} from './pathfinder.js';
import {POLICIES} from './campaign.js';
export const buildingKind=b=>b.kind||['home','shop','office','park','clinic','hotel'][b.type];
export const buildingNames={home:'Home',shop:'Shop',office:'Office',park:'Park',clinic:'Hospital',hotel:'Hotel'};
export function visitFee(b){return (B.plannerVisitFees[b.type]||0)*Math.pow(B.plannerFeeGrowth,(b.level||1)-1);}
export function visitCapacity(b){return Math.round((B.plannerCapacities[b.type]||0)*Math.pow(B.plannerCapacityGrowth,(b.level||1)-1));}
export function architectureTier(b){const tiers={home:['Cottage','Duplex','Townhouse','Apartments','Luxury residences'],shop:['Corner shop','Market shop','Boutique','Shopping arcade','Department store'],office:['Small office','Business office','Office block','Glass tower','Corporate headquarters'],clinic:['Local clinic','Community hospital','Medical center','Specialist hospital','Grand medical campus'],hotel:['Guesthouse','City hotel','Boutique hotel','Resort hotel','Grand luxury hotel'],park:['Pocket park','Community garden','City garden','Fountain park','Grand botanical garden']};return (tiers[buildingKind(b)]||tiers.office)[Math.max(0,Math.min(4,(b.level||1)-1))];}
export const plannerMethods={
  trafficBudget(){return Math.min(this.settings.lowPower?B.lowPowerCars:B.maxCars,2+this.homeLevels*B.plannerHomeVehicles+this.commercialLevels*2);},
  plannerInterval(){return Math.max(.6,B.plannerBaseInterval/((1+this.homeLevels*B.plannerHomeDemand+this.commercialLevels*B.plannerBusinessDemand)*(1+this.upgrades.traffic*B.trafficBoostPerLevel)*POLICIES[this.settings.policy].demand));},
  addPlannerCar(origin,destination,target=null,kind=null){
    if(origin===destination)return false;const vot=valueOfTime(this.random()),route=this.route(origin,destination,vot);if(!route||route.length<2)return false;
    if(this.cars.some(c=>c.route[c.index]===origin&&c.progress<.8))return false;
    const car=this.pool.pop()||{};Object.assign(car,{route,index:0,progress:0,vot,color:this.colors[Math.floor(this.random()*this.colors.length)],destination,origin,targetBuilding:target,kind:kind||(this.random()<B.plannerBusChance?'bus':'car'),revision:this.revision,age:0,edgeAge:0,waitingNode:null,serviceAt:0,done:false});
    this.syncCarPosition(car);car.prevX=car.worldX;car.prevY=car.worldY;this.cars.push(car);return true;
  },
  spawnPlanner(){
    if(this.cars.length>=this.trafficBudget())return false;
    const ends=this.endpoints;let origin=ends[this.random()<.5?0:1],destination=origin===ends[0]?ends[1]:ends[0],target=null;
    if(this.businessDestinations.length&&this.random()<.75){const site=this.businessDestinations[Math.floor(this.random()*this.businessDestinations.length)];destination=site.node;target=site.building;if(this.homeDestinations.length&&this.random()<.55)origin=this.homeDestinations[Math.floor(this.random()*this.homeDestinations.length)];if(origin===destination)origin=destination===ends[0]?ends[1]:ends[0];}
    else if(this.homeDestinations.length&&this.random()<.65){destination=this.homeDestinations[Math.floor(this.random()*this.homeDestinations.length)];if(destination===origin)destination=origin===ends[0]?ends[1]:ends[0];}
    return this.addPlannerCar(origin,destination,target);
  },
  settleVisit(car){
    if(car.targetBuilding===null||car.targetBuilding===undefined)return 0;
    const b=this.buildingAt(car.targetBuilding);if(!b?.managed||b.project||!this.neighbors(car.targetBuilding).includes(car.destination)||!this.cityConnected.has(car.destination))return 0;
    const capacity=visitCapacity(b);if(!capacity)return 0;
    if(this.time<(this.admissionNext.get(car.targetBuilding)||0)){b.turnedAway=(b.turnedAway||0)+1;return 0;}
    const passengers=car.kind==='bus'?3:1;this.admissionNext.set(car.targetBuilding,this.time+60/capacity*passengers);
    const ranks=Object.values(this.campaign.districts).reduce((s,n)=>s+n,0),festival=this.campaign.event?.status==='active'&&this.eventSpec()?.kind==='festival';
    const payment=visitFee(b)*passengers*POLICIES[this.settings.policy].revenue*(1+ranks*B.districtRevenueBoost)*(festival?2:1);
    b.visitors=(b.visitors||0)+passengers;b.revenue=(b.revenue||0)+payment;this.coins+=payment;this.earned+=payment;this.campaign.xp+=payment*B.xpPerCoin;
    for(let i=0;i<passengers;i++)this.businessTracker.passage(this.time,car.targetBuilding,car.age);this.businessTracker.payment(this.time,car.targetBuilding,payment);
    this.visitEffects.push({node:car.targetBuilding,time:this.time,amount:payment});if(this.visitEffects.length>12)this.visitEffects.shift();return payment;
  },
};
