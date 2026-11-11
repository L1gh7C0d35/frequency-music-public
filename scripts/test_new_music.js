/* The same album rows and streaming player must handle all new Frequency previews. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'frequency-parity.js'),'utf8');
const player=fs.readFileSync(path.join(root,'listening-room.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'listening-catalog.json'),'utf8'));
const begin=source.indexOf('  function newTracks() {');
const end=source.indexOf('  function renderYou()',begin);
assert(begin>=0&&end>begin);
const el={
  newMusicSummary:{textContent:''},
  newMusicEmpty:{hidden:true},
  newMusicList:{hidden:false,innerHTML:''},
};
const calls=[];
const app={
  state:{tracks:catalog.tracks},
  renderSongRows(root,tracks){
    assert.strictEqual(root,el.newMusicList);
    calls.push(tracks.map(t=>t.id));
    root.innerHTML=tracks.map(t=>t.title).join('|');
  },
};
const context=vm.createContext({app,Date,$:id=>el[id],window:{}});
vm.runInContext(source.slice(begin,end),context);
const result=Array.from(vm.runInContext('newTracks().map(t=>t.id)',context));
const newest=['new-i-know-who-i-am','new-i-live-in-the-overflow'];
const former=['new-disco-on-the-fire-escape','new-neon-wildfire','new-out-of-orbit','new-the-wild-part-of-me','new-what-the-morning-knows'];
assert.deepEqual(result.slice(0,2),newest);
assert(former.every(id=>result.includes(id)));
assert.equal(result.length,7);
vm.runInContext('renderNewMusic()',context);
assert.equal(el.newMusicEmpty.hidden,true);
assert.equal(el.newMusicList.hidden,false);
assert.equal(el.newMusicSummary.textContent,result.length+' NEW ORIGINALS · EARLY LISTENING PREVIEWS');
const expectedTitles=result.map(id=>catalog.tracks.find(t=>t.id===id).title);
assert.equal(el.newMusicList.innerHTML,expectedTitles.join('|'));
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
  assert(t.duration>100);
}
app.state.tracks=catalog.tracks.filter(t=>t.source!=='Public preview upload');
vm.runInContext('renderNewMusic()',context);
assert.equal(el.newMusicEmpty.hidden,false);
assert.equal(el.newMusicList.hidden,true);
assert.equal(el.newMusicList.innerHTML,'');
console.log('New Music PASS: seven streaming originals; two affirmation-centered songs first; shared album rows and player.');
