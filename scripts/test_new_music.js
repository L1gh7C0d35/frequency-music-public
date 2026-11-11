/* Verify New Music reuses Home's actual card/player action and never features C1/C2. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'frequency-parity.js'),'utf8');
const main=fs.readFileSync(path.join(root,'listening-room.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'listening-catalog.json'),'utf8'));
const start=source.indexOf('  function newTracks() {');
const end=source.indexOf('  function renderYou()',start);
assert(start!==-1&&end>start);
const privateTracks=[
  {id:'private-wild',title:'The Wild Part of Me',type:'song',new:true,private:true,
    created_at:'2026-11-10',source:'Encrypted owner-only listening'},
  {id:'private-morning',title:'What the Morning Knows',type:'song',new:true,private:true,
    created_at:'2026-11-10',source:'Encrypted owner-only listening'},
];
const elements={
  newMusicSummary:{textContent:''},
  newMusicEmpty:{hidden:true,querySelector(selector){
    if(selector==='h3')return this.h3||(this.h3={textContent:''});
    if(selector==='p')return this.p||(this.p={textContent:''});
    throw Error('unexpected selector');
  }},
  newMusicList:{hidden:false,innerHTML:''},
};
const calls=[];
const app={
  state:{tracks:[...data.tracks,...privateTracks],favorites:new Set()},
  renderTrackCards(root,tracks){
    assert.strictEqual(root,elements.newMusicList);
    calls.push(tracks.map(t=>t.id));
    root.innerHTML=tracks.map(t=>t.title).join('|');
  },
};
const context=vm.createContext({
  app,Date,window:{FrequencyPrivateMusic:{status:'ready'}},
  $:id=>{assert(elements[id]);return elements[id]},
});
vm.runInContext(source.slice(start,end),context);
const newIds=Array.from(vm.runInContext('newTracks().map(t=>t.id)',context));
assert.deepEqual(newIds,['private-wild','private-morning']);
vm.runInContext('renderNewMusic()',context);
assert.equal(elements.newMusicEmpty.hidden,true);
assert.equal(elements.newMusicSummary.textContent,'2 PRIVATE ORIGINALS');
assert.equal(elements.newMusicList.innerHTML,'The Wild Part of Me|What the Morning Knows');
assert.deepEqual(calls[0],['private-wild','private-morning']);
assert(source.includes('app.renderTrackCards($(\'newMusicList\'),tracks)'));
assert(main.includes('function renderTrackCards(root,tracks)'));
assert(main.includes("root.querySelectorAll('[data-play]').forEach(btn=>btn.onclick=()=>playTrack(btn.dataset.play,false))"));
assert(!main.includes('state.tracks.filter(x=>x.new).map(x=>x.id)'));
assert(main.includes("state.tracks.filter(eligibleForHome)"));
const released={...privateTracks[0],id:'public-approved',private:false,source:'Public preview upload',published_at:'2099-01-01T00:00:00Z'};
app.state.tracks=[...data.tracks,...privateTracks,released];
assert.equal(vm.runInContext('newTracks()[0].id',context),'public-approved');
app.state.tracks=data.tracks;
vm.runInContext('renderNewMusic()',context);
assert.equal(elements.newMusicEmpty.hidden,false);
assert.equal(elements.newMusicList.hidden,true);
assert.equal(elements.newMusicList.innerHTML,'');
context.window.FrequencyPrivateMusic.status='loading';
vm.runInContext('renderNewMusic()',context);
assert.equal(elements.newMusicEmpty.hidden,true);
assert(elements.newMusicSummary.textContent.includes('PREPARING'));
console.log('New Music PASS: private originals, same Home card/mini-player, test variants excluded, loading/empty states.');
