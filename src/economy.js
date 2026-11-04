import {citySatisfaction} from './satisfaction.js';
export function satisfactionEconomy(score){
 const value=Math.max(0,Math.min(100,Number.isFinite(score)?score:50));
 return {demand:1+Math.max(-.05,Math.min(.1,(value-50)*.002)),businessBonus:Math.max(0,(value-70)/30)*.05};
}
export const economyMethods={
 cityEconomy(){
   if(this.mode!=='planner')return {score:50,demand:1,businessBonus:0};
   const cached=this.economyCache;if(cached&&cached.revision===this.revision&&this.time-cached.time<1)return cached.value;
   const score=citySatisfaction(this).score,value={score,...satisfactionEconomy(score)};this.economyCache={revision:this.revision,time:this.time,value};return value;
 },
};
