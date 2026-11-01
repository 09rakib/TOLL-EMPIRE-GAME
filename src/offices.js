import {parkingBay,parkingCapacity} from './campus-art.js';
import {plotPerimeter,plotWidth,plotHeight} from './plots.js';
import {B} from './balance.js';
import {id,point} from './world.js';
export const hasParking=b=>b?.kind==='parking'||b?.kind==='garage-home'||b?.type===2&&b?.footprint===2;
export function parkingCell(b){if(b.kind==='garage-home')return {x:b.x+1,y:b.y};const corner=b.parkingCorner??2;return {x:b.x+([1,2].includes(corner)?1:0),y:b.y+(corner>=2?1:0)};}
export function parkingRoads(b){if(b.kind==='parking')return plotPerimeter(b);const p=parkingCell(b),candidates=[[p.x-1,p.y],[p.x+1,p.y],[p.x,p.y-1],[p.x,p.y+1]];return candidates.filter(([x,y])=>x>=0&&y>=0&&x<B.size&&y<B.size&&!(x>=b.x&&x<b.x+(b.width||2)&&y>=b.y&&y<b.y+(b.height||2))).map(([x,y])=>id(x,y));}
export function chooseParkingCorner(plot,connected){for(const corner of [2,3,1,0]){const candidate={...plot,parkingCorner:corner};if(parkingRoads(candidate).some(n=>connected.has(n)))return corner;}return 2;}
export function driveway(b,entrance,slot){
  if(b.kind==='parking'){const t=B.tile,r=point(entrance),x=b.x*t,y=b.y*t,p=parkingBay(b,slot);const gate=[Math.max(x+8,Math.min(x+216,(r.x+.5)*t)),Math.max(y+8,Math.min(y+216,(r.y+.5)*t))];return [gate,[x+8,gate[1]],[x+8,p.y+30],[p.x,p.y+30],[p.x,p.y]];}
  if(!hasParking(b)){const t=B.tile,w=plotWidth(b)*t,h=plotHeight(b)*t,x=b.x*t,y=b.y*t,r=point(entrance),u=w*(slot===0?.4:.67),v=h>t?h*.84:h-4,gate=[Math.max(x+5,Math.min(x+w-5,(r.x+.5)*t)),Math.max(y+5,Math.min(y+h-5,(r.y+.5)*t))];return [gate,[x+5,gate[1]],[x+5,y+h-3],[x+u,y+h-3],[x+u,y+v]];}
  const t=B.tile,p=parkingCell(b),r=point(entrance),x=p.x*t,y=p.y*t,u=slot===0?16:35;
  let gate,aisle;if(r.x<p.x){gate=[x+2,y+45];aisle=[x+5,y+45];}else if(r.x>p.x){gate=[x+t-2,y+45];aisle=[x+50,y+45];}else if(r.y<p.y){gate=[x+50,y+2];aisle=[x+50,y+45];}else{gate=[x+50,y+t-2];aisle=[x+50,y+45];}
  return [gate,aisle,[x+u,y+45],[x+u,y+23]];
}
export const officeMethods={
  beginOfficeParking(car){const b=this.buildingAt(car.targetBuilding);if(!b?.managed||b.type===3||!(hasParking(b)?parkingRoads(b):plotPerimeter(b)).includes(car.destination))return false;car.parkingOffice=id(b.x,b.y);car.parkingSlot=null;car.parkingPhase='waiting';car.parkingPaid=false;car.parkingSite={...b};return true;},
  updateOfficeParking(car,dt){
    const live=this.buildingAt(car.parkingOffice),b=live||car.parkingSite;if(!b){car.stranded=true;return;}
    car.age+=dt;const entrance=this.buildingEntrance(b);if(!live){car.parkingPaid=true;car.parkUntil=0;}
    if(car.parkingPhase==='waiting'){
      if(entrance===null||!this.graph.has(car.destination))return;
      const occupied=new Set(this.cars.filter(c=>c!==car&&!c.done&&c.parkingOffice===car.parkingOffice&&Number.isInteger(c.parkingSlot)).map(c=>c.parkingSlot));
      const slot=Array.from({length:b.kind==='parking'?parkingCapacity(b):2},(_,i)=>i).find(s=>!occupied.has(s));if(slot===undefined)return;
      car.parkingSlot=slot;car.parkingPhase='entering';car.parkingPath=[[car.worldX*B.tile,car.worldY*B.tile],...driveway(b,car.destination,slot)];car.parkingIndex=0;car.parkingDistance=0;
    }
    if(car.parkingPhase==='parked'){
      if(entrance===null)return;
      car.destination=entrance;
      if((b.type===0||['police','university'].includes(b.kind))&&!car.parkingPaid){car.parkingPaid=true;car.parkUntil=this.time+14+this.random()*8;}
      if(!car.parkingPaid&&this.time>=(this.admissionNext.get(car.parkingOffice)||0)){const paid=this.settleVisit(car);if(paid>0){car.parkingPaid=true;car.parkUntil=this.time+14+this.random()*8;}}
      if(!car.parkingPaid||this.time<car.parkUntil)return;
      const p=point(entrance);car.parkingPhase='leaving';car.parkingPath=[...driveway(b,entrance,car.parkingSlot)].reverse();car.parkingPath.push([(p.x+.5)*B.tile,(p.y+.5)*B.tile]);car.parkingIndex=0;car.parkingDistance=0;
    }
    let remaining=dt*B.tile*.65;
    while(remaining>0&&car.parkingIndex<car.parkingPath.length-1){const a=car.parkingPath[car.parkingIndex],p=car.parkingPath[car.parkingIndex+1],distance=Math.hypot(p[0]-a[0],p[1]-a[1]);if(distance<.01){car.parkingIndex++;continue;}const step=Math.min(remaining,distance-car.parkingDistance);car.parkingDistance+=step;remaining-=step;const f=car.parkingDistance/distance;car.worldX=(a[0]+(p[0]-a[0])*f)/B.tile;car.worldY=(a[1]+(p[1]-a[1])*f)/B.tile;car.angle=Math.atan2(p[1]-a[1],p[0]-a[0]);if(car.parkingDistance>=distance-.001){car.parkingIndex++;car.parkingDistance=0;}}
    if(car.parkingIndex>=car.parkingPath.length-1){
      if(car.parkingPhase==='entering'){car.parkingPhase='parked';car.angle=-Math.PI/2;this.campaign.trips++;this.campaign.xp+=B.xpPerTrip;}
      else if(car.parkingPhase==='leaving'){const destination=this.graph.has(car.origin)?car.origin:this.endpoints.find(n=>this.graph.has(n)&&n!==entrance),route=this.route(entrance,destination,car.vot);car.parkingPhase=null;car.parkingSlot=null;car.targetBuilding=null;car.heading=null;car.blocked=false;car.exiting=false;if(!route||route.length<2){car.stranded=true;car.route=[entrance];car.index=0;car.progress=0;return;}car.route=route;car.index=0;car.progress=0;car.destination=destination;car.revision=this.revision;}
    }
  },
};
