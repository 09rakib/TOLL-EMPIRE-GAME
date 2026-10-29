import {B} from './balance.js';
export const PROJECTS={
  hospital:{name:'City Hospital',icon:'hospital',level:3,costs:[720,840,840],trips:80,served:40,development:3,metric:'managed',benefit:'20 coins/min + reduced congestion slowdown',income:20,repair:1},
  stadium:{name:'Willow Stadium',icon:'stadium',level:5,costs:[1500,1750,1750],trips:180,served:100,development:5,metric:'managed',benefit:'80 coins/min +20% traffic demand',income:80,demand:.2},
  transit:{name:'Transit Hub',icon:'transit',level:8,costs:[2400,2800,2800],trips:300,served:150,development:20,metric:'main',benefit:'+15% booth capacity +10% driving speed',income:0,capacity:.15,speed:.1},
};
export function projectStatus(game,b){
  const spec=PROJECTS[b.project],stage=b.projectStage||0,m=game.metrics(),baseline=b.projectBaseline||{};
  if(stage>=2)return {complete:true,ready:false,cost:0,requirements:[]};
  const requirements=stage===0?[{label:'New completed trips',value:Math.max(0,m.trips-(baseline.trips||0)),target:spec.trips}]:[{label:spec.metric==='main'?'Four-lane road tiles':'Developed buildings',value:m[spec.metric],target:spec.development},{label:'New toll customers',value:Math.max(0,m.served-(baseline.served||0)),target:spec.served}];
  return {complete:false,ready:requirements.every(r=>r.value>=r.target),cost:spec.costs[stage+1],requirements};
}
export const projectMethods={
  validateProject(n,kind){
    const spec=PROJECTS[kind];if(!spec)return 'Choose a city project.';
    if(this.cityLevel<spec.level)return `Reach city level ${spec.level} to start ${spec.name}.`;
    if(this.buildings.some(b=>b.project===kind))return `${spec.name} already has a site in your city.`;
    if(!Number.isInteger(n)||n<0||n>=B.layerOffset||this.tiles[n]!=='grass')return 'Place your project on empty grass.';
    if(!this.neighbors(n).some(a=>this.cityConnected.has(a)))return 'Connect this site to the city road network first.';
    if(this.flyovers.some(s=>s.nodes.includes(n)))return 'Keep the flyover corridor clear.';
    if(this.coins<spec.costs[0])return `The foundation costs ${spec.costs[0]} coins.`;
    return null;
  },
  buildProject(n,kind){
    const error=this.validateProject(n,kind);if(error)return error;
    const spec=PROJECTS[kind],before=this.snapshot();this.coins-=spec.costs[0];this.tiles[n]='building';
    this.buildings.push({x:n%B.size,y:Math.floor(n/B.size),type:2,variant:0,level:1,managed:true,paint:0,investment:spec.costs[0],project:kind,projectStage:0,projectBaseline:this.metrics()});
    this.record(before);this.rebuild();return null;
  },
  advanceProject(n){
    const b=this.buildingAt(n);if(!b?.project)return 'Select a city project.';
    if(this.buildingEntrance(b)===null)return 'Restore the project’s connection to the city first.';
    const status=projectStatus(this,b);if(status.complete)return 'This landmark is already operational.';
    if(!status.ready)return 'Complete this stage’s traffic and development objectives first.';
    if(this.coins<status.cost)return `The next stage costs ${status.cost} coins.`;
    const before=this.snapshot();this.coins-=status.cost;b.investment+=status.cost;b.projectStage++;b.projectBaseline=this.metrics();
    this.record(before);this.rebuild();return null;
  },
};
