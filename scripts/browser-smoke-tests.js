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
 return passed;
}
