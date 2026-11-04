import {BUILDINGS} from './growth.js';
import {B} from './balance.js';
import {plannedPlot,plotCells,plotWidth,plotHeight} from './plots.js';
import {siteConnected} from './city-insights.js';
export function constructionQuote(g,n,tool,{start=null,bend=null,bent=false}={}){
 if(!Number.isInteger(n)||n<0||n>=B.layerOffset)return {valid:false,text:'Choose a tile inside the city.'};
 if(BUILDINGS[tool]){
   const plot=plannedPlot(n,tool,g.mode),clearing=plotCells(plot).reduce((s,a)=>s+g.treeRemovalCost(a),0),cost=BUILDINGS[tool].price+clearing,error=g.validateBuilding(n,tool,{clearTrees:true}),connected=siteConnected(g,plot);
   return {plot,cost,clearing,valid:!error,text:`${plotWidth(plot)} x ${plotHeight(plot)} tiles | $${cost} total${clearing?` ($${clearing} clearing)`:''} | ${error||(!connected?'Road needed before opening':clearing?'Ready: confirm clearing & build':'Ready to build')}`};
 }
 if(['flyover','bridge'].includes(tool)){
   if(start===null)return {valid:false,text:'Tap an existing road to start the crossing.'};
   if(bent&&bend===null)return {valid:false,text:'Tap an aligned bend tile, then choose the end.'};
   const plan=bent?(tool==='bridge'?g.planBentBridge(start,bend,n):g.planBentFlyover(start,bend,n)):g.planSpan(start,n,tool);
   return {...plan,valid:!plan.error,text:`${plan.nodes?plan.nodes.length+' tiles | ':''}${plan.cost!==undefined?'$'+plan.cost+' total | ':''}${plan.error||'Ready to connect'}`};
 }
 const error=tool==='clear-trees'?(g.trees.has(n)?g.coins<g.treeRemovalCost(n)?'Not enough coins to clear this plot.':null:'No trees on this tile.'):g.validate(n,tool),cost=tool==='clear-trees'?g.treeRemovalCost(n):g.buildCost(tool);
 return {cost,valid:!error,text:`1 tile | ${tool==='demolish'?'60% investment refund':'$'+cost+' per tile'} | ${error||'Ready'}${['road','main','clear-trees','demolish'].includes(tool)?' | Drag: one Undo for the stroke':''}`};
}
