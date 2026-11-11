/* Test that original song titles appear before multi-megabyte audio finishes.
   Bun scripts/test_private_manifest_first.js /private/path/to/20261111.key */
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const assert=require('node:assert/strict');
const secretFile=process.argv[2];
assert(secretFile && fs.existsSync(secretFile));
const secret=fs.readFileSync(secretFile,'utf8').trim();
assert.match(secret,/^[0-9a-f]{64}$/i);
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'frequency-private-music.js'),'utf8');
assert(!source.includes(secret));
const tracks=[],byId=new Map(),stored=new Map();
const route={hash:'#music-key='+secret,pathname:'/frequency-music-public/',search:'?tab=new'};
let unblock;
const pending=new Promise(resolve=>{unblock=resolve});
let renderCount=0;
const window={
  isSecureContext:true,crypto,location:route,
  history:{state:null,replaceState(_state,_title,url){assert.equal(url,route.pathname+route.search);route.hash=''}},
  FrequencyPreview:{state:{tracks,byId},renderLibrary(){}},
  FrequencyWebNavigation:{renderNewMusic(){renderCount++}},
};
const document={body:{dataset:{appTab:'new'}},getElementById(){return {hidden:false,onclick:null}}};
const localStorage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
const fetch=async file=>{
  if(file!=='private-media/manifest-20261111.bin')await pending;
  const data=fs.readFileSync(path.join(root,file));
  return {ok:true,arrayBuffer:async()=>Uint8Array.from(data).buffer};
};
const URL={createObjectURL:()=> 'blob:validated-'+Math.random(),revokeObjectURL(){}};
const ctx={window,document,localStorage,fetch,crypto,Blob,URL,URLSearchParams,TextDecoder,console};
vm.runInNewContext(source,ctx);
for(let i=0;i<200 && tracks.length!==2;i++)await new Promise(resolve=>setTimeout(resolve,10));
assert.equal(tracks.length,2,'Both titles must appear before encrypted audio completes');
assert.deepEqual(tracks.map(t=>t.title),['What the Morning Knows','The Wild Part of Me']);
assert(tracks.every(t=>t.privateLoading && !t.audio && t.private));
assert.equal(window.FrequencyPrivateMusic.status,'loading');
assert.equal(stored.get('frequency-private-key-v1'),secret,'Authenticated manifest should persist access');
assert(route.hash,'Still retain link fragment until audio loading is complete');
const earlyRenders=renderCount;
unblock();
for(let i=0;i<250 && window.FrequencyPrivateMusic.status!=='ready';i++)
  await new Promise(resolve=>setTimeout(resolve,10));
assert.equal(window.FrequencyPrivateMusic.status,'ready',window.FrequencyPrivateMusic.error);
assert.equal(tracks.length,2,'Never duplicate songs between manifest and audio completion');
assert(tracks.every(t=>!t.privateLoading && t.audio.startsWith('blob:validated-')));
assert.equal(route.hash,'');
assert(renderCount>earlyRenders,'UI must refresh when audio becomes playable');
console.log('MANIFEST-FIRST PASS: both real titles appear before audio; same rows become playable.');
