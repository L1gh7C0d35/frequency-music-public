/* Interaction smoke test without a browser or external packages.
   Run with node or Bun; the real player code is never mocked or changed. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../frequency-appearance.js','utf8');
const saved=new Map();

function load(initialAppearance) {
  const buttons=['current','midnight'].map(appearance=>({
    dataset:{appearance},attrs:{},handlers:{},selected:false,
    classList:{toggle(name,on){if(name==='is-selected')this.owner.selected=on}},
    setAttribute(name,value){this.attrs[name]=value},
    addEventListener(name,handler){this.handlers[name]=handler},
    focus(){this.focused=true},
  }));
  buttons.forEach(button=>button.classList.owner=button);
  const root={dataset:{}};
  if(initialAppearance==='midnight')root.dataset.frequencyAppearance='midnight';
  const hint={textContent:''};
  const handlers={};
  const document={
    documentElement:root,readyState:'complete',
    querySelectorAll(selector){assert(selector.includes('appearance-choice'));return buttons},
    getElementById(){return hint},
  };
  const window={addEventListener:(type,fn)=>{handlers[type]=fn}};
  const localStorage={
    getItem:key=>saved.get(key)||null,
    setItem:(key,value)=>saved.set(key,value),
  };
  vm.runInNewContext(source,{window,document,localStorage});
  return {buttons,root,hint,handlers};
}
let page=load();
assert.equal(page.root.dataset.frequencyAppearance,undefined);
assert.equal(page.buttons[0].attrs['aria-checked'],'true');
page.buttons[1].handlers.click();
assert.equal(page.root.dataset.frequencyAppearance,'midnight');
assert.equal(saved.get('frequency-web-appearance-v1'),'midnight');
assert.equal(page.buttons[1].attrs['aria-checked'],'true');
assert(page.hint.textContent.includes('Original Midnight'));
page=load(saved.get('frequency-web-appearance-v1'));
assert.equal(page.buttons[1].attrs['aria-checked'],'true');
let prevented=false;
page.buttons[1].handlers.keydown({key:'ArrowRight',preventDefault(){prevented=true}});
assert(prevented);
assert.equal(page.root.dataset.frequencyAppearance,undefined);
assert.equal(saved.get('frequency-web-appearance-v1'),'current');
assert.equal(page.buttons[0].focused,true);
page.handlers.storage({key:'frequency-web-appearance-v1',newValue:'midnight'});
assert.equal(page.root.dataset.frequencyAppearance,'midnight');
console.log('Appearance preference: toggle, keyboard, persistence, sync PASS');
