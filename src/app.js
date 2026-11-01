import {B} from './balance.js';
import {isRoad,point} from './world.js';
import {Simulation,upgradeTypes} from './simulation.js';
import {Renderer} from './renderer.js';
import {storage} from './storage.js';
import {hydrateIcons} from './icons.js';
import {catalog} from './catalog.js';
import {roadName} from './traffic.js';
import {setupCityUI} from './city-ui.js';
import {traceTiles} from './brush.js';
import {setupTutorial} from './tutorial.js';
import {PROJECTS} from './projects.js';
import {drawUpgradeComparison} from './architecture.js';
import {plotCells,plannedPlot} from './plots.js';
const $=s=>document.querySelector(s);
// Keep secondary actions in the build menu instead of over the city.
for(const [id,icon,label]of [['undo','undo','Undo'],['shop','star','City upgrades'],['city-board','flag','City development'],['customize','paint','Customize'],['heatmap','layers','Traffic view']]){
  const button=$('#'+id);button.removeAttribute('data-icon');button.innerHTML=`<span data-icon="${icon}"></span><span>${label}</span>`;$('#menu-actions').append(button);
}
const showGoal=document.createElement('button');showGoal.id='show-objective';showGoal.innerHTML='<span data-icon="flag"></span><span>Show objective</span>';$('#menu-actions').append(showGoal);
hydrateIcons();
const treesPanel=document.createElement('aside');treesPanel.id='tree-panel';treesPanel.className='panel';treesPanel.hidden=true;treesPanel.setAttribute('aria-label','Clear wooded plot');treesPanel.innerHTML='<button class="panel-close" id="close-trees" aria-label="Close tree details">×</button><span class="eyebrow">PREPARE YOUR LAND</span><h2>Wooded plot</h2><div class="tree-illustration" data-icon="tree"></div><p id="tree-info"></p><p class="tree-note">Clearing is required before building roads, homes, hospitals or hotels here. The land stays clear after saving.</p><button class="primary" id="clear-plot"></button>';
$('#city').append(treesPanel);hydrateIcons();
let treeNode=null,resumeAfterClear=null,treeArea=[];
let game=new Simulation(storage.load());
const renderer=new Renderer($('#map'),$('#mini'),game);renderer.center();
let tool=null,selected=null,spanStart=null,spanBend=null,bentFlyover=false,last=performance.now(),accumulator=0,saveClock=0,uiClock=0,toastTimer,resetPending=false,category='city',sliderBaseline=null,cityUI=null,saveTimer=null,manualPaused=false,playSpeed=1,tutorial=null;
const money=n=>Math.floor(n).toLocaleString('en-US'),time=n=>n?`${n.toFixed(1)}s`:'—';
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function save(){clearTimeout(saveTimer);saveTimer=null;const ok=storage.save(game);$('#save-label').textContent=ok?'Progress autosaved':'Storage unavailable';return ok;}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(save,350);}
function changed(){renderer.dirty=true;scheduleSave();updateUI();}
function closeSheets(){for(const id of ['build-sheet','shop-sheet','operations-sheet','custom-sheet','building-panel','tree-panel'])$('#'+id).hidden=true;}
function chooseTool(next){
  finishStroke(false);
  tool=tool===next?null:next;spanStart=null;spanBend=null;renderer.ghost=null;renderer.spanPreview=null;closePanel();closeSheets();
  for(const b of document.querySelectorAll('[data-tool]')){b.classList.toggle('active',b.dataset.tool===tool);b.setAttribute('aria-pressed',String(b.dataset.tool===tool));}
  $('#build-guide').hidden=!tool;$('#hint').hidden=!!tool||renderer.heat;
  const item=catalog.find(i=>i.id===tool);
  $('#build-instruction').textContent=tool==='park'?'City Park · 4 × 4 tiles · Road connection can come later':tool==='office'?'L-Office · 2 × 2 tiles · 3 building tiles + parking':item?item.name:'';
  $('#map').style.cursor=tool?'crosshair':'grab';$('#flyover-bend').hidden=tool!=='flyover';$('#flyover-bend').textContent=bentFlyover?'Bend: ON':'Add bend';
  tutorial?.update();
}
function closePanel(){selected=null;renderer.selected=null;$('#road-panel').hidden=true;}
function openTrees(n,resume=null){
  const cells=['park','office'].includes(resume)?plotCells(plannedPlot(n,resume,game.mode)):[n];
  if(!cells.some(a=>game.trees.has(a)))return;if(tool)chooseTool(null);closePanel();closeSheets();treeNode=n;treeArea=cells;resumeAfterClear=resume;renderer.selected=n;$('#tree-panel').hidden=false;updateTrees();
}
function updateTrees(){if($('#tree-panel').hidden||treeNode===null)return;const kind=resumeAfterClear,site=['park','office'].includes(kind),name=kind==='office'?'L-Office':'City Park',clearing=treeArea.reduce((sum,n)=>sum+game.treeRemovalCost(n),0),price=kind==='office'?B.officePrice:B.parkPrice,cost=clearing+(site?price:0),count=treeArea.reduce((sum,n)=>sum+game.treeCount(n),0);$('#tree-info').textContent=count+' trees · $'+clearing+' clearing'+(site?' + $'+price+' '+name+' · '+treeArea.length+' tiles':'');$('#tree-panel h2').textContent=site?'Build '+name:'Wooded plot';$('#tree-panel .tree-note').textContent=site?'This payment clears the full footprint and builds immediately. The office includes working parking.':'Clear these trees before placing roads or buildings. The land stays clear after saving.';$('#clear-plot').textContent=(site?'Clear & build '+(kind==='office'?'office':'park')+' · $':'Clear plot · $')+cost;$('#clear-plot').disabled=game.coins<cost;}
$('#close-trees').onclick=()=>{$('#tree-panel').hidden=true;renderer.selected=null;treeNode=null;};
$('#clear-plot').onclick=()=>{const site=['park','office'].includes(resumeAfterClear),node=treeNode,error=site?game.buildBuilding(node,resumeAfterClear,{clearTrees:true}):game.clearTreeArea(treeArea);if(error){toast(error);return;}const next=resumeAfterClear;treeNode=null;closeSheets();renderer.selected=null;if(site){revealBuilding(node);return;}changed();if(next)chooseTool(next);toast('Land cleared. Ready to build. Undo is available in Build menu.');};
function revealBuilding(node){chooseTool(null);const b=game.buildingAt(node);if(b)renderer.focusBuilding(b);changed();toast(b?.type===2?'L-Office built · 3 building tiles + 1 working parking tile.':'City Park built · 16 tiles. Connect a city road for visitors.');}
function openPanel(n){
  if(!isRoad(game.tiles[n]))return;
  if(tool)chooseTool(null);closeSheets();selected=n;renderer.selected=n;$('#road-panel').hidden=false;
  $('#road-panel').scrollTop=0;$('#road-name').textContent=roadName(n);updatePanel();
}
function updatePanel(){
  if(selected===null)return;
  if(!isRoad(game.tiles[selected])){closePanel();return;}
  const booth=game.tolls.get(selected),stats=game.stats(selected),type=game.tiles[selected],condition=game.congestionAt(selected);
  $('#toll-controls').hidden=!booth;$('#remove-toll').hidden=!booth;$('#panel-action').hidden=!!booth;
  $('#upgrade-booth').hidden=!booth;$('#comparison').hidden=!booth;$('#booth-detail').hidden=!booth;
  $('#booth-upgrade-preview').hidden=!booth||game.mode!=='planner';$('#toll-upgrade-preview').hidden=!booth||game.mode!=='planner';
  $('#road-description').textContent=booth?'Your toll. Their choice. Find the sweet spot.':'A new opportunity, one road at a time.';
  $('#road-type').textContent=type==='mainRoad'?'Main road · 4 lanes':type==='roundabout'?'Roundabout · improved flow':type==='bridge'?'Bridge · river crossing':'Local road · 2 lanes';
  if(game.signals.has(selected))$('#road-type').textContent+=' · signal';
  $('#road-condition').textContent={free:'● Free flowing',busy:'▨ Busy',jammed:'▧ Jammed'}[condition];$('#road-condition').dataset.state=condition;
  $('#road-cars').textContent=stats.cars;$('#road-income').textContent=money(stats.income);$('#road-time').textContent=time(stats.avgTime);
  if(booth){
    $('#toll-slider').max=game.tollLimit(booth);$('#toll-slider').value=booth.price;$('#toll-value').textContent=booth.price;$('#road-level').textContent=String(booth.level).padStart(2,'0');
    $('#booth-capacity').textContent=Math.round(game.boothCapacity(selected));$('#booth-queue').textContent=game.queueLength(selected);
    $('#booth-upgrade-preview').hidden=game.mode!=='planner';
    const limit=game.tollLimit(booth);$('#toll-slider').max=limit;$('#toll-limit-label').textContent=`${limit} coins max · Level ${booth.level}`;
    $('#toll-plus').disabled=booth.price>=limit;$('#toll-minus').disabled=booth.price<=0;
    $('#booth-upgrade-preview').textContent=`Level ${booth.level}: up to $${limit} per vehicle.${booth.level<5?` Upgrade unlocks $${game.mode==='planner'?B.boothTollLimits[booth.level]:B.maxToll}, raises the rate and increases service capacity.`:' Maximum booth level.'} You receive exactly the posted charge.`;
    $('#toll-upgrade-preview').hidden=game.mode!=='planner';if(game.mode==='planner')drawUpgradeComparison($('#toll-upgrade-preview'),booth,true);
    const before=booth.baseline||{cars:0,avgTime:0,income:0};
    $('#compare-cars').textContent=`${before.cars} → ${stats.cars} (${stats.cars-before.cars>=0?'+':''}${stats.cars-before.cars})`;
    $('#compare-time').textContent=`${time(before.avgTime)} → ${time(stats.avgTime)}`;
    $('#compare-income').textContent=`${money(before.income)} → ${money(stats.income)} (${stats.income-before.income>=0?'+':''}${stats.income-before.income})`;
    const cost=B.boothUpgradePrices[booth.level-1];
    $('#upgrade-booth').textContent=booth.level>=5?'Booth fully upgraded · Level 5':`Upgrade to level ${booth.level+1} · ${cost} coins ↗`;
    $('#upgrade-booth').disabled=booth.level>=5||game.coins<cost;
    const refund=Math.round((B.tollPrice+B.boothUpgradePrices.slice(0,booth.level-1).reduce((s,v)=>s+v,0))*B.refund);
    $('#remove-toll').textContent=`Remove booth · refund ${refund} coins`;
  }
  $('#remove-road').textContent='Remove road + fixtures · $ '+money(Math.round(game.roadRemovalCost(selected)*B.refund))+' refund';$('#remove-road').disabled=game.endpoints.includes(selected)||game.tiles[selected]==='bridge'||game.flyovers.some(s=>s.nodes.includes(selected))||game.bridges.some(s=>s.nodes.includes(selected));
  $('#panel-action').disabled=game.coins<B.tollPrice||game.tolls.size>=B.maxBooths;
  const samples=game.tracker.history.get(selected)||[],max=Math.max(1,...samples.map(s=>s.cars));
  const coordinates=samples.map((s,i)=>`${samples.length===1?0:i/(samples.length-1)*280},${64-s.cars/max*54}`);
  if(coordinates.length===1)coordinates.push(`280,${64-samples[0].cars/max*54}`);
  const path=coordinates.length?'M'+coordinates.join(' L'):'';
  $('#chart-line').setAttribute('d',path);$('#chart-area').setAttribute('d',path?path+' L280,70 L0,70 Z':'');
  $('#chart-start').textContent=samples.length?`${Math.round((game.time-samples[0].time)/60*10)/10} min ago`:'Samples begin after 5s';
  const alternative=game.alternativeStats(selected),old=booth?.alternativeBefore;
  if(alternative){const delta=old&&old.node===alternative.node?alternative.cars-old.cars:null;$('#alternative').textContent=`Alternative · ${roadName(alternative.node)}: ${alternative.cars} cars/min${delta===null?'':` (${delta>=0?'+':''}${delta} since toll change)`}`;}else $('#alternative').textContent='Build another connection to give drivers more route choices.';
  $('#insight-text').textContent=booth?(game.queueLength(selected)>2?'A queue is forming. Upgrade booth capacity or give drivers another route.':booth.price>=20?'Drivers can avoid premium tolls when you build a free alternative route.':booth.price===0?'A free ride! Traffic returns, but your booth earns no coins.':`Set a rate up to ${game.tollLimit(booth)} at this level. Compare actual traffic and revenue.`):'Place a booth on a busy road. More lanes and better intersections can keep traffic moving.';
}
function itemUnavailable(item){if(item.minLevel&&game.cityLevel<item.minLevel)return `City level ${item.minLevel} required`;if(PROJECTS[item.id]&&game.buildings.some(b=>b.project===item.id))return 'Already in your city';if(item.cost>game.coins)return 'Not enough coins';return '';}
function renderBuildMenu(){
  for(const t of document.querySelectorAll('[data-category]')){t.classList.toggle('active',t.dataset.category===category);t.setAttribute('aria-selected',String(t.dataset.category===category));}
  $('#build-grid').innerHTML=catalog.filter(item=>item.category===category&&(!item.legacyOnly||game.mode!=='planner')&&(!item.plannerOnly||game.mode==='planner')).map(item=>{
    const reason=itemUnavailable(item);
    return `<button class="build-card${reason?' unaffordable':''}" data-pick-tool="${item.id}" ${reason?'disabled':''}><span class="card-icon" data-icon="${item.icon}"></span><strong>${item.name}</strong><small>${item.hint}</small><b>${item.cost?`$ ${item.cost} <em>${item.unit}</em>`:item.unit}</b><span class="afford-label" ${reason?'':'hidden'}>${reason}</span></button>`;
  }).join('');
  hydrateIcons();
  for(const b of document.querySelectorAll('[data-pick-tool]'))b.onclick=()=>chooseTool(b.dataset.pickTool);
}
function renderShop(){
  $('#upgrade-list').innerHTML=Object.entries(upgradeTypes).map(([key,item])=>{
    const level=game.upgrades[key],max=level>=B.upgradeMaxLevel,cost=game.upgradeCost(key);
    return `<article class="upgrade-item"><span class="card-icon" data-icon="${item.icon}"></span><div><strong>${item.name}</strong><small>${item.description}</small><span class="level-pips" aria-label="Level ${level} of 5">${Array.from({length:5},(_,i)=>`<i class="${i<level?'filled':''}"></i>`).join('')}</span></div><button data-upgrade="${key}" aria-label="Upgrade ${item.name}${max?' · max level':` · ${cost} coins`}" ${item.locked||max||game.coins<cost?'disabled':''}>${item.locked?'Phase 3':max?'MAX':`$ ${cost}`}</button></article>`;
  }).join('');hydrateIcons();
  for(const b of document.querySelectorAll('[data-upgrade]'))b.onclick=()=>{const type=b.dataset.upgrade,error=game.buyUpgrade(type);if(error)toast(error);else{changed();renderShop();toast(`${upgradeTypes[type].name} upgraded to level ${game.upgrades[type]}.`);}};
}
function updateUI(){
  $('#coins').textContent=money(game.coins);$('#income').textContent=money(game.totalIncome);
  $('#traffic-count').textContent=`${game.cars.length} cars on the road`;
  $('#zoom-label').textContent=`${Math.round(renderer.camera.zoom*100)}%`;
  $('#running-status').textContent=game.paused?'City paused':'All systems go';$('#undo').disabled=!game.undoStack.length;
  if(!$('#shop-sheet').hidden)for(const button of document.querySelectorAll('[data-upgrade]')){const key=button.dataset.upgrade;button.disabled=upgradeTypes[key].locked||game.upgrades[key]>=B.upgradeMaxLevel||game.coins<game.upgradeCost(key);}
  if(!$('#build-sheet').hidden)for(const button of document.querySelectorAll('[data-pick-tool]')){const reason=itemUnavailable(catalog.find(i=>i.id===button.dataset.pickTool));button.disabled=!!reason;button.classList.toggle('unaffordable',!!reason);button.querySelector('.afford-label').hidden=!reason;button.querySelector('.afford-label').textContent=reason;}
  updatePanel();updateTrees();cityUI?.update();tutorial?.update();
}
function build(n,quiet=false){
  if(n<0)return;
  if(tool==='flyover'||tool==='bridge'){
    if(spanStart===null){if(!isRoad(game.tiles[n])){toast('Start the span on an existing road.');return;}spanStart=n;renderer.selected=n;$('#build-instruction').textContent=tool==='flyover'?(bentFlyover?'Flyover · Tap an aligned clear tile for the bend.':'Flyover · Tap an aligned road for the second ramp.'):'Bridge · Tap the opposite bank in this row or column.';return;}
    if(n===spanStart){const current=tool;chooseTool(null);chooseTool(current);return;}
    if(tool==='flyover'&&bentFlyover&&spanBend===null){const a=point(spanStart),b=point(n);if((a.x!==b.x&&a.y!==b.y)||!['grass','road','mainRoad','roundabout'].includes(game.tiles[n])||game.trees.has(n)){toast('Choose a clear bend tile aligned with the first ramp.');return;}spanBend=n;renderer.selected=n;$('#build-instruction').textContent='Flyover · Tap the exit road aligned with this bend.';return;}
    const error=tool==='flyover'&&bentFlyover?game.buildBentFlyover(spanStart,spanBend,n):game.buildSpan(spanStart,n,tool);if(error){toast(error);return;}
    const label=tool;chooseTool(null);changed();toast(`${label==='flyover'?'Flyover':'Bridge'} connected. New routes are open!`);return;
  }
  if(tool==='toll'&&game.tolls.has(n)){openPanel(n);return;}
  if(tool==='clear-trees'&&game.trees.has(n)){openTrees(n,'clear-trees');return false;}
  const currentTool=tool,error=game.build(n,tool);
  if(error){const wooded=['park','office'].includes(currentTool)?error.startsWith('Clear the trees'):game.trees.has(n)&&currentTool!=='demolish';if(wooded){if(!quiet)openTrees(n,currentTool);else toast('Clear these trees before building here. Tap them to see the cost.');}else if(!quiet)toast(error);return false;}
  if(['park','office'].includes(currentTool)){revealBuilding(n);return true;}
  changed();
  cityUI?.audio.play(game.settings.sound,'build');
  if(currentTool==='toll'){chooseTool(null);openPanel(n);toast('Open for business! Adjust the toll and watch drivers adapt.');}
  if(PROJECTS[currentTool]){chooseTool(null);cityUI.openBuilding(n);toast('Foundation started. Complete the objectives to develop this landmark.');}
  return true;
}
const canvas=$('#map'),pointers=new Map();let gesture=null,lastBuilt=-1,pinch=null;
function finishStroke(report=true){const stroke=game.endStroke();if(report&&stroke?.actions>1){const delta=stroke.entry.cashDelta;toast(`${stroke.actions} changes · ${delta<0?money(-delta)+' coins spent':money(delta)+' coins refunded'} · Undo reverses this whole stroke.`);}}
function paintTo(node){
  if(node<0||!gesture)return;
  for(const tile of traceTiles(lastBuilt<0?node:lastBuilt,node)){
    if(gesture.visited.has(tile))continue;gesture.visited.add(tile);
    if(tool==='demolish'){const span=game.flyovers.find(s=>s.nodes.includes(tile))||game.bridges.find(s=>s.nodes.includes(tile));if(span)for(const n of span.nodes)gesture.visited.add(n);}
    build(tile,true);
  }
  lastBuilt=node;
}
function local(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;const p=local(e);canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,p);
  renderer.dragging=true;renderer.velocityX=0;renderer.velocityY=0;
  if(pointers.size===2){finishStroke(false);const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y)};if(gesture){gesture.moved=true;gesture.wasPinch=true;}return;}
  gesture={...p,startX:p.x,startY:p.y,moved:false,wasPinch:false,visited:new Set()};lastBuilt=renderer.tileAt(p.x,p.y);
  if(['road','main','demolish'].includes(tool))game.beginStroke(tool);
});
canvas.addEventListener('pointermove',e=>{
  const p=local(e),n=renderer.tileAt(p.x,p.y);
  if(tool&&n>=0){
    const span=tool==='flyover'||tool==='bridge';
    const bent=tool==='flyover'&&bentFlyover;const plan=bent&&spanBend!==null?game.planBentFlyover(spanStart,spanBend,n):game.planSpan(spanStart??n,n,tool);
    renderer.ghost={node:n,footprint:plannedPlot(n,tool,game.mode).footprint,valid:span?spanStart===null?isRoad(game.tiles[n]):bent&&spanBend===null?(point(spanStart).x===point(n).x||point(spanStart).y===point(n).y)&&!game.trees.has(n):!plan.error:!game.validate(n,tool)};
    if(span&&spanStart!==null)renderer.spanPreview=bent&&spanBend===null?null:plan;
  }
  if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,p);
  if(pointers.size>=2){const [a,b]=[...pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y);if(pinch&&pinch.distance>0)renderer.zoom((dist/pinch.distance-1)*renderer.camera.zoom,(a.x+b.x)/2,(a.y+b.y)/2,true);pinch={distance:dist};if(gesture){gesture.moved=true;gesture.wasPinch=true;}return;}
  if(!gesture||gesture.wasPinch)return;
  const dx=p.x-gesture.x,dy=p.y-gesture.y;
  if(Math.hypot(p.x-gesture.startX,p.y-gesture.startY)>5)gesture.moved=true;
  if(gesture.moved){if(['road','main','demolish'].includes(tool)){if(n!==lastBuilt)paintTo(n);}else if(!tool||tool==='flyover'||tool==='bridge'){renderer.camera.x-=dx/renderer.camera.zoom;renderer.camera.y-=dy/renderer.camera.zoom;renderer.velocityX=-dx/renderer.camera.zoom*30;renderer.velocityY=-dy/renderer.camera.zoom*30;renderer.clamp();}}
  gesture.x=p.x;gesture.y=p.y;
});
canvas.addEventListener('pointerup',e=>{
  const p=local(e);pointers.delete(e.pointerId);
  if(gesture&&!gesture.moved&&!gesture.wasPinch){const n=renderer.tileAt(p.x,p.y);if(n>=0&&game.tiles[n]==='building'&&tool!=='demolish'){if(tool)chooseTool(null);cityUI.openBuilding(n);}else if(tool)build(n);else if(n>=0&&game.trees.has(n))openTrees(n);else if(n>=0&&isRoad(game.tiles[n]))openPanel(n);else if(n>=0&&game.tiles[n]==='building')cityUI.openBuilding(n);else{closePanel();closeSheets();renderer.selected=null;}}
  if(gesture?.moved&&!gesture.wasPinch&&['road','main','demolish'].includes(tool))paintTo(renderer.tileAt(p.x,p.y));
  if(!pointers.size){finishStroke();gesture=null;pinch=null;renderer.dragging=false;}else if(gesture)gesture.wasPinch=true;
});
canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);finishStroke(false);gesture=null;pinch=null;renderer.dragging=false;renderer.velocityX=0;renderer.velocityY=0;});
canvas.addEventListener('pointerleave',()=>{renderer.ghost=null;renderer.spanPreview=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();const p=local(e);renderer.zoom(-Math.sign(e.deltaY)*.08,p.x,p.y);},{passive:false});
$('#zoom-in').onclick=()=>renderer.zoom(B.zoomStep);$('#zoom-out').onclick=()=>renderer.zoom(-B.zoomStep);$('#center').onclick=()=>renderer.center();
$('#heatmap').onclick=()=>{$('#build-sheet').hidden=true;renderer.heat=!renderer.heat;$('#heatmap').classList.toggle('active',renderer.heat);$('#heatmap').setAttribute('aria-pressed',String(renderer.heat));$('#heat-legend').hidden=!renderer.heat;$('#hint').hidden=renderer.heat||!!tool;toast(renderer.heat?'Traffic view: ● free · ▨ busy · ▧ jammed. Striped tiles show congestion.':'Back to city view.');};
for(const button of document.querySelectorAll('[data-tool]'))button.onclick=()=>chooseTool(button.dataset.tool);
for(const button of document.querySelectorAll('[data-direct-build]'))button.onclick=()=>chooseTool(button.dataset.directBuild);
$('#flyover-bend').onclick=()=>{bentFlyover=!bentFlyover;spanStart=null;spanBend=null;renderer.spanPreview=null;$('#flyover-bend').textContent=bentFlyover?'Bend: ON':'Add bend';$('#build-instruction').textContent=bentFlyover?'Flyover · Choose start road, bend tile, then exit road.':'Flyover · Choose two aligned roads.';};
$('#cancel-build').onclick=()=>chooseTool(null);$('#close-panel').onclick=closePanel;
$('#more-tools').onclick=()=>{const open=$('#build-sheet').hidden;if(tool)chooseTool(null);closePanel();closeSheets();$('#build-sheet').hidden=!open;if(open)renderBuildMenu();};
$('#close-build').onclick=()=>$('#build-sheet').hidden=true;
$('#dismiss-goal').onclick=()=>{game.settings.hideGoal=true;changed();};
$('#show-objective').onclick=()=>{game.settings.hideGoal=false;$('#build-sheet').hidden=true;changed();};
for(const tab of document.querySelectorAll('[data-category]'))tab.onclick=()=>{category=tab.dataset.category;for(const t of document.querySelectorAll('[data-category]')){t.classList.toggle('active',t===tab);t.setAttribute('aria-selected',String(t===tab));}renderBuildMenu();};
$('#shop').onclick=()=>{const open=$('#shop-sheet').hidden;if(tool)chooseTool(null);closePanel();closeSheets();$('#shop-sheet').hidden=!open;if(open)renderShop();};
$('#close-shop').onclick=()=>$('#shop-sheet').hidden=true;
function undo(){const error=game.undo();if(error)toast(error);else{closeSheets();closePanel();spanStart=null;renderer.spanPreview=null;renderer.selected=null;changed();toast('Last construction undone. Toll earnings are preserved.');}}
$('#undo').onclick=undo;
function changePrice(price){if(selected===null)return;game.setToll(selected,price);if(sliderBaseline){const t=game.tolls.get(selected);t.baseline=sliderBaseline.baseline;t.alternativeBefore=sliderBaseline.alternativeBefore;}scheduleSave();updatePanel();}
$('#toll-slider').onpointerdown=()=>{if(selected!==null)sliderBaseline={baseline:game.stats(selected),alternativeBefore:game.alternativeStats(selected)};};
$('#toll-slider').oninput=e=>changePrice(+e.target.value);
$('#toll-slider').onchange=()=>sliderBaseline=null;$('#toll-slider').onpointercancel=()=>sliderBaseline=null;
$('#toll-minus').onclick=()=>changePrice((game.tolls.get(selected)?.price||0)-1);$('#toll-plus').onclick=()=>changePrice((game.tolls.get(selected)?.price||0)+1);
$('#panel-action').onclick=()=>{if(selected===null)return;const error=game.build(selected,'toll');if(error)toast(error);else{changed();toast('Another booth is open. Find its sweet spot.');}};
$('#upgrade-booth').onclick=()=>{const error=game.upgradeBooth(selected);if(error)toast(error);else{changed();toast(`Booth upgraded · ${game.tolls.get(selected).price} per vehicle.`);}};
$('#remove-road').onclick=()=>{const error=game.removeRoad(selected);if(error)toast(error);else{closePanel();changed();toast('Road removed. Nearby buildings need another road connection.');}};
$('#remove-toll').onclick=()=>{const error=game.removeToll(selected);if(error)toast(error);else{changed();toast('Booth removed. 60% of its investment returned.');}};
$('#mini').style.cursor='pointer';$('#mini').onclick=e=>{const r=e.target.getBoundingClientRect();renderer.camera.x=(e.clientX-r.left)/r.width*B.size*B.tile;renderer.camera.y=(e.clientY-r.top)/r.height*B.size*B.tile;renderer.clamp();};
function configurePlannerUI(){
  const planner=game.mode==='planner';
  for(const [id,p,l]of [['quick-development',{tool:'home',name:'Home',price:'120 · residents',icon:'home'},{tool:'flyover',name:'Flyover',price:'90 / tile',icon:'flyover'}],['quick-office',{tool:'office',name:'Office',price:'400 · visit income',icon:'office'},{tool:'bridge',name:'Bridge',price:'100 / water tile',icon:'bridge'}]]){const button=$('#'+id),item=planner?p:l;button.dataset.tool=item.tool;button.innerHTML=`<span class="tool-icon" data-icon="${item.icon}"></span><span>${item.name}<small>$ ${item.price}</small></span>`;}
  document.querySelector('[data-category="projects"]').hidden=planner;hydrateIcons();
}
function menu(open){$('#modal').hidden=!open;game.paused=open||manualPaused;resetPending=false;$('#reset').textContent='Start a new city';closeSheets();save();updateUI();}
$('#menu').onclick=()=>menu(true);$('.brand').onclick=e=>{e.preventDefault();menu(true);};$('#resume').onclick=()=>menu(false);
$('#help').onclick=()=>{menu(false);chooseTool(null);tutorial.replay();toast('A short hands-on guide. Skip it whenever you like.');};
$('#reset').onclick=()=>{
  if(!resetPending){resetPending=true;$('#reset').textContent='Confirm: erase progress and start fresh?';return;}
  game=new Simulation();renderer.game=game;renderer.dirty=true;renderer.center();configurePlannerUI();closePanel();chooseTool(null);menu(false);save();toast('Empty land, one road. Build your own city.');
};
document.addEventListener('keydown',e=>{
  if(e.target.matches('input,select,textarea'))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo();return;}
  if(e.key==='Escape'){if(!$('#modal').hidden)menu(false);else{chooseTool(null);closePanel();closeSheets();}}
  if(e.key==='1')chooseTool('road');if(e.key==='2')chooseTool('toll');if(e.key==='3')chooseTool('main');if(e.key==='+'||e.key==='=')renderer.zoom(B.zoomStep);if(e.key==='-')renderer.zoom(-B.zoomStep);
  if(e.key.toLowerCase()==='b')cityUI.openBoard();if(e.key.toLowerCase()==='c')cityUI.openCustom();if(e.code==='Space'&&!e.target.matches('button')){e.preventDefault();$('#pause-city').click();}
});
window.addEventListener('resize',()=>renderer.resize());window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{save();last=performance.now();accumulator=0;});
function frame(now){const delta=document.hidden?0:Math.min((now-last)/1000,.15);last=now;if(!document.hidden){renderer.updateCamera(delta);accumulator+=delta*playSpeed;let steps=0;while(accumulator>=B.fixedStep&&steps<B.maxFrameSteps){game.update(B.fixedStep);accumulator-=B.fixedStep;steps++;}if(steps>=B.maxFrameSteps)accumulator=Math.min(accumulator,B.fixedStep);renderer.draw(game.paused?1:accumulator/B.fixedStep);uiClock+=delta;saveClock+=delta;if(uiClock>.3){updateUI();uiClock=0;}if(saveClock>B.saveSeconds){save();saveClock=0;}}requestAnimationFrame(frame);}
cityUI=setupCityUI({getGame:()=>game,renderer,changed,toast,closeAll:()=>{if(tool)chooseTool(null);closePanel();closeSheets();renderer.selected=null;},replaceGame:data=>{game=new Simulation(data);renderer.game=game;renderer.dirty=true;configurePlannerUI();renderer.resize();renderer.center();save();updateUI();}});
tutorial=setupTutorial({getGame:()=>game,chooseTool,openCityTools:()=>{chooseTool(null);$('#build-sheet').hidden=false;category='city';for(const t of document.querySelectorAll('[data-category]')){t.classList.toggle('active',t.dataset.category===category);t.setAttribute('aria-selected',String(t.dataset.category===category));}renderBuildMenu();},openBoard:()=>cityUI.openBoard(),save:scheduleSave});
$('#pause-city').onclick=()=>{manualPaused=!manualPaused;game.paused=manualPaused||!$('#modal').hidden;$('#pause-city').textContent=manualPaused?'▶':'Ⅱ';$('#pause-city').setAttribute('aria-label',manualPaused?'Resume city':'Pause city');updateUI();};
for(const button of document.querySelectorAll('[data-speed]'))button.onclick=()=>{playSpeed=+button.dataset.speed;for(const b of document.querySelectorAll('[data-speed]'))b.classList.toggle('active',b===button);};
configurePlannerUI();
const previousCity=storage.legacyBackup();if(previousCity){const button=document.createElement('button');button.className='text-button';button.textContent='Download previous city backup';button.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(previousCity,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='toll-empire-previous-city.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('.modal').append(button);}
save();
updateUI();if(game.campaign.pendingOffline>0)menu(true);requestAnimationFrame(frame);
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
