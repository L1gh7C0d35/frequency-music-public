/* Frequency Beta44 web companion enhancements for Android/iOS browsers. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const ESC=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const INTENTS=[['all','For you'],['abundance','Abundance'],['confidence','Confidence'],['visualize','Visualize'],['focus','Focus'],['calm','Calm'],['sleep','Sleep'],['energy','Energy'],['gratitude','Gratitude'],['morning','Morning'],['future-self','Future self']];
  let app,mode='pure',deadline=0,remaining=300,ritualRunning=false,tick=null,installPrompt=null;
  let currentTab='home';
  function tab(id) {
    if(app?.state?.activeWorld)app.closeWorld({restoreScroll:false});
    currentTab=id;
    document.body.dataset.appTab=id;
    document.querySelectorAll('button[data-app-tab]').forEach(b=>{
      const active=b.dataset.appTab===id;
      b.classList.toggle('selected',active);
      if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    $('crumb').textContent=id.charAt(0).toUpperCase()+id.slice(1);
    ['ritualsScreen','wordsScreen','youScreen'].forEach(x=>$(x).hidden=!x.toLowerCase().startsWith(id));
    if(id==='sounds'){$('library').hidden=false;app.renderLibrary();}
    if(id==='you')renderYou();
    if(id==='words')renderLyrics();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function filters() {
    $('intentFilters').innerHTML=INTENTS.map(([key,label])=>'<button data-intent="'+key+'" class="'+(key==='all'?'selected':'')+'">'+label+'</button>').join('');
    $('intentFilters').querySelectorAll('[data-intent]').forEach(b=>b.addEventListener('click',()=>{
      const goal=b.dataset.intent;app.state.previewGoal=goal;
      document.querySelectorAll('[data-intent]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.intent===goal));
      const matches=app.state.tracks.filter(x=>goal==='all'||(x.goals||[]).includes(goal));
      app.state.featuredIds=matches.slice(0,5).map(x=>x.id);
      app.renderPicks();app.renderLibrary();
      $('picks').scrollIntoView({block:'start',behavior:'smooth'});
    }));
    const counts=app.state.tracks.length;
    $('worldCount').textContent=app.state.worlds.length+' ARTIST WORLDS';
    document.querySelector('.brand-words small').textContent=counts+' TRACKS · WEB COMPANION';
    const header=document.querySelector('.mobile-logo b');if(header)header.textContent='frequency.';
    const songCount=document.querySelector('.hero-kicker');
    if(songCount)songCount.setAttribute('title',counts+' tracks included from Frequency Beta44');
  }
  function filterType(value) {
    app.state.previewType=value==='music'?'song':value;
    app.state.previewGoal='all';app.state.previewRecent=false;app.state.previewExperience='all';
    app.state.favoritesOnly=false;app.state.filter='all';app.state.query='';
    $('searchInput').value='';
    $('appModeRow').querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===value));
    app.renderLibrary();
  }
  function syncFilters(){
    const value=app.state.previewType==='song'?'music':app.state.previewType||'all';
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===value));
    document.querySelectorAll('[data-intent]').forEach(b=>b.classList.toggle('selected',b.dataset.intent===(app.state.previewGoal||'all')));
  }
  function shortCut(id) {
    tab('sounds');filterType('all');
    $('library').scrollIntoView({behavior:'smooth',block:'start'});
    if(id==='favorites') {
      app.state.favoritesOnly=true;
      app.renderLibrary();$('crumb').textContent='Favorites';
    } else if(id==='recent'){
      app.state.previewRecent=true;app.renderLibrary();$('crumb').textContent='Recent uploads';
    } else if(id==='sleep'){
      app.state.previewGoal='sleep';app.renderLibrary();$('crumb').textContent='For sleep';
    }
  }
  function sortedMusic(){
    return app.state.tracks.filter(t=>t.type!=='soundscape' && t.lyrics?.trim());
  }
  function renderLyrics() {
    const select=$('wordsSong');const eligible=sortedMusic();
    if(!select.options.length)select.innerHTML=eligible.map(t=>'<option value="'+ESC(t.id)+'">'+ESC(t.title)+'</option>').join('');
    if(!select.dataset.initialized){
      if(app.state.current&&eligible.some(t=>t.id===app.state.current))select.value=app.state.current;
      select.dataset.initialized='1';
    }
    const track=app.state.byId.get(select.value);
    $('lyricsBody').textContent=track?.lyrics||'Lyrics are not available for this recording yet. Play another song or select a track from this list.';
    $('playWords').disabled=!track;
  }
  function renderYou() {
    $('youFavorites').textContent=app.state.favorites.size;
    $('youNotes').textContent=Object.keys(app.state.reviews).length;
    $('youSongs').textContent=app.state.tracks.length;
  }
  function ritualArtwork() {
    const t=app.state.byId.get($('ritualTrack').value);
    $('ritualArtwork').innerHTML=t?'<img src="'+ESC(t.image)+'" alt="'+ESC(t.title)+' cover artwork">':'';
  }
  const formatSeconds=s=>String(Math.floor(Math.max(0,s)/60)).padStart(2,'0')+':'+String(Math.max(0,s)%60).padStart(2,'0');
  function clock() {
    const secs=ritualRunning?Math.max(0,Math.ceil((deadline-Date.now())/1000)):remaining;
    $('ritualClock').textContent=formatSeconds(secs);
    if(ritualRunning&&secs===0){
      ritualRunning=false;clearInterval(tick);tick=null;remaining=0;
      $('startRitual').textContent='▶ Start again';
      $('ritualFocus').textContent='Session complete. Notice how you feel.';
      $('mainAudio').pause();
      app.toast('Listening ritual completed');
    }
  }
  function resetRitual() {
    ritualRunning=false;clearInterval(tick);tick=null;
    remaining=Number($('ritualMinutes').value)*60;
    $('startRitual').textContent='▶ Start listening';
    $('ritualFocus').textContent=mode==='guided'?'Set one intention. Listen with it in mind.':mode==='immersive'?'Let the artwork and the music set the scene.':'Music only. No steps to follow.';
    $('mainAudio').pause();clock();
  }
  function startRitual() {
    if(ritualRunning) {
      remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));
      ritualRunning=false;clearInterval(tick);tick=null;
      $('startRitual').textContent='▶ Resume session';
      $('mainAudio').pause();clock();return;
    }
    if(remaining<=0)remaining=Number($('ritualMinutes').value)*60;
    const id=$('ritualTrack').value;
    if(!app.state.byId.has(id))return;
    deadline=Date.now()+remaining*1000;ritualRunning=true;
    $('startRitual').textContent='Ⅱ Pause session';
    app.playTrack(id,false);
    clearInterval(tick);tick=setInterval(clock,500);clock();
  }
  function setupRituals() {
    const list=app.state.tracks.filter(t=>t.type==='soundscape'||(t.goals||[]).includes('calm')).slice(0,30);
    $('ritualTrack').innerHTML=list.map(t=>'<option value="'+ESC(t.id)+'">'+ESC(t.title)+'</option>').join('');
    if(!list.length){$('startRitual').disabled=true;return;}
    ritualArtwork();resetRitual();
  }
  function bind() {
    document.querySelectorAll('button[data-app-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.appTab)));
    document.querySelectorAll('[data-shortcut]').forEach(b=>b.addEventListener('click',()=>shortCut(b.dataset.shortcut)));
    document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>filterType(b.dataset.mode)));
    document.querySelectorAll('[data-ritual-mode]').forEach(b=>b.addEventListener('click',()=>{
      mode=b.dataset.ritualMode;
      document.querySelectorAll('[data-ritual-mode]').forEach(x=>x.classList.toggle('selected',x.dataset.ritualMode===mode));
      if(!ritualRunning)resetRitual();
    }));
    $('ritualTrack').addEventListener('change',()=>{if(ritualRunning)resetRitual();ritualArtwork();});
    $('ritualMinutes').addEventListener('change',resetRitual);
    $('startRitual').addEventListener('click',startRitual);
    $('resetRitual').addEventListener('click',resetRitual);
    $('wordsSong').addEventListener('change',renderLyrics);
    $('playWords').addEventListener('click',()=>{
      const id=$('wordsSong').value; if(id)app.playTrack(id,true);
    });
    $('noteWords').addEventListener('click',()=>{const id=$('wordsSong').value;if(id&&app.state.byId.has(id))app.loadTrack(id,false);app.openReview();});
    $('nowLyrics').addEventListener('click',()=>{
      const id=app.state.current;
      app.closeNow();tab('words');
      if(id&&Array.from($('wordsSong').options).some(o=>o.value===id)){
        $('wordsSong').value=id;renderLyrics();
      } else app.toast('This track has no text lyrics; choose another song above.');
    });
    $('youOpenFavorites').addEventListener('click',()=>shortCut('favorites'));
    $('youOpenFeedback').addEventListener('click',app.openReview);
    $('youExport').addEventListener('click',app.exportFeedback);
    $('youShare').addEventListener('click',()=>app.share('Frequency Music · Android web companion',location.origin+location.pathname));
    $('installHelp').addEventListener('click',async()=>{
      if(installPrompt) {
        installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;
      } else {app.toast('In Chrome tap ⋮ → Add to Home screen / Install app');}
    });
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
    window.addEventListener('appinstalled',()=>{app.toast('Frequency added to home screen');installPrompt=null;});
    document.addEventListener('visibilitychange',()=>{if(ritualRunning)clock();});
  }
  function ready() {
    app=window.FrequencyPreview;if(!app)return;
    // Update the existing site layout to Beta44's 5-tab navigation,
    // without impersonating unavailable native AlarmKit/StoreKit integrations.
    document.body.dataset.appTab='home';
    window.FrequencyWebNavigation={tab,syncFilters};
    filters();syncFilters();setupRituals();renderLyrics();renderYou();bind();
    if(!app.state.activeWorld)tab('home');
    const url=new URL(window.location.href);
    if(url.searchParams.has('track'))app.openNow();
    if('serviceWorker' in navigator && location.protocol==='https:'){
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }
  }
  if(window.FrequencyPreview)ready();
  else document.addEventListener('frequency:ready',ready,{once:true});
})();
