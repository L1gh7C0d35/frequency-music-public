/* Private Frequency originals: ciphertext on Pages, key stays in listener link.
   Reuse Frequency's one music state, renderer and bottom HTMLAudioElement.
   Retain the URL fragment until verification succeeds, so iOS browser
   interruptions don't strand a listener without the key. */
(() => {
  'use strict';
  const KEY_STORE='frequency-private-key-v1';
  const MANIFEST='private-media/manifest-20261111.bin';
  const provider={status:'locked',count:0,stage:'',error:'',errorCode:''};
  window.FrequencyPrivateMusic=provider;
  let inFlight=null;

  const validPath=path=>typeof path==='string' && /^private-media\/[a-z0-9-]+\.bin$/.test(path);
  const decodeKey=hex=>{
    if(!/^[0-9a-f]{64}$/i.test(hex||''))throw Error('Invalid private listening key');
    const out=new Uint8Array(32);
    for(let i=0;i<32;i++)out[i]=parseInt(hex.slice(i*2,i*2+2),16);
    return out;
  };
  function readAccess() {
    let supplied=null;
    try{supplied=new URLSearchParams(window.location.hash.replace(/^#/,'')).get('music-key')}catch(_){}
    if(supplied)return {hex:supplied.toLowerCase(),fromLink:true};
    try {
      const hex=localStorage.getItem(KEY_STORE);
      if(hex)return {hex,fromLink:false};
    }catch(_){}
    return null;
  }
  function updateUI(){
    if(document.body.dataset.appTab==='new')
      window.FrequencyWebNavigation?.renderNewMusic?.();
  }
  async function decrypt(path,key) {
    if(!validPath(path))throw Error('Invalid private music path');
    let error;
    // A failed revalidation or a partial cached ciphertext can happen when an
    // in-app mobile browser is suspended. Retry once with a fresh response.
    for(let attempt=0;attempt<2;attempt++){
      try{
        const response=await fetch(path,{cache:attempt?'reload':'no-cache'});
        if(!response.ok)throw Error('Private music request '+response.status);
        // Pass plain ArrayBuffers to WebCrypto for compatibility with iOS
        // WebKit, including in-app browsers (some reject nonzero-offset views).
        const packet=await response.arrayBuffer();
        if(packet.byteLength<29)throw Error('Incomplete encrypted recording');
        return await window.crypto.subtle.decrypt(
          {name:'AES-GCM',iv:packet.slice(0,12)},key,packet.slice(12));
      }catch(caught){
        error=caught;
        if(caught?.name==='NotSupportedError')break;
      }
    }
    throw error;
  }

  function reportFailure(error,stage){
    provider.status='error';
    provider.stage=stage;
    provider.errorCode=error?.name==='OperationError'?'authentication'
      :error?.name==='NotSupportedError'||stage==='security'?'browser'
      :stage==='manifest'?'manifest':stage==='audio'?'audio':'connection';
    provider.error=provider.errorCode==='browser'
      ? 'This browser cannot unlock encrypted audio. Open Frequency in Safari.'
      :provider.errorCode==='authentication'
      ? 'The private listening key or downloaded data was rejected. Reopen your personal link.'
      : 'The private recordings could not finish loading. Try again, or open Frequency in Safari.';
    // Never log the secret key, token, fragment, or decrypted song details.
    console.warn('Frequency private listening failed at',stage,provider.errorCode);
    updateUI();
  }
  async function unlock() {
    if(inFlight)return inFlight;
    const app=window.FrequencyPreview;
    if(!app)return;
    const access=readAccess();
    if(!access){
      provider.status='locked';
      provider.error='';
      updateUI();
      return;
    }
    provider.status='loading';
    provider.error='';
    provider.errorCode='';
    provider.stage='security';
    updateUI();

    inFlight=(async()=>{
      let stage='security';
      try{
        if(!window.isSecureContext || !window.crypto?.subtle)
          throw Error('Web Crypto unavailable');
        const raw=decodeKey(access.hex);
        const key=await window.crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['decrypt']);
        raw.fill(0);
        stage='manifest';
        provider.stage=stage;
        const manifest=JSON.parse(new TextDecoder().decode(await decrypt(MANIFEST,key)));
        if(manifest.version!==1||manifest.purpose!=='owner-private-frequency-listening'||
          !Array.isArray(manifest.tracks)||manifest.tracks.length>8)
          throw Error('Invalid private preview manifest');
        // This key has now authenticated the private manifest. Remember it
        // before slow audio downloads, so reopening New on an iPhone does not
        // make the real songs disappear while it reconnects.
        if(access.fromLink){try{localStorage.setItem(KEY_STORE,access.hex)}catch(_){}}
        const ids=new Set();
        for(const item of manifest.tracks){
          if(!item?.private||item.type!=='song'||!validPath(item.audio)||
             !/^private-[a-z0-9-]+$/.test(item.id)||ids.has(item.id))
            throw Error('Invalid private track manifest');
          ids.add(item.id);
          const existing=app.state.byId.get(item.id);
          if(existing){
            if(!existing.private)throw Error('Private track ID conflict');
            continue;
          }
          // The encrypted manifest is tiny. Show BOTH real song titles and
          // album-style rows immediately instead of waiting for two downloads.
          const track={...item,audio:'',private:true,privateLoading:true,
            new:true,source:'Encrypted owner-only listening'};
          app.state.tracks.push(track);
          app.state.byId.set(track.id,track);
        }
        updateUI();
        for(const item of manifest.tracks){
          const track=app.state.byId.get(item.id);
          if(!track.privateLoading)continue;
          stage='audio';
          provider.stage=stage;
          // Sequential decryption keeps memory lower on iPhones. The song
          // row turns playable as soon as its own download completes.
          const audio=await decrypt(item.audio,key);
          const url=URL.createObjectURL(new Blob([audio],{type:'audio/mp4'}));
          track.audio=url;
          track.privateLoading=false;
          provider.count=app.state.tracks.filter(t=>t.private&&!t.privateLoading).length;
          updateUI();
        }
        provider.stage='';
        provider.count=app.state.tracks.filter(t=>t.private).length;
        provider.status='ready';
        // Persist and scrub only AFTER authenticated decryption, so users
        // can retry the same private link when Safari briefly suspends a load.
        if(access.fromLink){
          try{
            window.history.replaceState(window.history.state,'',
              window.location.pathname+window.location.search);
          }catch(_){}
        }
        const settings=document.getElementById('privateListeningSettings');
        if(settings)settings.hidden=false;
        const forget=document.getElementById('forgetPrivateMusic');
        if(forget)forget.onclick=()=>{
          try{localStorage.removeItem(KEY_STORE)}catch(_){}
          window.location.replace(window.location.pathname+window.location.search);
        };
        updateUI();
        if(document.body.dataset.appTab==='music')app.renderLibrary();
      }catch(error){reportFailure(error,stage)}
      finally{inFlight=null}
    })();
    return inFlight;
  }

  provider.retry=unlock;
  provider.ensureUnlocked=()=>{
    if(provider.status==='locked'||provider.status==='error')return unlock();
  };
  if(window.FrequencyPreview)provider.ensureUnlocked();
  else document.addEventListener('frequency:ready',provider.ensureUnlocked,{once:true});
})();
