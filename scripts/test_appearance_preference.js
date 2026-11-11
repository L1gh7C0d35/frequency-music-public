/* Forest is the default; Midnight is an explicit new preference. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../frequency-appearance.js','utf8');
const saved=new Map([['frequency-web-appearance-v1','midnight']]);
const choices=['current','midnight'].map(appearance=>({
  dataset:{appearance},attrs:{},handlers:{},selected:false,focused:false,
  classList:{toggle(_name,on){this.button.selected=on}},
  setAttribute(name,value){this.attrs[name]=value},
  addEventListener(name,callback){this.handlers[name]=callback},
  focus(){this.focused=true},
}));
choices.forEach(button=>button.classList.button=button);
const root={dataset:{}};
const wordmark={textContent:'frequency.'};
const subtitle={textContent:'LISTENING ROOM'};
const hint={textContent:''};
const meta={content:'#090d0c',setAttribute(name,value){assert.equal(name,'content');this.content=value}};
const document={
  documentElement:root,readyState:'complete',
  querySelector(selector){
    if(selector==='.mobile-logo b')return wordmark;
    if(selector==='.brand-words small')return subtitle;
    if(selector==='meta[name="theme-color"]')return meta;
    return null;
  },
  querySelectorAll(selector){assert(selector.includes('appearance-choice'));return choices},
  getElementById(){return hint},
};
const listeners={};
const window={FrequencyPreview:{state:{tracks:new Array(JSON.parse(fs.readFileSync(__dirname+'/../listening-catalog.json','utf8')).tracks.length)}},addEventListener:(name,fn)=>{listeners[name]=fn}};
const localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
vm.runInNewContext(source,{window,document,localStorage});
assert.equal(root.dataset.frequencyAppearance,undefined);
assert.equal(meta.content,'#090d0c');
assert.equal(choices[0].attrs['aria-checked'],'true');
assert.equal(wordmark.textContent,'frequency.');
choices[1].handlers.click();
assert.equal(root.dataset.frequencyAppearance,'midnight');
assert.equal(meta.content,'#090c12');
assert.equal(saved.get('frequency-theme-choice-v2'),'midnight');
assert.equal(wordmark.textContent,'frequency');
choices[0].handlers.click();
assert.equal(root.dataset.frequencyAppearance,undefined);
assert.equal(saved.get('frequency-theme-choice-v2'),'current');
let prevented=false;
choices[0].handlers.keydown({key:'ArrowRight',preventDefault(){prevented=true}});
assert(prevented);
assert.equal(root.dataset.frequencyAppearance,'midnight');
assert.equal(choices[1].focused,true);
listeners.storage({key:'frequency-theme-choice-v2',newValue:'current'});
assert.equal(root.dataset.frequencyAppearance,undefined);
console.log('Appearance PASS: forest default, midnight optional, keyboard, storage sync, old preference ignored.');
