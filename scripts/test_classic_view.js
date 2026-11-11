/* Classic navigation interaction test: no DOM library or installed browser required. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const rootDir=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(rootDir,'frequency-classic.js'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(rootDir,'listening-catalog.json'),'utf8'));
const initialView=new URL('https://example.com/frequency/?view=classic');
const local=new Map([['frequency-web-appearance-v1','current']]);
const listeners={};
const classicButtons=['discover','worlds','music','favorites','discover','worlds','music','favorites'].map(classicTab=>button({classicTab}));
const choiceButtons=['classic','modern'].map(viewChoice=>button({viewChoice}));
function button(data){
  return {dataset:data,attrs:{},handlers:{},
    classList:{toggle(name,value){this.owner[name]=value}},
    setAttribute(name,val){this.attrs[name]=val},
    addEventListener(name,fn){this.handlers[name]=fn},
    focus(){this.focused=true}};
}
for(const b of [...classicButtons,...choiceButtons])b.classList.owner=b;
const elements={};
for(const id of ['frequencyViewHint','switchToModern','topSearch','nowBrowse','library','searchInput','crumb','worldCount']){
  elements[id]=button({});
  elements[id].textContent='';
  elements[id].scrollIntoView=()=>{};
}
elements.topSearch.onclick=()=>{elements.modernSearchCount=(elements.modernSearchCount||0)+1};
elements.searchInput.focus=()=>{elements.searchInput.focusCount=(elements.searchInput.focusCount||0)+1};
const specific={
  '.hero-kicker':{innerHTML:'<span></span> NOW'},
  '#hero .hero-text h1':{innerHTML:'Listen to what moves you.'},
  '#hero .hero-text p':{textContent:'Current description'},
  '.nav-caption':{textContent:'FREQUENCY'},
  '#worlds .section-eyebrow':{textContent:'ARTIST WORLDS'},
  '#worlds .section-head h2':{innerHTML:'Find your sound <em>world.</em>'},
};
const root={dataset:{frequencyView:'classic',frequencyAppearance:'midnight'}};
const body={dataset:{},scrollTop:0};
const dom={
  documentElement:root,body,
  querySelectorAll(selector){
    if(selector==='[data-view-choice]')return choiceButtons;
    if(selector==='[data-classic-tab]'||selector==='button[data-classic-tab]')return classicButtons;
    return [];
  },
  querySelector(selector){return selector.startsWith('[data-view-choice=')?choiceButtons.find(b=>selector.includes(b.dataset.viewChoice)):specific[selector]||null},
  getElementById(id){return elements[id]||null},
};
const app={
  state:{tracks:catalog.tracks,worlds:catalog.worlds,favorites:new Set(['already-arrived']),
    previewType:'song',previewGoal:'sleep',previewExperience:'all',favoritesOnly:false,filter:'all',
    activeWorld:false},
  resetCount:0,renderCount:0,
  resetLibrary(){
    this.resetCount++;
    Object.assign(this.state,{previewType:'all',previewGoal:'all',previewExperience:'all',filter:'all',favoritesOnly:false});
  },
  renderLibrary(){this.renderCount++},
  closeWorld(){this.state.activeWorld=false},
  closeNow(){this.closedPlayer=(this.closedPlayer||0)+1},

};
const location={href:initialView.href};
const changedRoutes=[];
const history={state:{},replaceState(_s,_t,url){changedRoutes.push(url);location.href='https://example.com'+url}};
const viewCalls=[];
const appearanceCalls=[];
const window={
  FrequencyPreview:app,
  FrequencyWebNavigation:{tab(id){viewCalls.push(id)}},
  FrequencyAppearance:{choose(theme){appearanceCalls.push(theme);root.dataset.frequencyAppearance=theme}},
  location,history,scrollTo(){},
  addEventListener(type,fn){listeners[type]=fn},
};
const localStorage={getItem:k=>local.get(k)||null,setItem:(k,val)=>local.set(k,val)};
const context={window,document:dom,localStorage,location,history,URL};
vm.runInNewContext(code,context);
assert.equal(root.dataset.frequencyView,'classic');
assert.equal(body.dataset.classicTab,'discover');
assert.equal(local.get('frequency-web-view-v1'),'classic');
assert.equal(app.state.tracks.length,catalog.tracks.length);
assert.equal(app.state.worlds.length,11);
assert.equal(app.state.favorites.has('already-arrived'),true);
assert.equal(app.state.previewType,'all');
assert.equal(specific['#hero .hero-text h1'].innerHTML,'Feel more.<br><i>Become more.</i>');
assert.equal(choiceButtons[0].attrs['aria-checked'],'true');
assert.equal(classicButtons[0].attrs['aria-current'],'page');
classicButtons[2].handlers.click();
assert.equal(body.dataset.classicTab,'music');
assert.equal(app.state.previewType,'all');
assert.equal(app.state.favoritesOnly,false);
classicButtons[3].handlers.click();
assert.equal(body.dataset.classicTab,'favorites');
assert.equal(app.state.favoritesOnly,true);
assert.equal(app.state.favorites.has('already-arrived'),true);
elements.topSearch.onclick();
assert.equal(body.dataset.classicTab,'music');
assert.equal(elements.searchInput.focusCount,1);
assert.equal(elements.modernSearchCount||0,0);
elements.nowBrowse.onclick();
assert.equal(body.dataset.classicTab,'music');
assert.equal(app.closedPlayer,1);
elements.switchToModern.handlers.click();
assert.equal(root.dataset.frequencyView,undefined);
assert.equal(root.dataset.frequencyAppearance,'current');
assert.equal(app.state.favorites.has('already-arrived'),true);
assert.equal(choiceButtons[1].attrs['aria-checked'],'true');
assert.equal(specific['#hero .hero-text h1'].innerHTML,'Listen to what moves you.');
assert.equal(local.get('frequency-web-view-v1'),'modern');
assert(!new URL(location.href).searchParams.has('view'));
choiceButtons[0].handlers.click();
assert.equal(root.dataset.frequencyView,'classic');
assert.equal(root.dataset.frequencyAppearance,'midnight');
assert.equal(local.get('frequency-web-view-v1'),'classic');
assert.equal(app.state.tracks.length,catalog.tracks.length);
assert.equal(app.state.favorites.has('already-arrived'),true);
console.log('Classic navigation PASS: four tabs, '+catalog.tracks.length+'-track library, favorites, search, toggling, saved preference.');
