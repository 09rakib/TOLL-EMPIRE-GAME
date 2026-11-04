import {DISTRICTS,districtFor} from './campaign.js';
import {serviceDistances,serviceRanges} from './city-insights.js';
const names=['Build two connected homes','Give a home hospital coverage','Welcome 30 new business visitors','Keep traffic flowing for 30 seconds'];
export function goalState(g,key){g.campaign.neighborhoods??={visits:{},districts:{}};return g.campaign.neighborhoods.districts[key]??={stage:0,visitsStart:g.campaign.neighborhoods.visits[key]||0,steady:0,tripStart:g.campaign.trips};}
export function neighborhoodGoal(g,key){
 const state=goalState(g,key),district=DISTRICTS.find(d=>d.id===key);if(!district)return null;
 const homes=g.buildings.filter(b=>b.managed&&b.type===0&&districtFor(b)?.id===key&&g.buildingEntrance(b)!==null),stage=state.stage;
 let value=0,target=[2,1,30,30][stage]||1;
 if(stage===0)value=homes.length;
 if(stage===1){const d=serviceDistances(g,'clinic');value=homes.filter(b=>(d.get(g.buildingEntrance(b))??Infinity)<serviceRanges.clinic).length;}
 if(stage===2)value=Math.max(0,(g.campaign.neighborhoods.visits[key]||0)-state.visitsStart);
 if(stage===3)value=state.steady;
 return {district,key,stage,title:names[stage]||'Neighborhood complete',value:Math.min(target,value),target,ready:stage<4&&value>=target,reward:200+stage*150,complete:stage===4};
}
export function recordNeighborhoodVisit(g,b,passengers){const d=districtFor(b);if(!d)return;goalState(g,d.id);const visits=g.campaign.neighborhoods.visits;visits[d.id]=(visits[d.id]||0)+passengers;}
export const cityGoalMethods={
 claimNeighborhood(key){if(!DISTRICTS.some(d=>d.id===key))return 'Choose a neighborhood.';const goal=neighborhoodGoal(this,key);if(!goal.ready)return 'Complete this neighborhood goal first.';
   const s=goalState(this,key);this.coins+=goal.reward;this.campaign.xp+=60;s.stage++;s.visitsStart=this.campaign.neighborhoods.visits[key]||0;s.steady=0;s.tripStart=this.campaign.trips;return null;},
 updateCityGoals(dt){
   this.goalClock=(this.goalClock||0)+dt;if(this.goalClock<1)return;const elapsed=this.goalClock;this.goalClock=0;
   for(const d of DISTRICTS){const s=goalState(this,d.id);if(s.stage!==3)continue;const homes=this.buildings.filter(b=>b.managed&&b.type===0&&districtFor(b)?.id===d.id&&this.buildingEntrance(b)!==null);
     const roads=[...this.density].filter(([n,count])=>count>0&&districtFor({x:n%64,y:Math.floor(n/64)})?.id===d.id),active=roads.reduce((sum,[,count])=>sum+count,0);
     const flowing=homes.length>=2&&active>=3&&this.campaign.trips-s.tripStart>=10&&roads.every(([n])=>this.congestionAt(n)!=='jammed');s.steady=flowing?Math.min(30,s.steady+elapsed):0;
   }
 },
};
