/* Frequency mobile listening companion. Current navigation; one shared player. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const ESC=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const INTENTS=[['all','For you'],['abundance','Abundance'],['confidence','Confidence'],['visualize','Visualize'],['focus','Focus'],['calm','Calm'],['sleep','Sleep'],['energy','Energy'],['gratitude','Gratitude'],['morning','Morning'],['future-self','Future self']];
  const PAGES=new Set(['home','new','music','you']);
  const LABELS={home:'Home',new:'New Music',music:'Music',you:'You'};
  let app,installPrompt=null;

  function tab(value) {
    const id=value==='sounds'?'music':(PAGES.has(value)?value:'home');
    if(app?.state?.activeWorld)app.closeWorld({restoreScroll:false});
    document.body.dataset.appTab=id;
    document.querySelectorAll('button[data-app-tab]').forEach(b=>{
      const active=b.dataset.appTab===id;
      b.classList.toggle('selected',active);
      if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    $('crumb').textContent=LABELS[id];
    $('newMusicScreen').hidden=id!=='new';
    $('youScreen').hidden=id!=='you';
    if(id==='music'){$('library').hidden=false;app.renderLibrary();}
    if(id==='new')renderNewMusic();
    if(id==='you')renderYou();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function filters() {
    $('intentFilters').innerHTML=INTENTS.map(([key,label])=>'<button data-intent="'+key+'" class="'+(key==='all'?'selected':'')+'">'+label+'</button>').join('');
    $('intentFilters').querySelectorAll('[data-intent]').forEach(b=>b.addEventListener('click',()=>{
      const goal=b.dataset.intent;app.state.previewGoal=goal;
      document.querySelectorAll('[data-intent]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.intent===goal));
      const matches=app.state.tracks.filter(t=>t.world!=='fresh-cuts' && !t.private && (goal==='all'||(t.goals||[]).includes(goal)));
      app.state.featuredIds=matches.slice(0,5).map(t=>t.id);
      app.renderPicks();app.renderLibrary();
      $('picks').scrollIntoView({block:'start',behavior:'smooth'});
    }));
    $('worldCount').textContent=app.state.worlds.filter(w=>w.id!=='fresh-cuts').length+' CURATED MUSIC WORLDS';
    document.querySelector('.brand-words small').textContent='LISTENING ROOM';
    const header=document.querySelector('.mobile-logo b');
    if(header)header.textContent='frequency';
    document.querySelector('.hero-kicker')?.setAttribute('title',app.state.tracks.length+' public recordings in Frequency');
  }

  function filterType(value) {
    app.state.previewType=value==='music'?'song':value;
    app.state.previewGoal='all';app.state.previewRecent=false;app.state.previewExperience='all';
    app.state.favoritesOnly=false;app.state.filter='all';app.state.query='';
    $('searchInput').value='';
    $('appModeRow').querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===value));
    app.renderLibrary();
  }
  function syncFilters() {
    const value=app.state.previewType==='song'?'music':app.state.previewType||'all';
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===value));
    document.querySelectorAll('[data-intent]').forEach(b=>b.classList.toggle('selected',b.dataset.intent===(app.state.previewGoal||'all')));
  }
  function shortcut(id) {
    if(id==='recent'){tab('new');return;}
    tab('music');filterType('all');
    if(id==='favorites'){app.state.favoritesOnly=true;app.renderLibrary();$('crumb').textContent='Favorites';}
    else if(id==='sleep'){app.state.previewGoal='sleep';app.renderLibrary();$('crumb').textContent='For sleep';}
    $('library').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function newTracks() {
    return app.state.tracks.filter(t=>t.new===true && t.type==='song' && t.source==='Public preview upload')
      .map((track,index)=>({track,index}))
      .sort((a,b)=>{
        const left=Date.parse(a.track.published_at||a.track.publishedAt||'')||0;
        const right=Date.parse(b.track.published_at||b.track.publishedAt||'')||0;
        return right-left||a.index-b.index;
      }).map(row=>row.track);
  }
  function renderNewMusic() {
    const tracks=newTracks();
    $('newMusicSummary').textContent=tracks.length
      ? tracks.length+' NEW ORIGINAL'+(tracks.length===1?'':'S')+' · EARLY LISTENING PREVIEWS'
      : 'NO NEW SONGS PUBLISHED YET';
    $('newMusicEmpty').hidden=tracks.length!==0;
    $('newMusicList').hidden=tracks.length===0;
    // One source of truth: identical album rows, queue and native HTML audio
    // playback used by artist-world albums. No separate audio host/decryption.
    app.renderSongRows($('newMusicList'),tracks);
  }
  function renderYou() {
    $('youFavorites').textContent=app.state.favorites.size;
    $('youNotes').textContent=Object.keys(app.state.reviews).length;
    $('youSongs').textContent=app.state.tracks.length;
  }
  function bind() {
    document.querySelectorAll('button[data-app-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.appTab)));
    document.querySelectorAll('[data-shortcut]').forEach(b=>b.addEventListener('click',()=>shortcut(b.dataset.shortcut)));
    document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>filterType(b.dataset.mode)));
    $('newBrowseAll').addEventListener('click',()=>{tab('music');filterType('all');});
    $('nowLyrics').addEventListener('click',()=>{
      if($('nowLyricsSection').hidden){app.toast('This recording has no lyrics to display.');}
      else $('nowLyricsSection').scrollIntoView({behavior:'smooth',block:'start'});
    });
    $('youOpenFavorites').addEventListener('click',()=>shortcut('favorites'));
    $('youOpenFeedback').addEventListener('click',app.openReview);
    $('youExport').addEventListener('click',app.exportFeedback);
    $('youShare').addEventListener('click',()=>app.share('Frequency Music · Listening Room',location.origin+location.pathname));
    $('installHelp').addEventListener('click',async()=>{
      if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}
      else app.toast('Use your browser’s Share or menu button to add Frequency to your home screen.');
    });
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
    window.addEventListener('appinstalled',()=>{app.toast('Frequency added to home screen');installPrompt=null;});
  }
  function ready() {
    app=window.FrequencyPreview;if(!app)return;
    window.FrequencyWebNavigation={tab,syncFilters,renderNewMusic};
    filters();syncFilters();renderYou();bind();
    const url=new URL(window.location.href);
    if(!app.state.activeWorld)tab(url.searchParams.get('tab')||'home');
    else {
      document.body.dataset.appTab='home';
      document.querySelectorAll('button[data-app-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.appTab==='home'));
    }
    if(url.searchParams.has('track'))app.openNow();
    if('serviceWorker' in navigator && location.protocol==='https:'){
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }
  }
  if(window.FrequencyPreview)ready();
  else document.addEventListener('frequency:ready',ready,{once:true});
})();
