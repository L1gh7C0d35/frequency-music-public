/* Midnight is now Frequency's single theme, including stale green preferences. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../frequency-appearance.js','utf8');
const root={dataset:{frequencyAppearance:'current'}};
const wordmark={textContent:'frequency.'};
const subtitle={textContent:'64 TRACKS · WEB COMPANION'};
const document={
  documentElement:root,readyState:'complete',
  querySelector(selector){
    return selector==='.mobile-logo b'?wordmark:
           selector==='.brand-words small'?subtitle:null;
  },
};
const window={};
vm.runInNewContext(source,{window,document});
assert.equal(root.dataset.frequencyAppearance,'midnight');
assert.equal(wordmark.textContent,'frequency');
assert.equal(subtitle.textContent,'LISTENING ROOM');
window.FrequencyAppearance.choose('current',true);
assert.equal(root.dataset.frequencyAppearance,'midnight');
window.FrequencyAppearance.choose('forest',false);
assert.equal(root.dataset.frequencyAppearance,'midnight');
console.log('Midnight-only appearance: default, previous green choice, and layout switch PASS');
