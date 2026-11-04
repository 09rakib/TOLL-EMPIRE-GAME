export async function run(){
 const passed=[],assert=(value,label)=>{if(!value)throw Error(label);passed.push(label);};
 document.querySelector('#more-tools').click();document.querySelector('#heatmap').click();
 assert(!document.querySelector('#overlay-panel').hidden,'overlay menu opens');
 for(const mode of ['connections','traffic','clinic','police','university','school','park','parking','']){
   document.querySelector(`[data-overlay="${mode}"]`).click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   assert(document.querySelector(`[data-overlay="${mode}"]`).getAttribute('aria-pressed')==='true','overlay '+(mode||'normal')+' renders');
 }
 assert(document.documentElement.scrollWidth<=innerWidth,'portrait layout has no horizontal overflow');
 const {Simulation}=await import('/src/simulation.js'),{cityOverlay}=await import('/src/city-insights.js');
 const g=new Simulation();g.trees.clear();g.coins=100000;g.build(40*55+40,'clinic');
 assert(cityOverlay(g,'connections').markers.length===1,'isolated campus reports connection problem');
 document.querySelector('[data-tool="home"]').click();
 const canvas=document.querySelector('#map'),rect=canvas.getBoundingClientRect();canvas.dispatchEvent(new PointerEvent('pointermove',{clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2,pointerId:1,bubbles:true}));
 assert(/total/.test(document.querySelector('#construction-quote').textContent),'complete construction quote remains available to assistive technology');
 const guide=document.querySelector('#build-guide'),bar=document.querySelector('.buildbar').getBoundingClientRect(),done=document.querySelector('#cancel-build').getBoundingClientRect();
 assert(getComputedStyle(guide).display==='contents'&&guide.getClientRects().length===0,'construction popup has no box over the map');
 assert(done.top>=bar.top&&done.bottom<=bar.bottom&&done.height>=44,'Done stays inside the bottom toolbar with a usable touch target');
 assert(document.elementFromPoint(rect.left+rect.width/2,bar.top-40)===canvas,'map above the toolbar receives touches during construction');
 document.querySelector('#cancel-build').click();
 document.querySelector('#city-board').click();document.querySelector('[data-board-tab="neighborhoods"]').click();
 assert(document.querySelectorAll('[data-neighborhood]').length===5,'all five district goal cards render');
 assert(document.querySelector('[data-neighborhood="south"] button').disabled,'unfinished district reward cannot be claimed');
 document.querySelector('#close-operations').click();
 document.querySelector('#satisfaction').click();
 assert(/Business arrival bonus/.test(document.querySelector('#satisfaction-report').textContent),'mayor report explains bounded economy effects');
 document.querySelector('#close-satisfaction').click();
 document.querySelector('#more-tools').click();document.querySelector('#public-transport').click();
 assert(!document.querySelector('#transit-panel').hidden,'public transport panel opens');
 document.querySelector('#place-bus-stop').click();assert(!document.querySelector('#build-guide').hidden,'bus stop placement tool opens');document.querySelector('#cancel-build').click();
 const t=new Simulation();t.trees.clear();t.coins=100000;t.cars=[];t.spawn=()=>false;for(const n of [1112,1122]){t.build(n,'bus-stop');t.build(n,'uturn');}t.build(19*55+12,'home');t.build(19*55+22,'home');assert(t.createTransitLine([1112,1122])===null,'legal bus route can be opened');for(let i=0;i<1800;i++)t.update(1/30);assert(t.transit.passengers>0,'scheduled bus delivers passengers in browser');
 const {Renderer}=await import('/src/isometric-renderer.js');
 const artGame=new Simulation();artGame.trees.clear();artGame.coins=100000;artGame.cars=[];artGame.walkers=[];artGame.build(21*55+12,'garage-home');for(const [x,y]of [[11,21],[11,22],[12,23],[13,23],[14,22],[14,21]])artGame.build(y*55+x,'road');
 const surface=document.createElement('canvas');surface.style.cssText='width:390px;height:400px;position:fixed;left:0;top:200px;z-index:-1';document.body.append(surface);const mini=document.createElement('canvas'),art=new Renderer(surface,mini,artGame);
 for(let r=0;r<4;r++){art.dirty=true;art.camera.x=13*56;art.camera.y=22*56;art.draw(1);assert(artGame.rotateBuilding(21*55+12)===null,'rotated property geometry '+r+' renders');}
 for(const [i,kind]of ['bench','flowerbed','fountain'].entries())assert(artGame.build(25*55+12+i,kind)===null,'decoration '+kind+' builds');art.dirty=true;art.camera.zoom=2.5;art.camera.y=24*56;art.draw(1);assert(art.chunk(1,2).width===8*56*4,'maximum zoom uses 4x road cache');assert(art.treesArt[0].scale===4,'tree artwork retains 4x detail');assert(art.scene.filter(o=>o.kind==='decoration').length===3,'all decoration art renders');art.camera.zoom=.4;art.draw(1);assert(art.artScale===1&&art.chunk(1,2).width===8*56,'zoom out uses small terrain textures');assert(art.treesArt[0].scale===1,'zoom out uses small tree sprites');surface.remove();
 document.querySelector('#more-tools').click();document.querySelector('#mayor-drive').click();assert(!document.querySelector('#drive-controls').hidden,'Mayor Drive opens');assert(document.querySelector('#city').classList.contains('mayor-driving'),'driving hides construction controls');document.querySelector('#map').dispatchEvent(new KeyboardEvent('keydown',{key:'w',bubbles:true}));await new Promise(r=>setTimeout(r,400));document.querySelector('#map').dispatchEvent(new KeyboardEvent('keyup',{key:'w',bubbles:true}));document.querySelector('#exit-drive').click();assert(document.querySelector('#drive-controls').hidden,'Mayor Drive exits to city building');
 const {buildingSprite}=await import('/src/isometric-art.js'),{project}=await import('/src/isometric.js');
 const {civicPalette}=await import('/src/civic-art.js');
 const wallColors=['#c5aa87','#9fbfae','#d1a291','#d0b575','#b6a4c9'];let walls=0;
 for(const kind of ['home','garage-home','shop','supermarket','office','clinic','police','university','school','hotel','parking','park'])for(let paint=0;paint<5;paint++)for(const scale of [1,2,4]){const sprite=buildingSprite({w:80,h:60,z:60,kind,level:5,paint},scale),p=project(64,60,6),pixel=sprite.canvas.getContext('2d').getImageData(Math.round((p.x-sprite.x)*scale),Math.round((p.y-sprite.y)*scale),1,1).data,hex=civicPalette(kind,paint)?.walls[1]||(paint===0&&['office','clinic','police','university'].includes(kind)?'#7fa9bc':wallColors[paint]),expected=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));if(!expected.every((v,i)=>Math.abs(v-pixel[i])<5))throw Error('Foundation overlaps '+kind+' paint '+paint+' scale '+scale+': '+pixel);walls++;}
 assert(walls===180,'180 building wall pixels stay above foundation floors across paints and zoom tiers');
 // Render real city objects through rotation, upgrades, paints and cache tiers.
 const civicGame=new Simulation();civicGame.trees.clear();civicGame.coins=100000;civicGame.cars=[];civicGame.walkers=[];
 const civicCanvas=document.createElement('canvas');civicCanvas.style.cssText='width:390px;height:400px;position:fixed;left:-10000px;top:0';document.body.append(civicCanvas);
 const civicRenderer=new Renderer(civicCanvas,document.createElement('canvas'),civicGame),civicNode=21*55+18;
 for(const kind of ['clinic','university','school','police']){
  assert(civicGame.build(civicNode,kind)===null,kind+' campus builds in browser');const b=civicGame.buildingAt(civicNode);
  for(const level of [1,3,5])for(const paint of [0,4])for(let rotation=0;rotation<4;rotation++){
   Object.assign(b,{level,paint,rotation});civicRenderer.dirty=true;civicRenderer.focusBuilding(b);
   for(const zoom of [.4,.78,2.5]){civicRenderer.camera.zoom=zoom;civicRenderer.draw(1);}
   if(!civicRenderer.scene.some(o=>o.node===civicNode&&o.role))throw Error(kind+' lost landmark geometry');
  }
  civicGame.demolish(civicNode);
 }
 civicCanvas.remove();assert(true,'four civic campuses render at all rotations, three levels, both paints and three zoom tiers');
 const {drawCivicPreview}=await import('/src/isometric-art.js');
 for(const level of [1,3,5])for(const paint of [0,4]){
  const silhouettes=[];
  for(const kind of ['clinic','university','school','police']){
   const tile=document.createElement('canvas');tile.width=90;tile.height=70;const ctx=tile.getContext('2d');ctx.translate(45,23);ctx.scale(.22,.22);drawCivicPreview(ctx,{kind,level,paint});
   const pixels=ctx.getImageData(0,0,90,70).data;silhouettes.push(Array.from(pixels).filter((_,i)=>i%4===3).map(a=>a>100?1:0).join(''));
  }
  if(new Set(silhouettes).size!==4)throw Error('Civic silhouettes merge at zoom out, level '+level+' paint '+paint);
 }
 assert(true,'zoomed-out civic silhouettes stay distinct even with identical wall paint');
 document.querySelector('#more-tools').click();document.querySelector('[data-category="city"]').click();
 assert(document.querySelector('[data-pick-tool="school"]'),'School is available in Build menu');document.querySelector('[data-pick-tool="school"]').click();
 assert(!document.querySelector('#build-guide').hidden,'School can be selected for construction');document.querySelector('#cancel-build').click();
 const {tollSprite}=await import('/src/toll-art.js');
 for(let axis=0;axis<2;axis++)for(const scale of [1,2,4]){
  let previous=0;for(let level=1;level<=5;level++){
   const a=tollSprite(level,axis,scale),ctx=a.canvas.getContext('2d'),pixels=ctx.getImageData(0,0,a.canvas.width,a.canvas.height).data;
   let left=a.canvas.width,top=a.canvas.height,right=0,bottom=0;for(let y=0;y<a.canvas.height;y++)for(let x=0;x<a.canvas.width;x++)if(pixels[(y*a.canvas.width+x)*4+3]>100){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
   const area=(right-left)*(bottom-top);if(area<=previous)throw Error('Toll upgrade does not grow at level '+level+' axis '+axis+' scale '+scale);previous=area;
   if(left===0||top===0||right===a.canvas.width-1||bottom===a.canvas.height-1)throw Error('Clipped toll art');
  }
 }
 assert(true,'all five toll designs grow without sprite clipping in both road directions and all cache tiers');
 const residential=new Simulation();residential.trees.clear();residential.coins=100000;residential.cars=[];residential.spawn=()=>false;
 for(let y=17;y<20;y++)residential.build(y*55+18,'road');residential.build(16*55+18,'home');residential.build(21*55+18,'clinic');
 residential.addPlannerCar(17*55+18,20*55+18,21*55+18,'car');const resident=residential.cars[0];
 for(let i=0;i<9000&&!resident.done;i++)residential.update(1/30);
 assert(resident.done&&residential.endpoints.includes(resident.destination)&&residential.buildingAt(21*55+18).visitors===1,'dead-end home resident completes a real visit and exits without blocking the neighborhood');
 return passed;
}
