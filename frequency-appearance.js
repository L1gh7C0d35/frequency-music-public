/* Frequency web appearance: reversible and independent of playback state.
   Default stays the existing forest palette. Local preference never changes audio. */
(() => {
  'use strict';
  const KEY='frequency-web-appearance-v1';
  const root=document.documentElement;
  const valid=v=>v==='midnight'?'midnight':'current';
  const selected=()=>valid(root.dataset.frequencyAppearance);
  function choose(value, save) {
    const next=valid(value);
    if(next==='midnight')root.dataset.frequencyAppearance='midnight';
    else delete root.dataset.frequencyAppearance;
    const mobileWordmark=document.querySelector('.mobile-logo b');
    if(mobileWordmark)mobileWordmark.textContent=next==='midnight'?'frequency':'frequency.';
    const sidebarSubtitle=document.querySelector('.brand-words small');
    if(sidebarSubtitle) {
      const count=window.FrequencyPreview?.state?.tracks?.length;
      if(next==='midnight')sidebarSubtitle.textContent='LISTENING ROOM';
      else if(Number.isFinite(count))sidebarSubtitle.textContent=count+' TRACKS · WEB COMPANION';
    }
    document.querySelectorAll('.appearance-choice[data-appearance]').forEach(button=>{
      const active=button.dataset.appearance===next;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-checked',String(active));
    });
    const hint=document.getElementById('appearanceHint');
    if(hint)hint.textContent=(next==='midnight'
      ? 'Original Midnight is selected. The October 12 colors and logo styling are back.'
      : 'Forest is selected. The current Frequency colors are active.')
      +' This choice stays on this device.';
    if(save){try{localStorage.setItem(KEY,next)}catch(_){/* Private browsing may disable storage. */}}
  }
  function start() {
    choose(selected(),false);
    const buttons=[...document.querySelectorAll('.appearance-choice[data-appearance]')];
    buttons.forEach((button,index)=>{
      button.addEventListener('click',()=>choose(button.dataset.appearance,true));
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
        event.preventDefault();
        const next=(index+(event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length;
        buttons[next].focus();
        choose(buttons[next].dataset.appearance,true);
      });
    });
    window.addEventListener('storage',event=>{
      if(event.key===KEY)choose(valid(event.newValue),false);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
