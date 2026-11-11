/* New Music uses exactly the public Frequency catalog and existing album rows/player. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'frequency-parity.js'),'utf8');
const player=fs.readFileSync(path.join(root,'listening-room.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'listening-catalog.json'),'utf8'));
const start=source.indexOf('  function newTracks() {');
const end=source.indexOf('  function renderYou()',start);
assert(start>=0 && end>start);
const elements={
  newMusicSummary:{textContent:''},
  newMusicEmpty:{hidden:true},
  newMusicList:{hidden:false,innerHTML:''},
};
const calls=[];
const app={
  state:{tracks:catalog.tracks},
  renderSongRows(root,tracks){
    assert.strictEqual(root,elements.newMusicList);
    calls.push(tracks.map(t=>t.id));
    root.innerHTML=tracks.map(t=>t.title).join('|');
  },
};
const context=vm.createContext({app,Date,$:id=>elements[id],window:{}});
vm.runInContext(source.slice(start,end),context);
const result=Array.from(vm.runInContext('newTracks().map(t=>t.id)',context));
assert.deepEqual(result,['new-the-wild-part-of-me','new-what-the-morning-knows']);
vm.runInContext('renderNewMusic()',context);
assert.equal(elements.newMusicEmpty.hidden,true);
assert.equal(elements.newMusicList.hidden,false);
assert.equal(elements.newMusicSummary.textContent,'2 NEW ORIGINALS · EARLY LISTENING PREVIEWS');
assert.equal(elements.newMusicList.innerHTML,'The Wild Part of Me|What the Morning Knows');
assert.deepEqual(calls[0],result);
assert(source.includes("app.renderSongRows($('newMusicList'),tracks)"));
assert(source.includes("t.source==='Public preview upload'"));
assert(!source.includes('FrequencyPrivateMusic'));
assert(!html.includes('frequency-private-music.js'));
assert(!html.includes('retryPrivateMusic'));
assert(player.includes('function renderSongRows(root,tracks)'));
assert(player.includes('state.queue=tracks.filter(t=>!t.privateLoading).map(t=>t.id)'));
assert(player.includes('playTrack(id,false)'));
for(const id of result){
  const t=catalog.tracks.find(t=>t.id===id);
  assert(t && t.audio.startsWith('audio/new/') && t.audio.endsWith('.m4a'));
  assert(!t.private);
  assert(fs.statSync(path.join(root,t.audio)).size>1e6);
}
app.state.tracks=catalog.tracks.filter(t=>t.source!=='Public preview upload');
vm.runInContext('renderNewMusic()',context);
assert.equal(elements.newMusicEmpty.hidden,false);
assert.equal(elements.newMusicList.hidden,true);
assert.equal(elements.newMusicList.innerHTML,'');
console.log('New Music PASS: 2 publicly hosted English preview songs, album rows, native shared player, no encryption dependency.');
