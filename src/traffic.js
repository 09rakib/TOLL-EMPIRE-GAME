import {B} from './balance.js';
export function capacityFor(type,signal=false){
  return (type==='mainRoad'?B.mainCapacity:B.localCapacity)*(type==='roundabout'?B.roundaboutCapacity:signal?B.signalCapacity:1);
}
export function speedFactor(density,capacity,repair=0){
  return Math.max(B.minSpeedRatio,1/(1+B.bprA*(1-repair*B.repairReductionPerLevel)*Math.pow(density/capacity,B.bprB)));
}
export function congestion(ratio){return ratio>=B.jamRatio?'jammed':ratio>=B.busyRatio?'busy':'free';}
export function roadName(n){const y=Math.floor((n%B.layerOffset)/B.size),x=n%B.size;return n>=B.layerOffset?'Skyway':y===16?'Willow Boulevard':y===10?'Oak Avenue':y===22?'Market Street':x===22?'Riverside Drive':'Northwood Lane';}
