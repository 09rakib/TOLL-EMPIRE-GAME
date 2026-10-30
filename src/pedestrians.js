import {B} from './balance.js';
import {point,isRoad} from './world.js';
import {plotSize} from './plots.js';
export function sidewalkPoints(nodes){
  const points=[];
  for(let i=0;i<nodes.length-1;i++){
    const a=point(nodes[i]),b=point(nodes[i+1]),dx=b.x-a.x,dy=b.y-a.y;
    const from=[(a.x+.5)*B.tile-dy*23,(a.y+.5)*B.tile+dx*23],to=[(b.x+.5)*B.tile-dy*23,(b.y+.5)*B.tile+dx*23];
    if(points.length){const last=points.at(-1),cx=(a.x+.5)*B.tile,cy=(a.y+.5)*B.tile;points.push([last[0]+from[0]-cx,last[1]+from[1]-cy]);}
    points.push(from,to);
  }
  return points;
}
function parkAccess(b,entrance){
  const p=point(entrance),t=B.tile,s=plotSize(b)*t,x=b.x*t,y=b.y*t,cx=x+s/2,cy=y+s/2,margin=Math.min(28,s/4),d=Math.min(24,s/5),k=d*.71;
  if(p.x<b.x)return [[x+5,(p.y+.5)*t],[x+margin,(p.y+.5)*t],[x+margin,cy],[cx-d,cy],[cx-k,cy+k],[cx,cy+d]];
  if(p.x>=b.x+plotSize(b))return [[x+s-5,(p.y+.5)*t],[x+s-margin,(p.y+.5)*t],[x+s-margin,cy],[cx+d,cy],[cx+k,cy+k],[cx,cy+d]];
  if(p.y<b.y)return [[(p.x+.5)*t,y+5],[(p.x+.5)*t,y+margin],[cx,y+margin],[cx,cy-d],[cx+k,cy-k],[cx+d,cy],[cx+k,cy+k],[cx,cy+d]];
  return [[(p.x+.5)*t,y+s-5],[(p.x+.5)*t,y+s-margin],[cx,y+s-margin],[cx,cy+d]];
}
function parkLoop(b){const t=B.tile,s=plotSize(b)*t,x=b.x*t,y=b.y*t,m=Math.min(28,s/4),cx=x+s/2,cy=y+s/2,d=Math.min(24,s/5);return [[cx,cy+d],[cx,y+s-m],[x+s-m,y+s-m],[x+s-m,y+m],[x+m,y+m],[x+m,y+s-m],[cx,y+s-m],[cx,cy+d]];}
export const pedestrianMethods={
  walkRoute(start,end){
    const queue=[start],previous=new Map([[start,null]]);
    for(let i=0;i<queue.length;i++){const n=queue[i];if(n===end){const route=[];for(let p=end;p!==null;p=previous.get(p))route.unshift(p);return route;}
      for(const a of this.graph.get(n)||[])if(a<B.layerOffset&&isRoad(this.tiles[a])&&!previous.has(a)){previous.set(a,n);queue.push(a);}}
    return null;
  },
  spawnWalker(streetOnly=false){
    if(this.mode!=='planner'||this.walkers.length>=(this.settings.lowPower?20:Math.min(48,8+this.homeLevels*2+this.parkDestinations.length*10)))return false;
    const site=!streetOnly&&this.parkDestinations.length&&this.random()<.8?this.parkDestinations[Math.floor(this.random()*this.parkDestinations.length)]:null;
    const sources=this.homeDestinations.length?this.homeDestinations:this.endpoints;
    let start=streetOnly?this.endpoints[0]:sources[Math.floor(this.random()*sources.length)],end=site?.node??this.endpoints[start===this.endpoints[0]?1:0];
    if(start===end)start=this.endpoints.find(n=>n!==end)??start;
    const nodes=this.walkRoute(start,end);if(!nodes||nodes.length<2)return false;
    const path=sidewalkPoints(nodes),park=site?this.buildingAt(site.building):null;if(park)path.push(...parkAccess(park,site.node));
    this.walkers.push({path,nodes,index:0,distance:0,x:path[0][0],y:path[0][1],speed:24+this.random()*10,stage:park?'arriving':'street',park:site?.building??null,inbound:path,phase:this.random()*6.28,color:['#e4a354','#b56668','#4f8d9f','#eee5cc','#7c6694'][Math.floor(this.random()*5)]});return true;
  },
  updateWalkers(dt){
    if(this.mode!=='planner')return;this.walkClock+=dt;
    if(this.walkClock>2){this.walkClock=0;this.spawnWalker();}
    for(let i=this.walkers.length-1;i>=0;i--){const w=this.walkers[i],park=w.park===null?null:this.buildingAt(w.park);
      if(w.nodes.some(n=>!this.graph.has(n))||(w.park!==null&&(!park||this.buildingEntrance(park)===null))){this.walkers.splice(i,1);continue;}
      let remaining=w.speed*dt;
      while(remaining>0&&w.index<w.path.length-1){const a=w.path[w.index],b=w.path[w.index+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        if(length<.01){w.index++;w.distance=0;continue;}const step=Math.min(remaining,length-w.distance);w.distance+=step;remaining-=step;
        const progress=w.distance/length;w.x=a[0]+(b[0]-a[0])*progress;w.y=a[1]+(b[1]-a[1])*progress;w.angle=Math.atan2(b[1]-a[1],b[0]-a[0]);w.phase+=step*.22;
        if(w.distance>=length-.001){w.index++;w.distance=0;}
      }
      if(w.index>=w.path.length-1){
        if(w.stage==='arriving'){park.visitors=(park.visitors||0)+1;park.walkingVisits=(park.walkingVisits||0)+1;w.stage='visiting';w.path=parkLoop(park);w.index=0;w.distance=0;}
        else if(w.stage==='visiting'){w.stage='returning';w.path=[...w.inbound].reverse();w.index=0;w.distance=0;}
        else this.walkers.splice(i,1);
      }
    }
  },
};
