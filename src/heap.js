export class MinHeap{
  constructor(){this.items=[];}
  get size(){return this.items.length;}
  push(value){const items=this.items;let i=items.length;items.push(value);while(i>0){const parent=(i-1)>>1;if(items[parent][1]<=value[1])break;items[i]=items[parent];i=parent;}items[i]=value;}
  pop(){const items=this.items,first=items[0],last=items.pop();if(items.length){let i=0;while(i*2+1<items.length){let child=i*2+1;if(child+1<items.length&&items[child+1][1]<items[child][1])child++;if(last[1]<=items[child][1])break;items[i]=items[child];i=child;}items[i]=last;}return first;}
}
