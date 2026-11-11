/* Simulate a mobile in-app browser failing first ciphertext downloads. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const keyFile=process.argv[2];
assert(keyFile && fs.existsSync(keyFile));
const key=fs.readFileSync(keyFile,'utf8').trim();
const root=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'frequency-private-music.js'),'utf8');
let failures=2, requests=0;
const location={hash:'#music-key='+key,pathname:'/frequency-music-public/',search:'?tab=new'};
const storage=new Map();
const tracks=[], byId=new Map();
let updated=0, objects=0;
const win={
  isSecureContext:true,crypto,location,
  history:{state:null,replaceState(_state,_title,url){
    assert.equal(url,location.pathname+location.search);
    location.hash='';
  }},
  FrequencyPreview:{
    state:{tracks,byId},
    renderLibrary(){throw Error('Must not rebuild hidden library')},
  },
  FrequencyWebNavigation:{renderNewMusic(){updated++}},
};
const document={
  body:{dataset:{appTab:'new'}},
  getElementById(){return {hidden:true,onclick:null}},
};
const localStorage={
  getItem:key=>storage.get(key)||null,
  setItem:(key,val)=>storage.set(key,val),
  removeItem:key=>storage.delete(key),
};
const fetch=async file=>{
  requests++;
  if(file.endsWith('manifest-20261111.bin') && failures-->0)
    throw Error('Simulated mobile network interruption');
  const bytes=fs.readFileSync(path.join(root,file));
  return {ok:true,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
};
const URL={
  createObjectURL(){return 'blob:preview/'+(++objects)},
  revokeObjectURL(){},
};
const context=vm.createContext({window:win,document,localStorage,fetch,crypto,Blob,TextDecoder,URL,URLSearchParams,console});
vm.runInContext(code,context);
async function settled(){
  for(let i=0;i<160;i++){
    if(['error','ready'].includes(win.FrequencyPrivateMusic.status))return;
    await new Promise(resolve=>setTimeout(resolve,15));
  }
  throw Error('Timeout waiting for unlock');
}
await settled();
assert.equal(win.FrequencyPrivateMusic.status,'error');
assert.equal(win.FrequencyPrivateMusic.errorCode,'manifest');
assert.equal(location.hash,'#music-key='+key,'keep key fragment after failed unlock');
assert.equal(storage.size,0);
assert.equal(tracks.length,0);
await win.FrequencyPrivateMusic.retry();
assert.equal(win.FrequencyPrivateMusic.status,'ready',win.FrequencyPrivateMusic.error);
assert.equal(tracks.length,2);
assert.equal(objects,2);
assert.equal(location.hash,'','scrub key only after success');
assert.equal(storage.get('frequency-private-key-v1'),key);
assert(updated>=3);
console.log('iOS recovery PASS: interrupted download, retained key, on-screen retry, authenticated audio, single player state.');
