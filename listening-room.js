/* Frequency Listening Room · static GitHub Pages edition.
   Music and images come ONLY from existing public assets in this repository.
   No uploads, telemetry, account connections, fabricated artist credits, or ownership claims.
*/
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const audio = $('mainAudio');
  const state = {
    tracks: [], worlds: [], byId: new Map(), current: null, playing: false,
    filter: 'all', query: '', favoritesOnly: false, favorites: new Set(),
    reviews: {}, shuffle: false, repeat: false, queue: [], modal: '',
    featuredIds: ['already-arrived','crowned-by-fire','golden-hour','quiet-empire','momentum-is-mine'],
  };
  const PLAY = '<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>';
  const PAUSE = '<path d="M8.5 5v14M15.5 5v14" stroke-width="3.5"/>';
  const HEART = '<path d="M20.7 5.3a5.4 5.4 0 0 0-7.6 0L12 6.4l-1.1-1.1a5.4 5.4 0 0 0-7.6 7.6L12 21l8.7-8.1a5.4 5.4 0 0 0 0-7.6Z"/>';
  const SHARE = '<path d="M12 16V3m0 0-4.5 4.5M12 3l4.5 4.5M5 14v5.5c0 .3.2.5.5.5h13c.3 0 .5-.2.5-.5V14"/>';
  const STORAGE = 'frequency-listening-room-v1';
  const safeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = s => { const n = Math.max(0,Math.floor(Number.isFinite(Number(s)) ? Number(s) : 0)); return Math.floor(n/60)+':'+String(n%60).padStart(2,'0'); };
  const world = id => state.worlds.find(w => w.id === id);
  const selected = () => state.current && state.byId.get(state.current);
  const rand = array => array[Math.floor(Math.random()*array.length)];
  function loadLocal() {
    try {
      const o = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      state.favorites = new Set(Array.isArray(o.favorites) ? o.favorites.filter(v=>typeof v==='string') : []);
      state.reviews = o.reviews && typeof o.reviews==='object' && !Array.isArray(o.reviews) ? o.reviews : {};
    } catch (_) { state.favorites = new Set(); state.reviews = {}; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE, JSON.stringify({favorites:Array.from(state.favorites), reviews:state.reviews})); } catch (_) {}
  }
  let toastTimer;
  function toast(message) {
    const el = $('toast');
    el.textContent = message; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{el.hidden=true;},3300);
  }
  function nav(section) {
    if (section === 'favorites') {
      state.favoritesOnly=true;
      state.filter='all';
      $('crumb').textContent='Favorites';
      renderLibrary();
      document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('selected',b.dataset.nav==='favorites'));
      $('library').scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    if (section === 'library') {state.favoritesOnly=false;state.filter='all';renderLibrary();}
    if (section === 'worlds') {state.favoritesOnly=false;}
    if (section === 'discover') {state.favoritesOnly=false;state.filter='all';renderLibrary();}
    $('crumb').textContent=section==='discover'?'Discover':section==='worlds'?'Sound worlds':'All music';
    document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('selected',b.dataset.nav===section));
    ($(section)||$('discover')).scrollIntoView({behavior:'smooth',block:'start'});
  }
  const trackUrl = id => {
    const u = new URL(window.location.href);
    u.searchParams.set('track',id);
    u.hash='';
    return u.toString();
  };
  function setUrlTrack(id) {
    try {
      const u=new URL(window.location.href);
      if(id)u.searchParams.set('track',id); else u.searchParams.delete('track');
      window.history.replaceState(null,'',u.pathname+u.search);
    } catch (_) {}
  }
  async function share(text,url) {
    const data={title:text,text:text,url:url};
    if(navigator.share) {
      try { await navigator.share(data); return; }
      catch(e) {if(e.name==='AbortError')return;}
    }
    try { await navigator.clipboard.writeText(url); toast('Link copied — share it anywhere'); }
    catch (_) { window.prompt('Copy this link:',url); }
  }
  function currentList() {
    return state.tracks.filter(t=>{
      if (state.favoritesOnly && !state.favorites.has(t.id)) return false;
      if (state.filter!=='all' && t.world!==state.filter) return false;
      const q=state.query.toLowerCase().trim();
      return !q || [t.title,t.subtitle,t.description,world(t.world)?.name].some(s=>String(s||'').toLowerCase().includes(q));
    });
  }
  function chooseWorld(id) {
    state.favoritesOnly=false; state.filter=id; state.query='';
    $('searchInput').value='';
    $('crumb').textContent=world(id)?.name || 'Sound worlds';
    renderLibrary();
    document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('selected',b.dataset.nav==='worlds'));
    $('library').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function renderWorlds() {
    $('worldGrid').innerHTML=state.worlds.map((w,i)=>`
      <button class="world-card" data-world="${safeText(w.id)}" aria-label="Explore ${safeText(w.name)}">
        <img src="${safeText(w.image)}" alt="" loading="lazy">
        <span class="world-arrow">↗</span>
        <span class="world-content"><span class="world-small">0${i+1} · ${w.count} TRACKS</span>
          <span class="world-title">${safeText(w.name)}</span><span class="world-desc">${safeText(w.short)}</span></span>
      </button>`).join('');
    $('worldGrid').querySelectorAll('[data-world]').forEach(b=>b.addEventListener('click',()=>chooseWorld(b.dataset.world)));
  }
  function renderPicks() {
    const picks=state.featuredIds.map(id=>state.byId.get(id)).filter(Boolean);
    $('featuredGrid').innerHTML=picks.map(t=>`
      <article class="pick"><button data-play="${t.id}" class="pick-cover" aria-label="Play ${safeText(t.title)}">
        <img src="${safeText(t.image)}" alt="${safeText(t.title)} cover artwork" loading="lazy">
        <span class="pick-play"><svg viewBox="0 0 24 24">${PLAY}</svg></span></button>
        <div class="pick-meta"><div style="min-width:0"><button data-play="${t.id}" class="pick-title">${safeText(t.title)}</button>
          <div class="pick-world">${safeText(world(t.world)?.name || 'Frequency Originals')}</div></div>
          <button class="heart-small ${state.favorites.has(t.id)?'active':''}" data-heart="${t.id}" aria-label="${state.favorites.has(t.id)?'Remove from':'Add to'} favorites" aria-pressed="${state.favorites.has(t.id)}"><svg viewBox="0 0 24 24">${HEART}</svg></button></div></article>`).join('');
    wireInteractive($('featuredGrid'));
  }
  function renderFilters() {
    const chips=[{id:'all',name:'All music'},...state.worlds];
    $('filterBar').innerHTML=chips.map(w=>`<button class="filter-chip ${!state.favoritesOnly && state.filter===w.id?'selected':''}" data-filter="${w.id}" aria-pressed="${!state.favoritesOnly && state.filter===w.id}">${safeText(w.name)}</button>`).join('');
    $('filterBar').querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{
      state.favoritesOnly=false;state.filter=b.dataset.filter;
      $('crumb').textContent=state.filter==='all'?'All music':world(state.filter)?.name;
      renderLibrary();
    });
  }
  function renderLibrary() {
    renderFilters();
    const tracks=currentList();
    $('trackCount').textContent=(state.favoritesOnly?'SAVED · ':'')+tracks.length+' TRACK'+(tracks.length===1?'':'S');
    $('emptyState').hidden=tracks.length>0;
    $('trackList').hidden=tracks.length===0;
    $('trackList').innerHTML=tracks.map((t,i)=>`
      <article class="track-row ${state.current===t.id?'active':''}" data-row="${t.id}">
        <span class="track-no">${String(i+1).padStart(2,'0')}</span>
        <button class="track-thumb" data-play="${t.id}" aria-label="Play ${safeText(t.title)}"><img src="${safeText(t.image)}" alt="" loading="lazy"></button>
        <div class="track-main"><button class="track-name" data-open="${t.id}">${safeText(t.title)}</button><div class="track-descriptor">${safeText(t.description)}</div></div>
        <div class="track-world">${safeText(world(t.world)?.name||'Frequency Originals')}</div>
        <div class="track-length">${fmt(t.duration)}</div>
        <button class="heart-small ${state.favorites.has(t.id)?'active':''}" data-heart="${t.id}" aria-pressed="${state.favorites.has(t.id)}" aria-label="${state.favorites.has(t.id)?'Remove from':'Add to'} favorites"><svg viewBox="0 0 24 24">${HEART}</svg></button>
        <button class="track-share" data-share="${t.id}" title="Share this song" aria-label="Share ${safeText(t.title)}"><svg viewBox="0 0 24 24">${SHARE}</svg></button>
      </article>`).join('');
    wireInteractive($('trackList'));
  }
  function wireInteractive(root) {
    root.querySelectorAll('[data-play]').forEach(btn=>btn.onclick=()=>playTrack(btn.dataset.play,true));
    root.querySelectorAll('[data-open]').forEach(btn=>btn.onclick=()=>showTrack(btn.dataset.open));
    root.querySelectorAll('[data-heart]').forEach(btn=>btn.onclick=()=>toggleFavorite(btn.dataset.heart));
    root.querySelectorAll('[data-share]').forEach(btn=>btn.onclick=()=>{const t=state.byId.get(btn.dataset.share);share(t.title+' · Frequency Originals',trackUrl(t.id));});
  }
  function toggleFavorite(id) {
    if(state.favorites.has(id)){state.favorites.delete(id);toast('Removed from favorites');}
    else{state.favorites.add(id);toast('Saved to favorites ♡');}
    persist(); renderLibrary();renderPicks(); syncHearts();
  }
  function syncHearts() {
    $('nowHeart').classList.toggle('active',!!state.current && state.favorites.has(state.current));
    $('nowHeart').setAttribute('aria-pressed',String(state.favorites.has(state.current)));
  }
  function showTrack(id) {
    if(!state.byId.has(id))return;
    if(state.current!==id)loadTrack(id,false);
    openNow();
  }
  function queueFromContext(id) {
    const list=currentList().map(t=>t.id);
    const possible=list.length?list:state.tracks.map(t=>t.id);
    state.queue=possible.includes(id)?possible:[id,...possible];
  }
  function loadTrack(id,play=false) {
    const t=state.byId.get(id);if(!t)return;
    if(state.current!==id){
      state.current=id; state.playing=false;
      audio.pause();audio.src=t.audio;audio.load();
      $('nowArt').src=t.image;$('nowArt').alt=t.title+' artwork';
      $('nowBack').style.backgroundImage='url("'+t.image+'")';
      $('nowTitle').textContent=t.title;$('nowSub').textContent=t.artist;
      $('nowWorld').textContent=(world(t.world)?.name||'Frequency')+' · '+(world(t.world)?.short||'');
      $('miniCover').src=t.image;$('miniTitle').textContent=t.title;
      $('miniSubtitle').textContent=world(t.world)?.name||t.artist;
      $('miniPlayer').hidden=false;
      $('playState').textContent='READY TO LISTEN';
      setUrlTrack(id);updateMediaSession(t);renderLibrary();renderPicks();syncHearts();renderQueue();updateProgress();
    }
    if(play)requestPlay();
    else syncPlayState();
  }
  function playTrack(id,expand=true) {
    if(!state.byId.has(id))return;
    if(state.current===id && state.playing){audio.pause();if(expand)openNow();return;}
    if(!state.queue.length || !state.queue.includes(id))queueFromContext(id);
    loadTrack(id,true);if(expand)openNow();
  }
  async function requestPlay() {
    if(!state.current) {
      const first=state.byId.get('already-arrived')||state.tracks[0];
      if(!first)return;queueFromContext(first.id);loadTrack(first.id,false);
    }
    try {await audio.play();}
    catch(e){state.playing=false;syncPlayState();toast('Playback needs a tap, or this audio is unavailable.');}
  }
  function togglePlay() {
    if(!state.current){const first=state.byId.get('already-arrived')||state.tracks[0];if(first)playTrack(first.id,true);}
    else if(audio.paused)requestPlay();else audio.pause();
  }
  function next(back=false) {
    if(!state.tracks.length)return;
    let ids=state.queue.length?state.queue:state.tracks.map(t=>t.id);
    if(state.shuffle && ids.length>1) {
      const alternatives=ids.filter(id=>id!==state.current);
      loadTrack(rand(alternatives),true);return;
    }
    const idx=ids.indexOf(state.current);
    if(back && audio.currentTime>3){audio.currentTime=0;return;}
    let target=ids[(idx+(back?-1:1)+ids.length)%ids.length];
    loadTrack(target,true);
  }
  function syncPlayState() {
    state.playing=!!state.current && !audio.paused && !audio.ended;
    const sym=state.playing?PAUSE:PLAY;
    document.querySelectorAll('.button-symbol').forEach(svg=>svg.innerHTML=sym);
    $('miniPlay').setAttribute('aria-label',state.playing?'Pause':'Play');
    $('nowPlay').setAttribute('aria-label',state.playing?'Pause':'Play');
    $('miniEq').classList.toggle('playing',state.playing);
    document.querySelector('.hero-art-caption .eq')?.classList.toggle('playing',state.playing);
    $('playState').textContent=state.playing?'NOW PLAYING':'PAUSED';
    if('mediaSession' in navigator)navigator.mediaSession.playbackState=state.playing?'playing':'paused';
  }
  function updateProgress() {
    const duration=Number.isFinite(audio.duration)?audio.duration:(selected()?.duration||0);
    const current=Number.isFinite(audio.currentTime)?audio.currentTime:0;
    $('nowSeek').value=duration>0?Math.round(current/duration*1000):0;
    $('nowSeek').style.background='linear-gradient(to right,#ead1b3 0 '+(duration>0?current/duration*100:0)+'%,#c6c3bc30 0 100%)';
    $('elapsed').textContent=fmt(current);$('remaining').textContent='-'+fmt(Math.max(0,duration-current));
    $('miniBar').style.width=(duration>0?Math.min(100,current/duration*100):0)+'%';
  }
  function openNow(){
    if(!state.current)return;
    $('nowOverlay').classList.add('open');$('nowOverlay').setAttribute('aria-hidden','false');lockScroll();
    $('closeNow').focus({preventScroll:true});
  }
  function closeNow(){
    $('nowOverlay').classList.remove('open');$('nowOverlay').setAttribute('aria-hidden','true');lockScroll();
  }
  function modal(id,open){
    $(id).classList.toggle('open',open);
    $(id).setAttribute('aria-hidden',String(!open));
    lockScroll();
  }
  function lockScroll(){document.body.style.overflow= ['nowOverlay','feedbackModal','queueModal'].some(id=>$(id).classList.contains('open'))?'hidden':'';}
  function updateMediaSession(t) {
    if(!('mediaSession' in navigator) || !('MediaMetadata' in window))return;
    try{
      navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:'Frequency Originals',
        album:world(t.world)?.name||'Frequency Sessions',
        artwork:[{src:new URL(t.image,location.href).href,sizes:'512x512',type:'image/jpeg'}]});
      const actions={play:requestPlay,pause:()=>audio.pause(),nexttrack:()=>next(),previoustrack:()=>next(true),seekto:(details)=>{if(Number.isFinite(details.seekTime))audio.currentTime=details.seekTime;}};
      Object.entries(actions).forEach(([key,fn])=>{try{navigator.mediaSession.setActionHandler(key,fn);}catch(_){ }});
    }catch(_){}
  }
  function renderQueue() {
    const tracks=(state.queue.length?state.queue:state.tracks.map(t=>t.id)).map(id=>state.byId.get(id)).filter(Boolean);
    const ix=Math.max(0,tracks.findIndex(t=>t.id===state.current));
    const around=[...tracks.slice(ix),...tracks.slice(0,ix)].slice(0,20);
    $('queueList').innerHTML=around.map((t,i)=>`<div class="queue-item ${t.id===state.current?'active':''}"><img src="${safeText(t.image)}" alt=""><button data-queue="${t.id}">${safeText(t.title)}<small>${i===0&&t.id===state.current?'Now playing · ':''}${safeText(world(t.world)?.name)}</small></button></div>`).join('');
    $('queueList').querySelectorAll('[data-queue]').forEach(b=>b.onclick=()=>{loadTrack(b.dataset.queue,true);modal('queueModal',false);openNow();});
  }
  function openReview() {
    const id=state.current || $('feedbackSong').value || state.tracks[0]?.id;
    if(!id)return;
    $('feedbackSong').innerHTML=state.tracks.map(t=>`<option value="${t.id}">${safeText(t.title)}</option>`).join('');
    $('feedbackSong').value=id; renderReview(); closeNow();modal('feedbackModal',true);
  }
  function renderReview() {
    const id=$('feedbackSong').value;
    const r=state.reviews[id]||{};
    $('feedbackText').value=r.notes||'';
    document.querySelectorAll('[data-reaction]').forEach(b=>{
      const active=b.dataset.reaction===r.reaction;
      b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));
    });
    $('feedbackStat').textContent=Object.keys(state.reviews).length+' saved track notes · Private on this device';
  }
  function saveReview() {
    const id=$('feedbackSong').value;
    if(!id)return;
    const reaction=document.querySelector('[data-reaction].selected')?.dataset.reaction||'';
    const notes=$('feedbackText').value.trim();
    if(!reaction&&!notes){toast('Choose a reaction or add a note');return;}
    state.reviews[id]={reaction,notes,updatedAt:new Date().toISOString()};
    if(reaction==='love')state.favorites.add(id);
    persist();renderPicks();renderLibrary();syncHearts();renderReview();
    toast('Listening notes saved on this device');
  }
  async function exportFeedback() {
    const payload={schema:1,collection:'Frequency Listening Room',exported_at:new Date().toISOString(),
      entries:Object.entries(state.reviews).map(([id,r])=>({id,title:state.byId.get(id)?.title||id,reaction:r.reaction||'',notes:r.notes||'',updated_at:r.updatedAt||null})),
      favorites:Array.from(state.favorites).map(id=>({id,title:state.byId.get(id)?.title||id})),
      note:'These are personal listening preferences, not public endorsements or server-side records.'};
    const json=JSON.stringify(payload,null,2);
    const name='frequency-listening-feedback-'+new Date().toISOString().slice(0,10)+'.json';
    try {
      if(navigator.canShare&&navigator.share){
        const file=new File([json],name,{type:'application/json'});
        if(navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:'My Frequency listening notes'});
          toast('Feedback exported through Share Sheet');return;
        }
      }
    }catch(e){if(e.name==='AbortError')return;}
    try{
      const blob=new Blob([json],{type:'application/json'});
      const a=document.createElement('a');const url=URL.createObjectURL(blob);
      a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),4000);
      toast('Feedback file downloaded');return;
    }catch(_){}
    try{await navigator.clipboard.writeText(json);toast('Feedback copied to clipboard');}
    catch(_){window.prompt('Copy your feedback:',json);}
  }
  function bind() {
    document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
    $('heroPlay').onclick=()=>{queueFromContext('already-arrived');playTrack('already-arrived',true);};
    $('heroArt').onclick=()=>{queueFromContext('already-arrived');playTrack('already-arrived',true);};
    $('heroShuffle').onclick=()=>{const id=rand(state.tracks)?.id;if(id){queueFromContext(id);state.shuffle=true;syncModes();playTrack(id,true);}};
    $('shufflePicks').onclick=()=>{
      state.featuredIds=state.tracks.map(t=>t.id).sort(()=>Math.random()-.5).slice(0,5);renderPicks();
    };
    $('searchInput').oninput=e=>{state.query=e.target.value;renderLibrary();};
    $('topSearch').onclick=()=>{nav('library');$('searchInput').focus({preventScroll:true});};
    $('clearFilters').onclick=()=>{state.query='';state.filter='all';state.favoritesOnly=false;$('searchInput').value='';renderLibrary();};
    $('shareRoom').onclick=()=>share('Frequency · Listening Room',location.origin+location.pathname);
    $('miniOpen').onclick=openNow;$('miniPlay').onclick=togglePlay;$('miniNext').onclick=()=>next();
    $('closeNow').onclick=closeNow;$('nowShare').onclick=()=>{if(selected())share(selected().title+' · Frequency Originals',trackUrl(state.current));};
    $('nowHeart').onclick=()=>{if(state.current)toggleFavorite(state.current);};
    $('nowPlay').onclick=togglePlay;$('nowNext').onclick=()=>next();$('nowPrev').onclick=()=>next(true);
    $('nowShuffle').onclick=()=>{state.shuffle=!state.shuffle;syncModes();};
    $('nowRepeat').onclick=()=>{state.repeat=!state.repeat;syncModes();};
    $('nowSeek').addEventListener('input',e=>{
      if(Number.isFinite(audio.duration)&&audio.duration>0){
        const proposed=audio.duration*Number(e.target.value)/1000;
        $('elapsed').textContent=fmt(proposed);$('remaining').textContent='-'+fmt(audio.duration-proposed);
      }
    });
    $('nowSeek').addEventListener('change',e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=audio.duration*Number(e.target.value)/1000;});
    $('nowReview').onclick=openReview;$('openFeedback').onclick=openReview;$('footerFeedback').onclick=openReview;
    $('closeFeedback').onclick=()=>modal('feedbackModal',false);
    $('feedbackSong').onchange=renderReview;
    document.querySelectorAll('[data-reaction]').forEach(b=>b.onclick=()=>{
      const already=b.classList.contains('selected');
      document.querySelectorAll('[data-reaction]').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false');});
      if(!already){b.classList.add('selected');b.setAttribute('aria-pressed','true');}
    });
    $('saveFeedback').onclick=saveReview;$('exportFeedback').onclick=exportFeedback;
    $('nowQueue').onclick=()=>{closeNow();renderQueue();modal('queueModal',true);};
    $('closeQueue').onclick=()=>modal('queueModal',false);
    ['feedbackModal','queueModal'].forEach(id=>$(id).onclick=e=>{if(e.target===$(id))modal(id,false);});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeNow();modal('feedbackModal',false);modal('queueModal',false);}});
    audio.addEventListener('play',syncPlayState);
    audio.addEventListener('pause',syncPlayState);
    audio.addEventListener('playing',syncPlayState);
    audio.addEventListener('timeupdate',updateProgress);
    audio.addEventListener('loadedmetadata',updateProgress);
    audio.addEventListener('durationchange',updateProgress);
    audio.addEventListener('ended',()=>{if(state.repeat){audio.currentTime=0;requestPlay();}else next();});
    audio.addEventListener('error',()=>{if(state.current)toast('Could not load this audio. Try another track.');});
  }
  function syncModes() {
    $('nowShuffle').classList.toggle('on',state.shuffle);
    $('nowRepeat').classList.toggle('on',state.repeat);
    $('nowShuffle').setAttribute('aria-pressed',String(state.shuffle));
    $('nowRepeat').setAttribute('aria-pressed',String(state.repeat));
  }
  async function start() {
    loadLocal();bind();
    try {
      const response=await fetch('listening-catalog.json?v=20261012c',{cache:'no-cache'});
      if(!response.ok)throw Error('Music library '+response.status);
      const data=await response.json();
      state.tracks=data.tracks||[];state.worlds=data.worlds||[];
      state.byId=new Map(state.tracks.map(t=>[t.id,t]));
      const feature=state.byId.get('already-arrived')||state.tracks[0];
      if(feature){$('heroCover').src=feature.image;$('heroBack').style.backgroundImage='url("'+feature.image+'")';}
      renderWorlds();renderPicks();renderLibrary();syncModes();syncPlayState();
      const id=new URL(location.href).searchParams.get('track');
      if(id&&state.byId.has(id)){queueFromContext(id);loadTrack(id,false);openNow();}
    } catch(err) {
      $('trackList').innerHTML='<div class="empty-state" style="display:block"><h3>Unable to load the listening library.</h3><p>Please reload the page or try again with a connection.</p></div>';
      $('worldGrid').textContent='The music library is temporarily unavailable.';
      console.error(err);
    }
  }
  start();
})();
