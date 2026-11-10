const KEY='georgia-rachel-deadwood-v1';
export class Save {
 constructor(storage=globalThis.localStorage){this.storage=storage;this.data={gold:0,totalGold:0,bestKills:0,runs:0,shop:{hp:0,attack:0,speed:0,magnet:0,armor:0},music:false,sound:true};try{let d=JSON.parse(storage.getItem(KEY));if(d&&typeof d==='object'){for(let k of ['gold','totalGold','bestKills','runs'])this.data[k]=Math.max(0,Number(d[k])||0);for(let k in this.data.shop)this.data.shop[k]=Math.min(10,Math.max(0,Math.floor(Number(d.shop?.[k])||0)));this.data.music=d.music===true;this.data.sound=d.sound!==false;}}catch{}this.available=true;}
 write(){try{this.storage.setItem(KEY,JSON.stringify(this.data));return true;}catch{this.available=false;return false;}}
 bank(gold,kills){this.data.gold+=gold;this.data.totalGold+=gold;this.data.bestKills=Math.max(this.data.bestKills,kills);this.data.runs++;return this.write();}
 purchase(key,base){let lv=this.data.shop[key];if(lv===undefined||lv>=10)return false;let cost=Math.floor(base*(lv+1)**1.45);if(this.data.gold<cost)return false;this.data.gold-=cost;this.data.shop[key]++;this.write();return true;}
}
