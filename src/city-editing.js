import {B} from './balance.js';
import {plotCells,plotWidth,plotHeight,plotPerimeter} from './plots.js';
import {hasParking,parkingRoads} from './offices.js';
export const DECORATIONS={bench:{name:'Bench',price:20},flowerbed:{name:'Flower bed',price:35},fountain:{name:'Fountain plaza',price:80}};
export function rotatedSite(b){const rotation=((b.rotation||0)+1)%4;return {...b,rotation,...(b.kind==='garage-home'?{width:rotation%2?1:2,height:rotation%2?2:1}:{}),...(b.type===2&&b.footprint===2?{parkingCorner:((b.parkingCorner??2)+1)%4}:{})};}
export function orientRect(b,x,y,w,h){const W=(b.kind==='garage-home'?2:plotWidth(b))*B.tile,H=(b.kind==='garage-home'?1:plotHeight(b))*B.tile;switch(b.rotation||0){case 1:return {x:H-y-h,y:x,w:h,h:w};case 2:return {x:W-x-w,y:H-y-h,w,h};case 3:return {x:y,y:W-x-w,w:h,h:w};default:return {x,y,w,h};}}
export const editingMethods={
 buildingInUse(b){const node=b.y*B.size+b.x;return this.cars.some(c=>!c.done&&(c.targetBuilding===node||c.parkingOffice===node&&c.parkingPhase))||this.walkers.some(w=>w.park===node);},
 validateSiteEdit(b,site,cost){
   if(!b?.managed||b.project)return 'Select a player-built property; landmarks stay in place.';
   if(this.buildingInUse(b))return 'Wait for approaching and visiting vehicles or pedestrians to leave before moving or rotating this property.';
   if(site.x<0||site.y<0||site.x+plotWidth(site)>B.size||site.y+plotHeight(site)>B.size)return 'Keep the full property inside the city.';
   const original=new Set(plotCells(b)),cells=plotCells(site);
   if(cells.some(n=>!original.has(n)&&this.tiles[n]!=='grass'))return 'The complete destination must be empty land.';
   if(cells.some(n=>this.trees.has(n)))return 'Clear destination trees before moving here.';
   if(this.flyovers.some(s=>[...s.nodes,...(s.rampClearance||[])].some(n=>cells.includes(n))))return 'Keep the flyover corridor clear.';
   if(site.footprint!==4&&!(hasParking(site)?parkingRoads(site):plotPerimeter(site)).some(n=>this.cityConnected.has(n)))return 'The new entrance needs a connected city road.';
   if(this.coins<cost)return `You need ${cost} coins.`;return null;
 },
 validateMove(from,to){const b=this.buildingAt(from);if(!b||!Number.isInteger(to)||to<0||to>=B.layerOffset)return 'Choose a property and destination inside the city.';if(to===b.y*B.size+b.x)return 'Choose a different destination.';return this.validateSiteEdit(b,{...b,x:to%B.size,y:Math.floor(to/B.size)},50);},
 transformBuilding(from,site,cost){
   const b=this.buildingAt(from),error=this.validateSiteEdit(b,site,cost);if(error)return error;
   const origin=b.y*B.size+b.x,destination=site.y*B.size+site.x,before=this.actionSnapshot();before.transformedBuilding={from:origin,to:destination};
   for(const n of plotCells(b))this.tiles[n]='grass';Object.assign(b,site);for(const n of plotCells(b))this.tiles[n]='building';this.coins-=cost;
   const admission=this.admissionNext.get(origin);this.admissionNext.delete(origin);if(admission!==undefined)this.admissionNext.set(destination,admission);
   this.record(before);this.rebuild();return null;
 },
 moveBuilding(from,to){const error=this.validateMove(from,to);if(error)return error;const b=this.buildingAt(from);return this.transformBuilding(from,{...b,x:to%B.size,y:Math.floor(to/B.size)},50);},
 rotateBuilding(n){const b=this.buildingAt(n);if(!b)return 'Choose a building.';return this.transformBuilding(n,rotatedSite(b),25);},
 validateDecoration(n,kind){if(!DECORATIONS[kind]||!Number.isInteger(n)||n<0||n>=B.layerOffset)return 'Choose a decoration and city tile.';if(this.tiles[n]!=='grass')return 'Decorations need empty grass.';if(this.trees.has(n))return 'Clear the trees first.';if(this.flyovers.some(s=>[...s.nodes,...(s.rampClearance||[])].includes(n)))return 'Keep the flyover corridor clear.';if(this.coins<DECORATIONS[kind].price)return 'Not enough coins for this decoration.';return null;},
 buildDecoration(n,kind){const error=this.validateDecoration(n,kind);if(error)return error;const before=this.actionSnapshot();this.tiles[n]='decoration';this.decorations.push({node:n,kind,investment:DECORATIONS[kind].price});this.coins-=DECORATIONS[kind].price;this.record(before);this.rebuild();return null;},
};
