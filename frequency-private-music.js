/* Private Frequency new originals.
   Only AES-256-GCM ciphertext is public. The decryption key is NEVER in site
   assets, public catalog, code or network URL; it arrives through URL hash or
   was previously saved locally on this listener's browser.
   Once unlocked, the SAME Frequency audio element and cards play the music. */
(() => {
  'use strict';
  const KEY_STORE='frequency-private-key-v1';
  const MANIFEST='private-media/manifest-20261111.bin';
  const provider={status:'locked',count:0};
  window.FrequencyPrivateMusic=provider;
  const escapePath=path=>typeof path==='string' &&
    /^private-media\/[a-z0-9-]+\.bin$/.test(path);
  const decodeKey=hex=>{
    if(!/^[0-9a-f]{64}$/i.test(hex||''))throw Error('Invalid private listening link');
    const bytes=new Uint8Array(32);
    for(let i=0;i<32;i++)bytes[i]=parseInt(hex.slice(i*2,i*2+2),16);
    return bytes;
  };
  async function openData(path,key) {
    if(!escapePath(path))throw Error('Invalid private music path');
    const result=await fetch(path,{cache:'force-cache'});
    if(!result.ok)throw Error('Private audio download '+result.status);
    const combined=new Uint8Array(await result.arrayBuffer());
    if(combined.byteLength<29)throw Error('Incomplete private music file');
    // CryptoKit's AES.GCM combined format: 12-byte nonce + ciphertext + 16-byte tag.
    return crypto.subtle.decrypt(
      {name:'AES-GCM',iv:combined.slice(0,12)},
      key,combined.slice(12)
    );
  }
  function updateUI() {
    if(document.body.dataset.appTab==='new')
      window.FrequencyWebNavigation?.renderNewMusic?.();
  }
  function suppliedKey() {
    const hash=window.location.hash||'';
    const match=hash.match(/^#music-key=([a-fA-F0-9]{64})$/);
    if(match){
      // A fragment is never sent to GitHub, but scrub it from address bar
      // before a listener accidentally copies the complete private key.
      window.history.replaceState(window.history.state,'',
        window.location.pathname+window.location.search);
      return {hex:match[1].toLowerCase(),fromLink:true};
    }
    try {
      const hex=localStorage.getItem(KEY_STORE);
      if(hex)return {hex,fromLink:false};
    } catch(_){}
    return null;
  }
  async function unlock() {
    const app=window.FrequencyPreview;
    if(!app)return;
    const access=suppliedKey();
    if(!access){provider.status='locked';updateUI();return;}
    provider.status='loading';
    updateUI();
    const urls=[];
    try {
      if(!crypto?.subtle)throw Error('Secure audio playback not supported by this browser');
      const raw=decodeKey(access.hex);
      const key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['decrypt']);
      raw.fill(0);
      const manifest=JSON.parse(new TextDecoder().decode(await openData(MANIFEST,key)));
      if(manifest.version!==1 || manifest.purpose!=='owner-private-frequency-listening' ||
         !Array.isArray(manifest.tracks)||manifest.tracks.length>8)
        throw Error('Invalid private preview manifest');
      const ids=new Set();
      const tracks=await Promise.all(manifest.tracks.map(async item=>{
        if(!item?.private || item.type!=='song' || !escapePath(item.audio) ||
           !/^private-[a-z0-9-]+$/.test(item.id) || app.state.byId.has(item.id) || ids.has(item.id))
          throw Error('Private track metadata invalid');
        ids.add(item.id);
        const bytes=await openData(item.audio,key);
        const url=URL.createObjectURL(new Blob([bytes],{type:'audio/mp4'}));
        urls.push(url);
        // Never surface a public track URL for unapproved audio.
        return {...item,audio:url,private:true,new:true,source:'Encrypted owner-only listening'};
      }));
      app.state.tracks.push(...tracks);
      tracks.forEach(t=>app.state.byId.set(t.id,t));
      provider.count=tracks.length;
      provider.status='ready';
      const settings=document.getElementById('privateListeningSettings');
      if(settings)settings.hidden=false;
      const forget=document.getElementById('forgetPrivateMusic');
      if(forget)forget.onclick=()=>{
        try{localStorage.removeItem(KEY_STORE)}catch(_){}
        window.location.replace(window.location.pathname+window.location.search);
      };
      if(access.fromLink){
        try{localStorage.setItem(KEY_STORE,access.hex)}catch(_){}
      }
      // Keep player and favorites as the only source of truth.
      updateUI();
      // Library remains searchable too, without publishing metadata.
      if(document.body.dataset.appTab==='music')app.renderLibrary();
    } catch(error) {
      urls.forEach(url=>URL.revokeObjectURL(url));
      provider.status='error';
      provider.error=error?.message||'Unable to decrypt private listening files';
      console.warn('Private Frequency preview not ready:',provider.error);
      updateUI();
    }
  }
  if(window.FrequencyPreview)unlock();
  else document.addEventListener('frequency:ready',unlock,{once:true});
})();
