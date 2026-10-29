import {B} from './balance.js';
export class StatsTracker {
  constructor(){this.passages=[];this.payments=[];this.history=new Map();this.nextSample=B.statsSeconds;this.totals=new Map();this.passHead=0;this.payHead=0;this.income=0;}
  total(node){if(!this.totals.has(node))this.totals.set(node,{cars:0,travel:0,income:0});return this.totals.get(node);}
  passage(time,node,travel){this.passages.push({time,node,travel});const t=this.total(node);t.cars++;t.travel+=travel;}
  payment(time,node,amount){this.payments.push({time,node,amount});this.total(node).income+=amount;this.income+=amount;}
  trim(time){
    while(this.passHead<this.passages.length&&this.passages[this.passHead].time<=time-60){const p=this.passages[this.passHead++],t=this.total(p.node);t.cars--;t.travel-=p.travel;}
    while(this.payHead<this.payments.length&&this.payments[this.payHead].time<=time-60){const p=this.payments[this.payHead++];this.total(p.node).income-=p.amount;this.income-=p.amount;}
    if(this.passHead>512){this.passages=this.passages.slice(this.passHead);this.passHead=0;}
    if(this.payHead>256){this.payments=this.payments.slice(this.payHead);this.payHead=0;}
  }
  stats(node,time){this.trim(time);const t=this.totals.get(node);return {cars:t?.cars||0,avgTime:t?.cars?t.travel/t.cars:0,income:t?.income||0};}
  update(time,graph){
    this.trim(time);if(time<this.nextSample)return;this.nextSample=time+B.statsSeconds;
    for(const node of graph.keys()){
      const samples=this.history.get(node)||[],t=this.totals.get(node);
      samples.push({time,cars:t?.cars||0,avgTime:t?.cars?t.travel/t.cars:0,income:t?.income||0});
      while(samples.length&&samples[0].time<time-B.historySeconds)samples.shift();this.history.set(node,samples);
    }
    for(const node of this.history.keys())if(!graph.has(node))this.history.delete(node);
  }
}
