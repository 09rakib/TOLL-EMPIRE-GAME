import {B} from './balance.js';
import {THEMES,POLICIES,DISTRICTS,ACHIEVEMENTS,xpThreshold,contractProgress,districtFor,createSettings} from './campaign.js';
import {BUILDINGS} from './growth.js';
import {serialize,migrate,validateSave} from './storage.js';
import {hydrateIcons} from './icons.js';
import {AudioBus} from './audio.js';
import {PROJECTS,projectStatus} from './projects.js';
import {visitFee,visitCapacity,architectureTier} from './planner.js';
import {drawUpgradeComparison} from './architecture.js';
const $=s=>document.querySelector(s),fmt=n=>Math.floor(n).toLocaleString('en-US');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function setupCityUI({getGame,renderer,changed,toast,closeAll,replaceGame}){
  let boardTab='contracts',boardSignature='',buildingNode=null,imported=null;
  const audio=new AudioBus();
  function action(fn,message){const game=getGame(),error=fn(game);if(error){toast(error);return;}audio.play(game.settings.sound,'reward');changed();if(message)toast(message);renderBoard();updateBuilding();}
  function openBoard(){closeAll();if(getGame().campaign.tutorial)getGame().campaign.tutorial.boardOpened=true;$('#operations-sheet').hidden=false;$('#operations-sheet').scrollTop=0;boardSignature='';renderBoard();}
  function renderBoard(){
    if($('#operations-sheet').hidden)return;
    const game=getGame(),level=game.cityLevel,xp=game.campaign.xp,low=xpThreshold(level),high=xpThreshold(level+1);
    $('#career-summary').innerHTML=`<div><span class="career-level">${level}</span><div><strong>City level ${level}</strong><small>${fmt(xp-low)} / ${fmt(high-low)} XP to the next level</small></div><span>${game.campaign.claimed} contracts<br>completed</span></div><div class="progress-track"><i style="width:${Math.min(100,(xp-low)/(high-low)*100)}%"></i></div>`;
    const signature=JSON.stringify([boardTab,game.campaign.contracts.map(c=>c.id),game.campaign.districts,game.campaign.achievements,game.campaign.event?.status,game.campaign.event?.kind,level]);
    if(signature!==boardSignature){
      boardSignature=signature;
      for(const t of document.querySelectorAll('[data-board-tab]'))t.classList.toggle('active',t.dataset.boardTab===boardTab);
      if(boardTab==='contracts'){
        $('#board-content').innerHTML=`<p class="board-intro">Three opportunities at a time. Claim a reward to reveal a new contract. Swap any objective to suit your city.</p><div class="contract-list">${game.campaign.contracts.map(c=>`<article class="contract-card" data-contract="${c.id}"><span class="contract-symbol" data-icon="${c.key==='earned'?'toll':c.key==='trips'?'car':c.key==='managed'||c.key==='buildingLevels'?'home':'road'}"></span><div><strong>${escape(c.title)}</strong><small class="contract-count"></small><div class="progress-track"><i></i></div><span class="contract-reward">$ ${fmt(c.reward)} <b>+${c.xp} XP</b></span></div><div class="contract-actions"><button data-claim="${c.id}">In progress</button><button class="swap-contract" data-swap="${c.id}" aria-label="Swap ${escape(c.title)}">Swap ↻</button></div></article>`).join('')}</div><div class="event-card" id="event-card"></div>`;
        for(const b of document.querySelectorAll('[data-claim]'))b.onclick=()=>action(g=>g.claimContract(+b.dataset.claim),'Contract complete. A fresh opportunity is ready!');
        for(const b of document.querySelectorAll('[data-swap]'))b.onclick=()=>action(g=>g.swapContract(+b.dataset.swap));
      }else if(boardTab==='districts'){
        $('#board-content').innerHTML=`<p class="board-intro">Develop a connected building in each district, then invest. Each rank adds 6% city demand and 5% business income. Three ranks per district.</p><div class="district-list">${DISTRICTS.map(d=>{const rank=game.campaign.districts[d.id]||0;return `<article class="district-card"><button class="district-pin" data-focus-district="${d.id}" aria-label="Find ${d.name}"><span data-icon="locate"></span></button><div><strong>${d.name}</strong><small>${d.subtitle}</small><span class="district-rank">${'◆'.repeat(rank)}${'◇'.repeat(3-rank)} <b>${level<d.level?`City level ${d.level} needed`:`Rank ${rank} / 3`}</b></span></div><button data-district="${d.id}" ${level<d.level||rank>=3?'disabled':''}>${rank>=3?'Developed':`$ ${fmt(game.districtCost(d.id))}`}</button></article>`;}).join('')}</div>`;
        for(const b of document.querySelectorAll('[data-district]'))b.onclick=()=>action(g=>g.developDistrict(b.dataset.district),'District investment complete. Your city has more room to grow.');
        for(const b of document.querySelectorAll('[data-focus-district]'))b.onclick=()=>{const d=DISTRICTS.find(d=>d.id===b.dataset.focusDistrict);renderer.camera.x=d.x*B.tile;renderer.camera.y=d.y*B.tile;renderer.velocityX=0;renderer.velocityY=0;renderer.districtView=true;renderer.clamp();closeAll();toast(`${d.name}: build or upgrade a connected building here, then invest in the district.`);};
      }else{
        $('#board-content').innerHTML=`<p class="board-intro">A record of the city you are building. Each milestone can be collected once.</p>${ACHIEVEMENTS.map(a=>`<article class="milestone-card" data-achievement-card="${a.id}"><span class="contract-symbol" data-icon="star"></span><div><strong>${a.name}</strong><small></small></div><button data-achievement="${a.id}">$ ${fmt(a.reward)}</button></article>`).join('')}`;
        for(const b of document.querySelectorAll('[data-achievement]'))b.onclick=()=>action(g=>g.claimAchievement(b.dataset.achievement),'Milestone collected. Look how far your city has come.');
      }
      hydrateIcons();
    }
    updateBoardProgress();
  }
  function updateBoardProgress(){
    const game=getGame(),metrics=game.metrics();
    for(const row of document.querySelectorAll('[data-contract]')){
      const c=game.campaign.contracts.find(c=>c.id===+row.dataset.contract);if(!c)continue;
      const current=contractProgress(game,c),ready=current>=c.target;
      row.querySelector('.contract-count').textContent=`${fmt(current)} / ${fmt(c.target)}`;row.querySelector('.progress-track i').style.width=`${current/c.target*100}%`;
      row.querySelector('[data-claim]').disabled=!ready;row.querySelector('[data-claim]').textContent=ready?'Claim reward ↗':'In progress';row.classList.toggle('ready',ready);
    }
    for(const row of document.querySelectorAll('[data-achievement-card]')){const a=ACHIEVEMENTS.find(a=>a.id===row.dataset.achievementCard),claimed=game.campaign.achievements.includes(a.id),button=row.querySelector('button');row.querySelector('small').textContent=`${fmt(Math.min(a.target,metrics[a.key]))} / ${fmt(a.target)}`;button.disabled=claimed||metrics[a.key]<a.target;button.textContent=claimed?'Collected':`$ ${fmt(a.reward)}`;}
    const card=$('#event-card');if(!card)return;
    const event=game.campaign.event,spec=game.eventSpec();
    if(!event){card.innerHTML=`<span class="eyebrow">CITY EVENTS</span><h3>A new challenge on the horizon.</h3><p>Next invitation in ${Math.max(0,Math.ceil(game.campaign.nextEvent-game.time))} simulation seconds. Events are optional, with no penalty for declining.</p>`;return;}
    const status=event.status,active=status==='active';
    const eventKey=`${event.kind}:${status}`;
    if(card.dataset.eventKey!==eventKey){card.dataset.eventKey=eventKey;card.innerHTML=`<span class="eyebrow">${status==='offer'?'YOU ARE INVITED':active?'CITY EVENT IN PROGRESS':status==='won'?'CHALLENGE COMPLETE':'THANKS FOR TAKING PART'}</span><h3>${spec.name}</h3><p>${spec.description}</p><strong id="event-progress"></strong><div>${status==='offer'?'<button class="primary" id="accept-event">Take the challenge ↗</button><button class="text-button" id="finish-event">Maybe next time</button>':active?'':`<button class="primary" id="finish-event">${status==='won'?`Collect $ ${fmt(event.reward)} +80 XP`:'Back to my city'} ↗</button>`}</div>`;if($('#accept-event'))$('#accept-event').onclick=()=>action(g=>g.acceptEvent(),'Event started. Keep your city moving!');if($('#finish-event'))$('#finish-event').onclick=()=>action(g=>g.finishEvent());}
    if($('#event-progress'))$('#event-progress').textContent=active?`${fmt(game.eventProgress())} / ${spec.target} ${spec.key==='trips'?'trips':'coins'} · ${Math.max(0,Math.ceil(event.endsAt-game.time))}s remaining`:status==='offer'?`Reward: $ ${fmt(event.reward)} +80 XP`:'';
  }
  function openBuilding(node){closeAll();buildingNode=node;renderer.selected=node;$('#building-panel').hidden=false;$('#building-panel').scrollTop=0;updateBuilding();}
  function updateBuilding(){
    if($('#building-panel').hidden||buildingNode===null)return;
    const game=getGame(),b=game.buildingAt(buildingNode);if(!b){$('#building-panel').hidden=true;return;}
    const spec=BUILDINGS[b.kind]||Object.values(BUILDINGS).find(s=>s.type===b.type),connected=game.buildingEntrance(b)!==null,level=b.level||1,cost=game.buildingUpgradeCost(b),district=districtFor(b);
    $('#building-description').textContent=`${district?.name||'City outskirts'} · ${connected?'Road connection ready':'Road connection needed'}`;
    if(b.project){
      const project=PROJECTS[b.project],status=projectStatus(game,b);
      $('#building-name').textContent=project.name;
      $('#building-stat').innerHTML=`<span>STAGE ${b.projectStage+1} / 3 · ${['FOUNDATION','CONSTRUCTION','OPERATIONAL'][b.projectStage]}</span><strong>${status.complete?'Open to the city':'A landmark in the making'}</strong><p>${status.complete?'Benefits: ':'On completion: '}${project.benefit}${status.complete&&!connected?' · Benefits paused until reconnected.':''}</p>${status.requirements.map(r=>`<div class="project-requirement"><span>${r.label}</span><b>${fmt(Math.min(r.value,r.target))} / ${fmt(r.target)}</b></div>`).join('')}`;
      $('#upgrade-building').textContent=status.complete?'Landmark complete':`${b.projectStage===0?'Build structure':'Open landmark'} · $ ${fmt(status.cost)} ↗`;
      $('#upgrade-building').disabled=status.complete||!status.ready||game.coins<status.cost||!connected;
    }else{
    $('#building-name').textContent=`${spec.name} · Level ${level}`;
    if(game.mode==='planner'){
      const fee=visitFee(b),capacity=visitCapacity(b),recent=game.businessTracker.stats(buildingNode,game.time),next={...b,level:Math.min(5,level+1)};
      const unit=b.type===4?'patient':b.type===5?'guest':b.type===2?'worker':'customer';
      $('#building-stat').innerHTML=`<span>${architectureTier(b).toUpperCase()}</span><strong>${b.type===0?`${connected?level*20:0} residents`:b.type===3?'Greener streets':`${fmt(fee)} coins / ${unit}`}</strong>${fee?`<div class="project-requirement"><span>Arrival capacity</span><b>${capacity} people / min</b></div><div class="project-requirement"><span>Visitors · last minute</span><b>${recent.cars}</b></div><div class="project-requirement"><span>Lifetime visits / income</span><b>${fmt(b.visitors||0)} / $ ${fmt(b.revenue||0)}</b></div><p>Income is paid only when visitors arrive by road.${!connected?' Road disconnected: no visits or income.':''}</p>`:`<p>${b.type===0?'Residents create more city trips. More homes mean a busier road network.':'Parks reduce congestion slowdown around your growing city.'}</p>`}${level<5?`<p class="next-upgrade"><b>Next: ${architectureTier(next)}</b><br>${fee?`Fee ${fmt(fee)} → ${fmt(visitFee(next))} · capacity ${capacity} → ${visitCapacity(next)}`:b.type===0?`Residents ${level*20} → ${(level+1)*20} · more traffic`:'Richer planting, more seating and park details'}</p>`:''}`;
    }else{
    $('#building-stat').innerHTML=`<span>${b.managed?'CITY DEVELOPMENT':'STARTER BUILDING'}</span><strong>${b.type===0?`${b.managed&&connected?level*20:0} residents`:b.type===3?'Greener streets':`${b.managed&&connected?fmt(B.buildingRevenue[b.type]*Math.pow(1.45,level-1)):0} coins / min`}</strong><p>${b.managed?'Keep upgrading to increase this building’s effect.':'Upgrade this starter building to activate its city benefits.'}</p>`;
    }
    $('#upgrade-building').textContent=level>=5?'Fully developed · Level 5':`Upgrade to level ${level+1} · $ ${fmt(cost)} ↗`;$('#upgrade-building').disabled=level>=5||game.coins<cost||!connected;
    }
    $('#remove-building').textContent=`Remove building · $ ${fmt((b.investment||0)*B.refund)} refund`;
    if(b.type===2&&b.footprint===2){const vehicles=game.cars.filter(c=>c.parkingOffice===b.y*B.size+b.x&&c.parkingPhase),parked=vehicles.filter(c=>c.parkingPhase==='parked').length;$('#building-description').textContent='2 × 2 L-Office · 3 office tiles + 1 parking tile · '+(connected?'Driveway connected':'Connect a road beside the parking corner');$('#building-stat').innerHTML+=`<div class="project-requirement"><span>Parked vehicles</span><b>${parked} / 2</b></div><p>Cars enter the parking lot, stop while workers visit, then drive back to the road. Income is credited after parking.</p>`;}
    if(b.kind==='parking'){$('#building-description').textContent='4 × 4 parking · cars stop, pay and return to the road';$('#building-stat').innerHTML+='<p>Parking bays: '+(4+2*(level-1))+'</p>';}
    if(b.footprint===4&&b.type===4)$('#building-description').textContent='4 × 4 Hospital · 16 tiles · '+(connected?'Patient access connected':'Road needed');
    if(['police','university'].includes(b.kind))$('#building-stat').innerHTML='<strong>Public service · Level '+level+'</strong><p>Road-connected services improve residents’ city satisfaction. Upgrade for wider coverage and a larger campus.</p>';
    if(b.type===3){$('#building-stat').innerHTML+='<div class="project-requirement"><span>Ticket / visitor</span><b>$ '+B.parkTicketFees[level-1]+'</b></div><div class="project-requirement"><span>Park earnings</span><b>$ '+fmt(b.revenue||0)+'</b></div>';$('#building-description').textContent=`${b.footprint===4?'4 × 4 City Park · 16 tiles':'Pocket park · 1 tile'} · ${connected?'Footpath entrance connected':'Waiting for a city road'}`;$('#building-stat').innerHTML+=`<div class="project-requirement"><span>Park visitors</span><b>${fmt(b.walkingVisits||0)}</b></div><p>${connected?'People walk here along the road footpaths, explore the park and walk back.':'Place a connected road next to any side to welcome visitors. An isolated road does not open the park.'}</p>`;}
    $('#building-upgrade-preview').hidden=game.mode!=='planner'||!!b.project;if(!$('#building-upgrade-preview').hidden)drawUpgradeComparison($('#building-upgrade-preview'),b);
    if(!$('#paint-palette').children.length){$('#paint-palette').innerHTML=['Original','Seafoam','Terracotta','Sandstone','Lavender'].map((name,i)=>`<button data-paint="${i}" aria-label="Paint building ${name}" title="${name}" style="--swatch:${['#bfa181','#7eaaa6','#bf8373','#bba273','#9d8fb0'][i]}"></button>`).join('');for(const button of document.querySelectorAll('[data-paint]'))button.onclick=()=>{getGame().paintBuilding(buildingNode,+button.dataset.paint);changed();updateBuilding();};}
    for(const button of document.querySelectorAll('[data-paint]'))button.setAttribute('aria-pressed',String(+button.dataset.paint===(b.paint||0)));
  }
  function openCustom(){
    closeAll();$('#custom-sheet').hidden=false;$('#custom-sheet').scrollTop=0;const game=getGame(),s=game.settings;
    $('#custom-content').innerHTML=`<label class="form-label">CITY NAME<input id="city-name-input" maxlength="24" value="${escape(s.cityName)}" autocomplete="off"></label><label class="form-label">LANDSCAPE<select id="theme-select">${Object.entries(THEMES).map(([key,t])=>`<option value="${key}" ${s.theme===key?'selected':''}>${t.name}</option>`).join('')}</select></label><label class="form-label">ROAD PALETTE<select id="road-select">${['slate','clay','midnight'].map(key=>`<option value="${key}" ${s.roadColor===key?'selected':''}>${key[0].toUpperCase()+key.slice(1)}</option>`).join('')}</select></label><div class="setting-toggles">${[['night','Evening lights'],['showLabels','Neighborhood labels'],['sound','Sound effects'],['lowPower','Low power mode · fewer cars, lower resolution']].map(([key,label])=>`<label><span>${label}</span><input type="checkbox" data-setting="${key}" ${s[key]?'checked':''}></label>`).join('')}</div><label class="form-label">CITY POLICY<select id="policy-select">${Object.entries(POLICIES).map(([key,p])=>`<option value="${key}" ${key===s.policy?'selected':''}>${p.name}</option>`).join('')}</select></label><p id="policy-description" class="board-intro">${POLICIES[s.policy].description}</p><div class="backup-actions"><button id="export-city" class="secondary">Download city backup ↓</button><label class="secondary import-label">Import a backup<input id="import-city" type="file" accept=".json,application/json" hidden></label><button id="confirm-import" class="primary" hidden>Replace current city with this backup?</button></div><p class="save-note">Everything stays on this device. Download a backup before moving to another browser.</p>`;
    $('#city-name-input').oninput=e=>{game.settings.cityName=e.target.value.trim().slice(0,24)||'Willow City';changed();};
    $('#theme-select').onchange=e=>{game.settings.theme=e.target.value;changed();};$('#road-select').onchange=e=>{game.settings.roadColor=e.target.value;changed();};
    for(const toggle of document.querySelectorAll('[data-setting]'))toggle.onchange=()=>{game.settings[toggle.dataset.setting]=toggle.checked;if(toggle.dataset.setting==='lowPower')renderer.resize();if(toggle.dataset.setting==='sound')audio.play(toggle.checked,'reward');changed();};
    $('#policy-select').onchange=e=>{game.setPolicy(e.target.value);$('#policy-description').textContent=POLICIES[e.target.value].description;changed();};
    $('#export-city').onclick=()=>{const blob=new Blob([JSON.stringify(serialize(game),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='toll-empire-city.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('City backup downloaded.');};
    $('#import-city').onchange=async e=>{try{const file=e.target.files[0];if(!file||file.size>2000000)throw Error();const data=migrate(JSON.parse(await file.text()));if(!validateSave(data))throw Error();imported=data;$('#confirm-import').hidden=false;toast('Backup checked. Confirm below to replace this city.');}catch{imported=null;$('#confirm-import').hidden=true;toast('That file is not a valid Toll Empire city backup.');}};
    $('#confirm-import').onclick=()=>{if(!imported)return;const data=imported;data.lastSaved=Date.now();data.incomePerMinute=0;data.campaign.pendingOffline=0;data.settings=createSettings(data.settings);replaceGame(data);closeAll();toast('Backup restored. Welcome home.');};
  }
  $('#upgrade-building').onclick=()=>action(g=>g.upgradeBuilding(buildingNode),getGame().buildingAt(buildingNode)?.project?'Project advanced. Your landmark is taking shape.':'Neighborhood upgraded.');
  $('#remove-building').onclick=()=>{const error=getGame().demolish(buildingNode);if(error)toast(error);else{closeAll();changed();toast('Building removed. Invested coins partially refunded.');}};
  $('#close-building').onclick=()=>{buildingNode=null;renderer.selected=null;$('#building-panel').hidden=true;};
  $('#city-board').onclick=openBoard;$('#city-level').onclick=openBoard;$('#mission-goal').onclick=openBoard;$('#close-operations').onclick=()=>$('#operations-sheet').hidden=true;
  for(const b of document.querySelectorAll('[data-board-tab]'))b.onclick=()=>{boardTab=b.dataset.boardTab;boardSignature='';renderBoard();};
  $('#customize').onclick=openCustom;$('#close-custom').onclick=()=>$('#custom-sheet').hidden=true;
  $('#welcome-offline').onclick=()=>{const amount=getGame().claimOffline();changed();toast(`Welcome back! ${fmt(amount)} offline coins collected.`);$('#welcome-offline').hidden=true;};
  function update(){
    const game=getGame(),s=game.settings;$('#city-title').textContent=s.cityName;$('#city-summary').textContent=`${game.population} residents · ${POLICIES[s.policy].name}`;$('#city-level').innerHTML=`LEVEL ${game.cityLevel} <span>↗</span>`;
    const c=game.campaign.contracts.find(c=>contractProgress(game,c)>=c.target)||game.campaign.contracts[0];
    $('#goal-text').textContent=c?c.title:'Your next big idea';$('#goal-count').textContent=c?`${fmt(contractProgress(game,c))} / ${fmt(c.target)}`:'↗';
    $('#mission-goal').classList.toggle('claim-ready',!!c&&contractProgress(game,c)>=c.target);
    $('#goal-banner').hidden=!!s.hideGoal;
    for(const label of document.querySelectorAll('.map-label'))label.hidden=!s.showLabels;
    $('#day').textContent=`DAY ${String(Math.floor(game.campaign.playTime/600)+1).padStart(2,'0')}`;
    $('#welcome-offline').hidden=!game.campaign.pendingOffline;$('#welcome-offline').textContent=`Collect ${fmt(game.campaign.pendingOffline)} offline coins`;
    if(!$('#operations-sheet').hidden)renderBoard();updateBuilding();
  }
  return {openBuilding,openBoard,openCustom,update,audio};
}
