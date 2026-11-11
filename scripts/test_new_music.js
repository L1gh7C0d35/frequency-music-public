/* Exercise the actual New Music renderer against published catalog fixtures. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'frequency-parity.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'listening-catalog.json'),'utf8'));
const start=source.indexOf('  function newTracks() {');
const end=source.indexOf('  function renderYou()',start);
assert(start!==-1&&end>start,'New Music functions must exist in current navigation code');
const rendered=source.slice(start,end);
const actions={played:[],favorites:[]};
const list={
  innerHTML:'',hidden:false,controls:[],
  querySelectorAll(selector){
    const key=selector==='[data-new-play]'?'newPlay':'newFavorite';
    const attr=key==='newPlay'?'data-new-play':'data-new-favorite';
    const regex=new RegExp(attr+'="([^"]+)"','g');
    const buttons=Array.from(this.innerHTML.matchAll(regex),m=>{
      const btn={dataset:{[key]:m[1]},onClick:null,
        addEventListener(name,fn){assert.equal(name,'click');this.onClick=fn}};
      this.controls.push(btn);return btn;
    });
    return buttons;
  },
};
const elements={
  newMusicSummary:{textContent:''},
  newMusicEmpty:{hidden:true},
  newMusicList:list,
};
const app={
  state:{tracks:data.tracks,favorites:new Set()},
  playTrack(id,expand){actions.played.push([id,expand])},
  toggleFavorite(id){
    if(this.state.favorites.has(id))this.state.favorites.delete(id);
    else this.state.favorites.add(id);
    actions.favorites.push(id);
  },
};
const $=id=>{assert(elements[id],'Unexpected element '+id);return elements[id]};
const ESC=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const context=vm.createContext({app,$,ESC,Date});
vm.runInContext(rendered,context);
const newIds=Array.from(vm.runInContext('newTracks().map(x=>x.id)',context));
assert.deepEqual(newIds,['fire-under-calm-c1','fire-under-calm-c2','fire-under-calm-c3']);
vm.runInContext('renderNewMusic()',context);
assert(list.innerHTML.includes('Fire Under Calm'));
assert(list.innerHTML.includes('EARLY LISTEN · NOT A FINAL RELEASE'));
assert(list.innerHTML.includes('data-new-play="fire-under-calm-c1"'));
assert(list.innerHTML.includes('data-new-favorite="fire-under-calm-c3"'));
assert.equal(elements.newMusicEmpty.hidden,true);
const play=list.controls.find(c=>c.dataset.newPlay==='fire-under-calm-c2');
assert(play,'Second track play button exists');play.onClick();
assert.deepEqual(actions.played,[['fire-under-calm-c2',true]]);
const save=list.controls.find(c=>c.dataset.newFavorite==='fire-under-calm-c1');
assert(save,'Save button exists');save.onClick();
assert(app.state.favorites.has('fire-under-calm-c1'));
assert(list.innerHTML.includes('♥ Saved'));
const extra={...data.tracks.find(t=>t.id==='already-arrived'),id:'new-approved-test',new:true,published_at:'2099-01-01T00:00:00Z'};
app.state.tracks=[...data.tracks,extra];
assert.equal(vm.runInContext('newTracks()[0].id',context),'new-approved-test');
app.state.tracks=data.tracks.filter(t=>!t.new);
vm.runInContext('renderNewMusic()',context);
assert.equal(elements.newMusicEmpty.hidden,false);
assert.equal(elements.newMusicList.hidden,true);
assert.equal(list.innerHTML,'');
console.log('New Music PASS: 3 approved previews, playback, favorites, date order, empty state, no private sources.');
