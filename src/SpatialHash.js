// Fixed-size linked cell lists. Rebuilt without allocating arrays per entity or per frame.
export class SpatialHash {
 constructor(capacity=2000,cellSize=64,worldSize=4096){this.cellSize=cellSize;this.side=Math.ceil(worldSize/cellSize);this.head=new Int32Array(this.side*this.side);this.next=new Int32Array(capacity);this.head.fill(-1);this.entities=[];}
 cell(x,y){return Math.max(0,Math.min(this.side-1,Math.floor(x/this.cellSize)))+Math.max(0,Math.min(this.side-1,Math.floor(y/this.cellSize)))*this.side;}
 rebuild(entities){this.entities=entities;this.head.fill(-1);for(let i=0;i<entities.length;i++){let e=entities[i];if(!e.active)continue;let k=this.cell(e.x,e.y);this.next[i]=this.head[k];this.head[k]=i;}}
 query(x,y,r,fn){const s=this.cellSize,n=this.side,x0=Math.max(0,Math.floor((x-r)/s)),x1=Math.min(n-1,Math.floor((x+r)/s)),y0=Math.max(0,Math.floor((y-r)/s)),y1=Math.min(n-1,Math.floor((y+r)/s));for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++)for(let i=this.head[cx+cy*n];i!==-1;i=this.next[i]){const e=this.entities[i];if(e.active&&fn(e,i)===false)return;}}
 nearest(x,y,r=650){let best=null,d2=r*r;this.query(x,y,r,e=>{let d=(x-e.x)**2+(y-e.y)**2;if(d<d2){d2=d;best=e;}});return best;}
}
