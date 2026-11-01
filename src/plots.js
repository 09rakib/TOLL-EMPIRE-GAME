import {B} from './balance.js';
import {id} from './world.js';
export const plotSize=b=>b.footprint||1;
export const plotWidth=b=>b.width||plotSize(b);
export const plotHeight=b=>b.height||plotSize(b);
export function plotCells(b){const cells=[];for(let y=b.y;y<b.y+plotHeight(b);y++)for(let x=b.x;x<b.x+plotWidth(b);x++)cells.push(id(x,y));return cells;}
export function plotPerimeter(b){const cells=new Set(plotCells(b)),edge=new Set();for(const n of cells){const x=n%B.size,y=Math.floor(n/B.size);for(const [a,c]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(a>=0&&c>=0&&a<B.size&&c<B.size&&!cells.has(id(a,c)))edge.add(id(a,c));}return [...edge];}
export function plannedPlot(n,kind,mode='planner'){return { ...(kind==='garage-home'&&mode==='planner'?{width:2,height:1}:{}),x:n%B.size,y:Math.floor(n/B.size),footprint:mode==='planner'?(kind==='park'?4:kind==='office'?2:1):1};}
