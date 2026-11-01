import {B} from './balance.js';
import {createCampaign,createSettings} from './campaign.js';
import {PROJECTS} from './projects.js';
import {plotCells} from './plots.js';
import {updateRiver} from './river.js';
export const SAVE_KEY='toll-empire-planner-v4';
const KEY=SAVE_KEY;
export function serialize(game){return {version:3,mapSize:B.size,riverLayout:game.riverLayout,worldMode:game.mode,tiles:game.tiles,trees:[...game.trees],buildings:game.buildings,tolls:[...game.tolls],coins:game.coins,earned:game.earned,served:game.served,flyovers:game.flyovers,bridges:game.bridges,signals:[...game.signals],upgrades:game.upgrades,campaign:game.campaign,settings:game.settings,simulationTime:game.time,incomePerMinute:game.totalIncome,lastSaved:Date.now()};}
export function migrate(data){
  if(!data||![1,2,3].includes(data.version))return null;
  if(data.version===1)data={...data,version:2,tolls:data.tolls?.map(([n,t])=>[n,{...t,level:1}]),flyovers:[],bridges:[],signals:[],upgrades:{}};
  if(data.version===2)data={...data,version:3,campaign:createCampaign(null,data.earned||0),settings:createSettings(),simulationTime:0,incomePerMinute:0};
  // Extend older 40x40 cities without moving plots or losing roads, structures or money.
  if(data.tiles?.length===1600&&B.size!==40){
    const remap=n=>Number.isInteger(n)&&n>=0&&n<1600?Math.floor(n/40)*B.size+n%40:-1;
    const tiles=Array(B.layerOffset).fill('grass');for(let n=0;n<1600;n++)tiles[remap(n)]=data.tiles[n];
    data={...data,mapSize:B.size,tiles,tolls:data.tolls?.map(([n,t])=>[remap(n),{...t,...(t.alternativeBefore?{alternativeBefore:{...t.alternativeBefore,node:remap(t.alternativeBefore.node)}}:{})}]),signals:data.signals?.map(remap),flyovers:data.flyovers?.map(s=>({...s,nodes:s.nodes?.map(remap)})),bridges:data.bridges?.map(s=>({...s,nodes:s.nodes?.map(remap)}))};
  }
  if(data.worldMode==='planner'&&Array.isArray(data.tolls))data={...data,tolls:data.tolls.map(entry=>Array.isArray(entry)&&entry[1]&&Number.isInteger(entry[1].level)&&entry[1].level>=1&&entry[1].level<=5?[entry[0],{...entry[1],price:Math.min(entry[1].price,B.boothTollLimits[entry[1].level-1])}]:entry)};
  return updateRiver(data);
}
export function validateSave(data){
  if(!data||!Array.isArray(data.tiles)||data.tiles.length!==B.layerOffset||!Number.isFinite(data.coins)||data.coins<0||!Array.isArray(data.buildings))return false;
  const legal=new Set(['grass','river','road','bridge','building','mainRoad','roundabout']);
  const node=n=>Number.isInteger(n)&&n>=0&&n<B.layerOffset;
  if(data.trees!==undefined&&(!Array.isArray(data.trees)||data.trees.length>B.layerOffset||new Set(data.trees).size!==data.trees.length||data.trees.some(n=>!node(n)||data.tiles[n]!=='grass')))return false;
  if(data.tiles.some(t=>!legal.has(t))||data.buildings.some(b=>!b||!Number.isInteger(b.x)||!Number.isInteger(b.y)||b.x<0||b.y<0||b.x>=B.size||b.y>=B.size||!Number.isInteger(b.type)||b.type<0||b.type>5))return false;
  if(data.buildings.some(b=>b.level!==undefined&&(!Number.isInteger(b.level)||b.level<1||b.level>5)||b.paint!==undefined&&(!Number.isInteger(b.paint)||b.paint<0||b.paint>4)||b.variant!==undefined&&(!Number.isInteger(b.variant)||b.variant<0||b.variant>4)||b.investment!==undefined&&(!Number.isFinite(b.investment)||b.investment<0)))return false;
  if(data.buildings.some(b=>b.footprint!==undefined&&(![1,2,4].includes(b.footprint)||b.footprint===4&&(b.type!==3||b.x+4>B.size||b.y+4>B.size)||b.footprint===2&&(b.type!==2||b.x+2>B.size||b.y+2>B.size||!Number.isInteger(b.parkingCorner)||b.parkingCorner<0||b.parkingCorner>3))))return false;
  const occupied=new Set();for(const b of data.buildings)for(const n of plotCells(b)){if(occupied.has(n)||(b.footprint||1)>1&&data.tiles[n]!=='building')return false;occupied.add(n);}
  if(data.buildings.some(b=>b.project&&(!PROJECTS[b.project]||!Number.isInteger(b.projectStage)||b.projectStage<0||b.projectStage>2||!b.projectBaseline||!Number.isFinite(b.projectBaseline.trips)||!Number.isFinite(b.projectBaseline.served))))return false;
  const projects=data.buildings.filter(b=>b.project).map(b=>b.project);if(new Set(projects).size!==projects.length)return false;
  if(!Array.isArray(data.tolls)||data.tolls.some(entry=>!Array.isArray(entry)||!node(entry[0])||!entry[1]||!Number.isInteger(entry[1].price)||entry[1].price<0||entry[1].price>(data.worldMode==='planner'?B.boothTollLimits[entry[1].level-1]:B.maxToll)||!Number.isInteger(entry[1].level)||entry[1].level<1||entry[1].level>5))return false;
  for(const key of ['flyovers','bridges'])if(!Array.isArray(data[key])||data[key].some(s=>!Array.isArray(s.nodes)||s.nodes.length<3||s.nodes.some(n=>!node(n))||!Number.isFinite(s.cost)||s.cost<0))return false;
  if(!Array.isArray(data.signals)||data.signals.some(n=>!node(n)))return false;
  if(!data.upgrades||Object.values(data.upgrades).some(n=>!Number.isInteger(n)||n<0||n>B.upgradeMaxLevel))return false;
  if(!data.campaign||!Number.isFinite(data.campaign.xp)||data.campaign.xp<0||!Array.isArray(data.campaign.contracts)||!Number.isFinite(data.campaign.pendingOffline)||data.campaign.pendingOffline<0)return false;
  const campaign=data.campaign,keys=new Set(['served','earned','trips','roads','main','managed','buildingLevels','boothLevels']);
  for(const key of ['trips','contractSerial','claimed','eventRound','nextEvent','playTime'])if(!Number.isFinite(campaign[key])||campaign[key]<0)return false;
  if(campaign.contracts.length>3||campaign.contracts.some(c=>!c||!keys.has(c.key)||!Number.isInteger(c.id)||!Number.isFinite(c.target)||c.target<=0||!Number.isFinite(c.start)||!Number.isFinite(c.reward)||c.reward<0||!Number.isFinite(c.xp)||c.xp<0||typeof c.title!=='string'))return false;
  if(!campaign.districts||typeof campaign.districts!=='object'||Object.values(campaign.districts).some(v=>!Number.isInteger(v)||v<0||v>3)||!Array.isArray(campaign.achievements))return false;
  if(campaign.event&&(!['rush','rain','festival'].includes(campaign.event.kind)||!['offer','active','won','finished'].includes(campaign.event.status)||!Number.isFinite(campaign.event.reward)||campaign.event.reward<0))return false;
  if(campaign.event?.status==='active'&&(!Number.isFinite(campaign.event.endsAt)||!Number.isFinite(campaign.event.start)))return false;
  if(!data.settings||!Number.isFinite(data.simulationTime)||data.simulationTime<0)return false;
  return true;
}
export const storage={
  legacyBackup(){try{const data=migrate(JSON.parse(localStorage.getItem('toll-empire-v1')));return validateSave(data)?{...data,worldMode:'legacy'}:null;}catch{return null;}},
  load() {
    try {
      for(const key of [KEY,KEY+'-backup']){try{const data=migrate(JSON.parse(localStorage.getItem(key)));if(validateSave(data))return data;}catch{}}
      return null;
    } catch {return null;}
  },
  save(game) {
    try {const existing=localStorage.getItem(KEY);try{if(existing&&validateSave(migrate(JSON.parse(existing))))localStorage.setItem(KEY+'-backup',existing);}catch{}localStorage.setItem(KEY,JSON.stringify(serialize(game)));return true; } catch {return false;}
  },
};
