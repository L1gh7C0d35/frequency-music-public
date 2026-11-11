/* Reversible October 12 navigation within the same Frequency audio player.
   Retains all published tracks, current playback engine, feedback and favorites. */
(() => {
  'use strict';
  const KEY='frequency-web-view-v1';
  const THEME='frequency-theme-choice-v2';
  const root=document.documentElement;
  const $=id=>document.getElementById(id);
  const originalHero={};
  let app;
  const validSection=id=>['discover','worlds','music','favorites'].includes(id)?id:'discover';
  const isClassic=()=>root.dataset.frequencyView==='classic';
  function store(key,value){try{localStorage.setItem(key,value)}catch(_){}}
  function remembered(key){try{return localStorage.getItem(key)}catch(_){return null}}
  function removeRouteOverride(){
    const url=new URL(window.location.href);
    if(!url.searchParams.has('view'))return;
    url.searchParams.delete('view');
    window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);
  }
  function setAppearance(which) {
    if(window.FrequencyAppearance?.choose){
      window.FrequencyAppearance.choose(which,false);
    } else {
      if(which==='midnight')root.dataset.frequencyAppearance='midnight';
      else delete root.dataset.frequencyAppearance;
    }
  }
  function refreshChoices() {
    document.querySelectorAll('[data-view-choice]').forEach(button=>{
      const active=button.dataset.viewChoice===(isClassic()?'classic':'modern');
      button.setAttribute('aria-checked',String(active));
      button.classList.toggle('selected',active);
    });
    const hint=$('frequencyViewHint');
    if(hint)hint.textContent=isClassic()
      ? 'Classic is selected. All current songs and soundscapes are still here.'
      : 'Current five-tab navigation is selected.';
    const switchButton=$('switchToModern');
    if(switchButton)switchButton.textContent='Current view';
  }
  function applyHero(classic) {
    const kicker=document.querySelector('.hero-kicker');
    const heading=document.querySelector('#hero .hero-text h1');
    const description=document.querySelector('#hero .hero-text p');
    if(!kicker||!heading||!description)return;
    if(!originalHero.kicker){
      originalHero.kicker=kicker.innerHTML;
      originalHero.heading=heading.innerHTML;
      originalHero.description=description.textContent;
    }
    if(classic){
      kicker.innerHTML='<span class="kicker-line"></span> YOUR MOMENT HAS A SOUND';
      heading.innerHTML='Feel more.<br><i>Become more.</i>';
      description.textContent='Music for the mornings you rise, the moments you reflect, and everything you\u2019re becoming.';
    } else {
      kicker.innerHTML=originalHero.kicker;
      heading.innerHTML=originalHero.heading;
      description.textContent=originalHero.description;
    }
    document.querySelector('.nav-caption').textContent=classic?'YOUR SPACE':'FREQUENCY';
    document.querySelector('#worlds .section-eyebrow').textContent=classic
      ? 'GO WHERE THE MUSIC TAKES YOU':'ARTIST WORLDS';
    document.querySelector('#worlds .section-head h2').innerHTML=classic
      ? 'Find your sound <em>world.</em>':'Find your sound <em>world.</em>';
    if(classic)$('worldCount').textContent=app.state.worlds.length+' SOUND WORLDS';
    else $('worldCount').textContent=app.state.worlds.length+' ARTIST WORLDS';
  }
  function nav(section, options={}) {
    if(!app || !isClassic())return;
    const next=validSection(section);
    if(app.state.activeWorld && !options.preserveWorld)app.closeWorld({restoreScroll:false});
    if(!options.preserveWorld){
      app.resetLibrary();
      app.state.previewType='all';
      app.state.previewGoal='all';
      app.state.previewExperience='all';
      app.state.filter='all';
      app.state.favoritesOnly=next==='favorites';
      app.renderLibrary();
    }
    document.body.dataset.classicTab=next;
    const labels={discover:'Discover',worlds:'Sound worlds',music:'All music',favorites:'Favorites'};
    $('crumb').textContent=labels[next];
    document.querySelectorAll('button[data-classic-tab]').forEach(button=>{
      const selected=button.dataset.classicTab===next;
      button.classList.toggle('selected',selected);
      button.setAttribute('aria-current',selected?'page':'false');
    });
    if(!options.preserveScroll)window.scrollTo({top:0,behavior:'smooth'});
  }
  function view(value, options={}) {
    if(!app)return;
    const classic=value==='classic';
    if(classic)root.dataset.frequencyView='classic';
    else delete root.dataset.frequencyView;
    setAppearance(classic?'midnight':remembered(THEME)==='midnight'?'midnight':'current');
    applyHero(classic);
    if(classic){
      if(!app.state.activeWorld)window.FrequencyWebNavigation?.tab?.('home');
      nav(app.state.activeWorld?'worlds':'discover',{preserveWorld:!!app.state.activeWorld});
    } else {
      delete document.body.dataset.classicTab;
      app.resetLibrary();
      window.FrequencyWebNavigation?.tab?.('home');
    }
    refreshChoices();
    if(options.save!==false)store(KEY,classic?'classic':'modern');
    if(options.clearRoute!==false)removeRouteOverride();
  }
  function bind() {
    document.querySelectorAll('[data-classic-tab]').forEach(button=>{
      button.addEventListener('click',()=>nav(button.dataset.classicTab));
    });
    document.querySelectorAll('[data-view-choice]').forEach(button=>{
      button.addEventListener('click',()=>view(button.dataset.viewChoice));
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
        event.preventDefault();
        const next=button.dataset.viewChoice==='classic'?'modern':'classic';
        view(next);
        document.querySelector('[data-view-choice="'+next+'"]')?.focus();
      });
    });
    $('switchToModern').addEventListener('click',()=>view('modern'));
    const search=$('topSearch');
    const modernSearch=search.onclick;
    search.onclick=()=>{
      if(!isClassic())return modernSearch?.();
      nav('music');
      $('library').scrollIntoView({behavior:'smooth',block:'start'});
      $('searchInput').focus({preventScroll:true});
    };
    const browse=$('nowBrowse');
    const modernBrowse=browse.onclick;
    browse.onclick=()=>{
      if(!isClassic())return modernBrowse?.();
      app.closeNow();
      nav('music');
      $('library').scrollIntoView({behavior:'smooth',block:'start'});
    };
    window.addEventListener('storage',event=>{
      if(event.key===KEY)view(event.newValue==='classic'?'classic':'modern',{save:false,clearRoute:false});
    });
    window.FrequencyClassic={view,nav,isClassic};
  }
  function ready() {
    app=window.FrequencyPreview;
    if(!app)return;
    bind();
    // A Classic deep link selects the reversible local preference.
    // The 5-tab switch restores the current view; audio and feedback stay untouched.
    if(isClassic())view('classic',{save:true,clearRoute:false});
    else refreshChoices();
  }
  if(window.FrequencyPreview)ready();
  else document.addEventListener('frequency:ready',ready,{once:true});
})();
