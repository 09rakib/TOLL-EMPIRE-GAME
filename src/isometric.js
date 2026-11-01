// World coordinates stay unchanged; projection affects rendering and picking only.
export const ISO_X=.75,ISO_Y=.375;
export function project(x,y,z=0){return {x:(x-y)*ISO_X,y:(x+y)*ISO_Y-z};}
export function unproject(x,y){return {x:x/(2*ISO_X)+y/(2*ISO_Y),y:y/(2*ISO_Y)-x/(2*ISO_X)};}
export function cameraWorld(x,y,camera,width,height){const p=unproject((x-width/2)/camera.zoom,(y-height/2)/camera.zoom);return {x:p.x+camera.x,y:p.y+camera.y};}
export function visibleBounds(camera,width,height,tile,size,padding=3){const points=[[0,0],[width,0],[width,height],[0,height]].map(([x,y])=>cameraWorld(x,y,camera,width,height));return {left:Math.max(0,Math.floor(Math.min(...points.map(p=>p.x))/tile)-padding),right:Math.min(size-1,Math.ceil(Math.max(...points.map(p=>p.x))/tile)+padding),top:Math.max(0,Math.floor(Math.min(...points.map(p=>p.y))/tile)-padding),bottom:Math.min(size-1,Math.ceil(Math.max(...points.map(p=>p.y))/tile)+padding)};}
export function containsPoint(poly,x,y){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function prismOutline(x,y,w,h,z){return [project(x,y,z),project(x+w,y,z),project(x+w,y),project(x+w,y+h),project(x,y+h),project(x,y+h,z)];}
