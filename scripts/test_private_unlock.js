/* Optional local integration proof for private Frequency playback.
   Bun scripts/test_private_unlock.js PATH_TO_PRIVATE_KEY
   Never put the key in the repo, source code, stdout, or public catalog. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const keyFile=process.argv[2];
assert(keyFile && fs.existsSync(keyFile));
const hex=fs.readFileSync(keyFile,'utf8').trim();
assert.match(hex,/^[0-9a-f]{64}$/i);
const root=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'frequency-private-music.js'),'utf8');
assert(!code.includes(hex));
const privateKeys=new Map();
let renderCount=0;
let appLibraryCount=0;
let objectCount=0;
const tracks=[];
const buttons={privateListeningSettings:{hidden:true},forgetPrivateMusic:{onclick:null}};
const href={hash:'#music-key='+hex,pathname:'/frequency-music-public/',search:'?tab=new'};
const storedKey=[];
const win={
  FrequencyPreview:{
    state:{tracks,byId:new Map()},
    renderLibrary(){appLibraryCount++},
  },
  FrequencyWebNavigation:{renderNewMusic(){renderCount++}},
  location:href,
  history:{state:null,replaceState(_state,_title,url){
    assert.equal(url,href.pathname+href.search);
    href.hash='';
  }},
};
const document={
  body:{dataset:{appTab:'new'}},
  getElementById:id=>buttons[id]||null,
};
const fetch=async filename=>{
  const bytes=fs.readFileSync(path.join(root,filename));
  return {ok:true,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
};
const blobUrls=new Map();
const URL={
  createObjectURL(blob){const id='blob:test-private/'+(++objectCount);blobUrls.set(id,blob);return id},
  revokeObjectURL(id){blobUrls.delete(id)},
};
const localStorage={
  getItem:key=>privateKeys.get(key)||null,
  setItem:(key,value)=>{privateKeys.set(key,value);storedKey.push(key)},
  removeItem:key=>privateKeys.delete(key),
};
const context=vm.createContext({window:win,document,fetch,crypto,TextDecoder,Blob,URL,localStorage,console});
vm.runInContext(code,context);
for(let i=0;i<200 && win.FrequencyPrivateMusic.status==='loading';i++){
  await new Promise(resolve=>setTimeout(resolve,25));
}
assert.equal(win.FrequencyPrivateMusic.status,'ready',win.FrequencyPrivateMusic.error);
assert.equal(win.FrequencyPrivateMusic.count,2);
assert.equal(tracks.length,2);
assert.deepEqual(tracks.map(t=>t.title),['What the Morning Knows','The Wild Part of Me']);
assert(tracks.every(t=>t.private&&t.new&&t.audio.startsWith('blob:test-private/')));
assert(win.FrequencyPreview.state.byId.has('private-morning-knows-english'));
assert(win.FrequencyPreview.state.byId.has('private-wild-part-english'));
assert.equal(href.hash,'');
assert.equal(privateKeys.get('frequency-private-key-v1'),hex);
assert.equal(buttons.privateListeningSettings.hidden,false);
assert.equal(appLibraryCount,0,'Do not rebuild hidden Music library while unlocking New');
assert(renderCount>=1);
for(const blob of blobUrls.values()){
  const bytes=new Uint8Array(await blob.arrayBuffer());
  assert.equal(String.fromCharCode(...bytes.slice(4,8)),'ftyp');
}
assert.equal(storedKey.length,1);
console.log('Private unlock PASS: AES-GCM in browser, two playable M4A blob sources, key fragment scrubbed, same Frequency state.');
