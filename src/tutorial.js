export const tutorialSteps=[
  {title:'Make your first connection',body:'Select Local road, then draw on grass beside an existing road. A single drag becomes one undoable action.',action:'Draw a road',tool:'road'},
  {title:'Open for business',body:'Place a toll booth on a busy road. Tap it to adjust the price: expensive tolls send some drivers to free routes.',action:'Place a toll',tool:'toll'},
  {title:'Give people somewhere to go',body:'Build a connected home, shop, office or park. Tap any building to develop it and choose its color.',action:'Build a neighborhood',tool:'city'},
  {title:'Your next opportunity',body:'Open the city board to claim contracts, grow districts and accept optional city events. There is always a next objective.',action:'Open the city board',tool:'board'},
];
export const plannerTutorialSteps=[
  {title:'Start with your first home',body:'Tap trees to see their clearing cost. Then buy a Home and place it on clear grass beside the road to bring residents and more traffic.',action:'Buy your first home',tool:'city'},
  {title:'Turn traffic into income',body:'Place a toll booth on the road. Passing vehicles pay you. More connected homes bring more traffic to your city.',action:'Place a toll booth',tool:'toll'},
  {title:'Create a destination',body:'Build an office, hospital, hotel or shop. Workers, patients and guests must arrive by road before you earn money.',action:'Build a business',tool:'city'},
  {title:'You are the city planner',body:'Grow your own roads and neighborhoods. Tap buildings and booths to preview upgrades: more capacity, better income and a new appearance.',action:'Open the city board',tool:'board'},
];
export function updateTutorial(game){
  const t=game.campaign.tutorial;if(!t||t.done)return;
  if(!Number.isInteger(t.step)||t.step<0)t.step=0;
  t.roadBaseline??=game.metrics().roads;
  while(t.step<tutorialSteps.length){const complete=(game.mode==='planner'?[game.homeLevels>0,game.tolls.size>0,game.commercialLevels>0,!!t.boardOpened]:[game.metrics().roads>t.roadBaseline,game.tolls.size>0,game.metrics().managed>0,!!t.boardOpened])[t.step];if(!complete)break;t.step++;}
  if(t.step>=tutorialSteps.length)t.done=true;
}
export function setupTutorial({getGame,chooseTool,openCityTools,openBoard,save}){
  const root=document.createElement('section');root.id='tutorial-card';root.setAttribute('aria-label','Getting started');root.innerHTML='<button class="tutorial-skip" aria-label="Skip getting started">Skip ×</button><span class="eyebrow">A LITTLE GUIDANCE</span><h3></h3><p></p><div><small></small><button class="tutorial-action"></button></div>';document.querySelector('#city').append(root);
  root.querySelector('.tutorial-skip').onclick=()=>{getGame().campaign.tutorial.done=true;save();update();};
  root.querySelector('.tutorial-action').onclick=()=>{const game=getGame(),step=(game.mode==='planner'?plannerTutorialSteps:tutorialSteps)[game.campaign.tutorial.step];if(step.tool==='city')openCityTools();else if(step.tool==='board'){game.campaign.tutorial.boardOpened=true;openBoard();}else chooseTool(step.tool);save();update();};
  function update(){
    const game=getGame();updateTutorial(game);const t=game.campaign.tutorial;
    for(const b of document.querySelectorAll('.tutorial-target'))b.classList.remove('tutorial-target');
    const blocked=!document.querySelector('#modal').hidden||!document.querySelector('#build-guide').hidden||['road-panel','building-panel','build-sheet','shop-sheet','operations-sheet','custom-sheet','tree-panel'].some(id=>!document.getElementById(id).hidden);
    root.hidden=!t||t.done||blocked;if(!t||t.done)return;
    const step=(game.mode==='planner'?plannerTutorialSteps:tutorialSteps)[t.step];root.querySelector('h3').textContent=step.title;root.querySelector('p').textContent=step.body;root.querySelector('small').textContent=`${t.step+1} / ${tutorialSteps.length}`;root.querySelector('.tutorial-action').textContent=step.action+' ↗';
    const target=step.tool==='city'?'#more-tools':step.tool==='board'?'#city-board':`[data-tool="${step.tool}"]`;document.querySelector(target)?.classList.add('tutorial-target');
  }
  function replay(){getGame().campaign.tutorial={step:0,done:false,roadBaseline:getGame().metrics().roads};save();update();}
  return {update,replay};
}
