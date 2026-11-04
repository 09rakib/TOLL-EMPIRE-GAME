export async function run(){
 const passed=[],assert=(value,label)=>{if(!value)throw Error(label);passed.push(label);};
 document.querySelector('#more-tools').click();document.querySelector('#heatmap').click();
 assert(!document.querySelector('#overlay-panel').hidden,'overlay menu opens');
 for(const mode of ['connections','traffic','clinic','police','university','park','parking','']){
   document.querySelector(`[data-overlay="${mode}"]`).click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   assert(document.querySelector(`[data-overlay="${mode}"]`).getAttribute('aria-pressed')==='true','overlay '+(mode||'normal')+' renders');
 }
 assert(document.documentElement.scrollWidth<=innerWidth,'portrait layout has no horizontal overflow');
 const {Simulation}=await import('/src/simulation.js'),{cityOverlay}=await import('/src/city-insights.js');
 const g=new Simulation();g.trees.clear();g.coins=100000;g.build(40*64+40,'clinic');
 assert(cityOverlay(g,'connections').markers.length===1,'isolated campus reports connection problem');
 document.querySelector('[data-tool="home"]').click();
 const canvas=document.querySelector('#map'),rect=canvas.getBoundingClientRect();canvas.dispatchEvent(new PointerEvent('pointermove',{clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2,pointerId:1,bubbles:true}));
 assert(/total/.test(document.querySelector('#construction-quote').textContent),'pointer preview shows complete building quote');
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
 const t=new Simulation();t.trees.clear();t.coins=100000;t.cars=[];t.spawn=()=>false;for(const n of [1292,1302]){t.build(n,'bus-stop');t.build(n,'uturn');}t.build(19*64+12,'home');t.build(19*64+22,'home');assert(t.createTransitLine([1292,1302])===null,'legal bus route can be opened');for(let i=0;i<1800;i++)t.update(1/30);assert(t.transit.passengers>0,'scheduled bus delivers passengers in browser');
 const {Renderer}=await import('/src/isometric-renderer.js');
 const artGame=new Simulation();artGame.trees.clear();artGame.coins=100000;artGame.cars=[];artGame.walkers=[];artGame.build(21*64+12,'garage-home');for(const [x,y]of [[11,21],[11,22],[12,23],[13,23],[14,22],[14,21]])artGame.build(y*64+x,'road');
 const surface=document.createElement('canvas');surface.style.cssText='width:390px;height:400px;position:fixed;left:0;top:200px;z-index:-1';document.body.append(surface);const mini=document.createElement('canvas'),art=new Renderer(surface,mini,artGame);
 for(let r=0;r<4;r++){art.dirty=true;art.camera.x=13*56;art.camera.y=22*56;art.draw(1);assert(artGame.rotateBuilding(21*64+12)===null,'rotated property geometry '+r+' renders');}
 for(const [i,kind]of ['bench','flowerbed','fountain'].entries())assert(artGame.build(25*64+12+i,kind)===null,'decoration '+kind+' builds');art.dirty=true;art.camera.y=24*56;art.draw(1);assert(art.scene.filter(o=>o.kind==='decoration').length===3,'all decoration art renders');surface.remove();
 return passed;
}
