// Runtime search regression: a soundscape must appear when searching in Music mode.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'listening-room.js'),'utf8');
const tracks=JSON.parse(fs.readFileSync(path.join(root,'listening-catalog.json'))).tracks;
const worlds=JSON.parse(fs.readFileSync(path.join(root,'listening-catalog.json'))).worlds;
const fn=source.match(/  function currentList\(\) \{[\s\S]*?\n  \}\n  function chooseWorld/);
const handler=source.match(/    \$\('searchInput'\)\.oninput=e=>\{[\s\S]*?\n    \};/);
assert(fn,'Could not locate live search function');
assert(handler,'Could not locate actual search input handler');
const state={
  tracks, worlds, previewType:'song',previewGoal:'sleep',previewRecent:false,
  previewExperience:'all',favoritesOnly:false,filter:'all',query:'',
  favorites:new Set()
};
const elements={searchInput:{value:''}};
let synced=0;
const context={
  state,
  world:id=>worlds.find(w=>w.id===id),
  $:id=>elements[id],
  window:{FrequencyWebNavigation:{syncFilters:()=>synced++}},
  renderLibrary:()=>{},
};
vm.createContext(context);
vm.runInContext(fn[0].replace(/\n  function chooseWorld$/,''),context);
vm.runInContext(handler[0],context);
assert.equal(vm.runInContext('currentList().filter(t=>t.title.includes("528")).length',context),0,'Default Music mode hides 528 soundscapes');
elements.searchInput.oninput({target:{value:'528'}});
assert.equal(state.previewType,'all');
assert.equal(state.previewGoal,'all');
assert.equal(synced,1);
const actual=Array.from(vm.runInContext('currentList().map(t=>t.id)',context));
assert.deepEqual(actual.sort(),[
 'timekeeper-audio-528-hz-miracle-awakening',
 'timekeeper-audio-528-hz-sacred-grace'
]);
elements.searchInput.oninput({target:{value:'Golden Current'}});
assert.equal(vm.runInContext('currentList().filter(t=>t.artist==="Golden Current").length',context),2);
console.log('PASS: 528 and Golden Current searches find both recordings across categories.');
