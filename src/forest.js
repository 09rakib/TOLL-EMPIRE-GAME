import {B} from './balance.js';
export function forestFor(tiles){
  const forest=new Set();
  for(let n=0;n<tiles.length;n++)if(tiles[n]==='grass'){
    const x=n%B.size,y=Math.floor(n/B.size),hash=((x*73856093)^(y*19349663))>>>0;
    if(hash%100<55)forest.add(n);
  }
  return forest;
}
export const forestMethods={
  treeCount(n){return this.trees.has(n)?2+((n%B.size+Math.floor(n/B.size)*3)%3):0;},
  treeRemovalCost(n){return this.treeCount(n)*B.treeRemovalPrice;},
  clearTrees(n){
    return this.clearTreeArea([n]);
  },
  clearTreeArea(nodes){
    const trees=[...new Set(nodes)].filter(n=>this.trees.has(n));if(!trees.length)return 'Choose a plot with trees.';
    const cost=trees.reduce((sum,n)=>sum+this.treeRemovalCost(n),0);if(this.coins<cost)return `You need $${cost} to clear these trees.`;
    const before=this.snapshot();this.coins-=cost;for(const n of trees)this.trees.delete(n);this.record(before);return null;
  },
};
