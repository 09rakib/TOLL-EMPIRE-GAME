import {B} from './balance.js';
export const THEMES={meadow:{name:'Meadow',grass:['#b8cf9a','#b2cb91','#bdd39f'],water:'#75c3d1'},coastal:{name:'Coastal',grass:['#b8d1bb','#aec9b2','#c0d8c0'],water:'#77bacd'},autumn:{name:'Autumn',grass:['#d1c29b','#c6b98d','#d9caa5'],water:'#88b6c4'}};
export const POLICIES={balanced:{name:'Balanced city',description:'A steady mix of commuters and visitors.',demand:1,speed:1,revenue:1},express:{name:'Express commute',description:'+15% driving speed · 15% less local business income.',demand:1,speed:1.15,revenue:.85},tourism:{name:'Visitor economy',description:'+25% demand and business income · 10% slower traffic.',demand:1.25,speed:.9,revenue:1.25}};
export const DISTRICTS=[
  {id:'north',name:'Northwood',subtitle:'Homes, parks and room to grow',x:8,y:8,level:1,bounds:[0,0,25,14]},
  {id:'central',name:'Willow Quarter',subtitle:'The heart of your daily commute',x:19,y:17,level:2,bounds:[0,15,25,22]},
  {id:'east',name:'Eastbank',subtitle:'A new destination across the water',x:30,y:18,level:3,bounds:[26,0,39,24]},
  {id:'south',name:'Market Gardens',subtitle:'A neighborhood worth connecting',x:15,y:29,level:5,bounds:[0,23,25,39]},
  {id:'harbor',name:'Willow Harbor',subtitle:'Turn the southern bank into a destination',x:31,y:30,level:7,bounds:[26,25,39,39]},
];
export const districtFor=b=>DISTRICTS.find(d=>b.x>=d.bounds[0]&&b.y>=d.bounds[1]&&b.x<=d.bounds[2]&&b.y<=d.bounds[3]);
export const xpThreshold=level=>Math.round(B.levelBaseXp*Math.pow(level-1,B.levelExponent));
export function levelForXp(xp){return Math.floor(Math.pow(Math.max(0,xp)/B.levelBaseXp,1/B.levelExponent))+1;}
export function createCampaign(saved,earned=0){
  return {xp:Math.floor(earned*B.xpPerCoin),trips:0,contractSerial:0,contracts:[],claimed:0,achievements:[],districts:{},event:null,eventRound:0,nextEvent:B.eventInterval,playTime:0,pendingOffline:0,tutorial:{step:0,done:false},...structuredClone(saved||{})};
}
export const ACHIEVEMENTS=[{id:'builder',name:'A place to call home',key:'managed',target:3,reward:250},{id:'operator',name:'More than a toll booth',key:'boothLevels',target:4,reward:600},{id:'commuter',name:'The daily commute',key:'served',target:500,reward:900},{id:'planner',name:'Room to grow',key:'main',target:30,reward:1000},{id:'metropolis',name:'The city never sleeps',key:'trips',target:2000,reward:2000},{id:'empire',name:'An empire in the making',key:'earned',target:50000,reward:4000}];
export function createSettings(saved){const settings={cityName:'Willow City',theme:'meadow',night:false,roadColor:'slate',policy:'balanced',sound:false,lowPower:false,showLabels:true,...saved};if(!THEMES[settings.theme])settings.theme='meadow';if(!POLICIES[settings.policy])settings.policy='balanced';if(!['slate','clay','midnight'].includes(settings.roadColor))settings.roadColor='slate';settings.cityName=String(settings.cityName).trim().slice(0,24)||'Willow City';return settings;}
const missionTypes=[
  {key:'served',verb:'Serve toll customers',target:r=>30+Math.floor(r/3)*15},
  {key:'roads',verb:'Extend your road network',target:r=>Math.min(8,4+Math.floor(r/4))},
  {key:'managed',verb:'Develop city buildings',target:()=>1},
  {key:'earned',verb:'Earn toll & business income',target:r=>250+r*60},
  {key:'buildingLevels',verb:'Upgrade your neighborhood',target:()=>1},
  {key:'trips',verb:'Complete city trips',target:r=>40+Math.floor(r/3)*15},
  {key:'main',verb:'Add four-lane road tiles',target:()=>3},
  {key:'boothLevels',verb:'Upgrade a toll booth',target:()=>1},
];
export function ensureContracts(game){if(!game.campaign.contracts.length)for(let i=0;i<3;i++)game.campaign.contracts.push(newContract(game));}
export function newContract(game){const serial=game.campaign.contractSerial++,spec=missionTypes[serial%missionTypes.length],round=Math.floor(game.campaign.claimed/3),metrics=game.metrics();return {id:serial,key:spec.key,title:spec.verb,target:spec.target(round),start:metrics[spec.key],reward:B.contractReward+round*B.contractRewardGrowth,xp:B.contractXp+round*5};}
export function contractProgress(game,contract){return Math.max(0,Math.min(contract.target,game.metrics()[contract.key]-contract.start));}
export const EVENTS=[{kind:'rush',name:'Rush-hour express',description:'Handle extra commuters. Demand rises 50% for 75 seconds.',demand:1.5,speed:1,key:'trips',target:24},{kind:'rain',name:'A rainy commute',description:'Keep the city moving in rain. Vehicles move 20% slower.',demand:1.1,speed:.8,key:'trips',target:18},{kind:'festival',name:'Market-day festival',description:'Bring visitors to town. Demand rises 35%; business income doubles.',demand:1.35,speed:1,key:'earned',target:150}];
