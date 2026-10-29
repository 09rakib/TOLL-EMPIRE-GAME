import {B} from './balance.js';
import {PROJECTS} from './projects.js';
export const catalog=[
  ...Object.entries(PROJECTS).map(([id,p])=>({id,name:p.name,icon:p.icon,category:'projects',legacyOnly:true,cost:p.costs[0],minLevel:p.level,unit:'foundation',hint:`3 stages · ${p.costs.reduce((s,v)=>s+v,0)} coins total. ${p.benefit}.`})),
  {id:'home',name:'Home',icon:'home',category:'city',cost:B.homePrice,unit:'20 residents',hint:'Build on connected grass. Creates new trips and residents.'},
  {id:'shop',name:'Shop',icon:'shop',category:'city',cost:B.shopPrice,unit:'8 / customer',hint:'Customers arriving by road pay on arrival. Upgrades improve the shop and capacity.'},
  {id:'office',name:'Office',icon:'office',category:'city',cost:B.officePrice,unit:'14 / worker',hint:'Earn when workers arrive. Higher levels become larger glass office towers.'},
  {id:'clinic',name:'Hospital',icon:'hospital',plannerOnly:true,category:'city',cost:B.hospitalPrice,unit:'24 / patient',hint:'Patients must reach the hospital. Upgrade beds, fees and the building itself.'},
  {id:'hotel',name:'Hotel',icon:'hotel',plannerOnly:true,category:'city',cost:B.hotelPrice,unit:'20 / guest',hint:'Earn from arriving guests. Develop a guesthouse into a luxury hotel.'},
  {id:'park',name:'City park',icon:'tree',category:'city',cost:B.parkPrice,unit:'Better flow',hint:'Beautify your city and reduce congestion slowdown.'},
  {id:'road',name:'Local road',icon:'road',category:'roads',cost:B.roadPrice,unit:'/ tile',hint:'Two lanes. Connect to any existing road.'},
  {id:'main',name:'Main road',icon:'road',category:'roads',cost:B.mainPrice,unit:'/ tile',hint:'Four lanes, twice the capacity. Can upgrade local roads.'},
  {id:'flyover',name:'Flyover',icon:'flyover',category:'roads',cost:B.flyoverPrice,unit:'/ tile',hint:'Tap two aligned roads. Only ramp ends connect to ground.'},
  {id:'bridge',name:'River bridge',icon:'bridge',category:'roads',cost:B.bridgePrice,unit:'/ water tile',hint:'Tap a road on one bank, then clear land across the river.'},
  {id:'toll',name:'Toll booth',icon:'toll',category:'traffic',cost:B.tollPrice,unit:'',hint:'Collect from passing cars. Up to 12 booths; 5 levels each.'},
  {id:'signal',name:'Traffic signal',icon:'signal',category:'traffic',cost:B.signalPrice,unit:'',hint:'Controls a 3- or 4-way intersection with alternating lights.'},
  {id:'roundabout',name:'Roundabout',icon:'roundabout',category:'traffic',cost:B.roundaboutPrice,unit:'',hint:'An intersection with 80% more flow capacity.'},
  {id:'demolish',name:'Demolish',icon:'demolish',category:'traffic',cost:0,unit:'60% refund',hint:'Remove booths first, then roads. Tap spans to remove a structure.'},
];
