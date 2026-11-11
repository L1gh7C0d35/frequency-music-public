/* Forest is Frequency's default. Midnight remains a reversible preference.
   The historic theme key is intentionally not migrated: the creator chose
   a fresh Forest default even on devices that previously used Midnight. */
(() => {
  'use strict';
  const KEY='frequency-theme-choice-v2';
  const root=document.documentElement;
  const chosen=()=>root.dataset.frequencyAppearance==='midnight'?'midnight':'current';
  function choose(value,save=false) {
    const selected=value==='midnight'?'midnight':'current';
    if(selected==='midnight')root.dataset.frequencyAppearance='midnight';
    else delete root.dataset.frequencyAppearance;
    const label=document.querySelector('.mobile-logo b');
    if(label)label.textContent=selected==='midnight'?'frequency':'frequency.';
    const subtitle=document.querySelector('.brand-words small');
    if(subtitle){
      const count=window.FrequencyPreview?.state?.tracks?.length;
      if(selected==='midnight')subtitle.textContent='LISTENING ROOM';
      else if(Number.isFinite(count))subtitle.textContent=count+' TRACKS · WEB COMPANION';
    }
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',selected==='midnight'?'#090c12':'#090d0c');
    document.querySelectorAll('.appearance-choice[data-appearance]').forEach(button=>{
      const active=button.dataset.appearance===selected;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-checked',String(active));
    });
    const hint=document.getElementById('appearanceHint');
    if(hint)hint.textContent=(selected==='midnight'
      ? 'Midnight: charcoal-blue listening room.'
      : 'Forest: the richer green Frequency atmosphere.')
      +' Your preference stays on this device.';
    if(save){try{localStorage.setItem(KEY,selected)}catch(_){}}
  }
  function setup() {
    choose(chosen(),false);
    const buttons=[...document.querySelectorAll('.appearance-choice[data-appearance]')];
    buttons.forEach((button,index)=>{
      button.addEventListener('click',()=>choose(button.dataset.appearance,true));
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
        event.preventDefault();
        const backwards=event.key==='ArrowLeft'||event.key==='ArrowUp';
        const next=(index+(backwards?-1:1)+buttons.length)%buttons.length;
        buttons[next].focus();
        choose(buttons[next].dataset.appearance,true);
      });
    });
    window.addEventListener('storage',event=>{
      if(event.key===KEY && root.dataset.frequencyView!=='classic')
        choose(event.newValue,false);
    });
  }
  window.FrequencyAppearance={choose};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();
