/* Frequency visual identity: one charcoal-blue Midnight palette.
   No alternate green theme, and no effect on player, favorites or library. */
(() => {
  'use strict';
  function choose(){
    document.documentElement.dataset.frequencyAppearance='midnight';
    const wordmark=document.querySelector('.mobile-logo b');
    if(wordmark)wordmark.textContent='frequency';
    const subtitle=document.querySelector('.brand-words small');
    if(subtitle)subtitle.textContent='LISTENING ROOM';
  }
  window.FrequencyAppearance={choose};
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',choose,{once:true});
  else choose();
})();
