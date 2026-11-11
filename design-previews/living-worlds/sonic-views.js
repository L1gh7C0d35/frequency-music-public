"use strict";
/*
 * FREQUENCY SONIC LAB — additive experimentation layer.
 * Browser-only, no native Frequency/AVPlayer integration.
 * Uses only real measured playback data from app.js's AnalyserNode.
 * Preserves the exact original and Beat Reactor as selectable baselines.
 */
(() => {
  const OPTIONS=[
    {id:"reactor",name:"Beat Reactor",tag:"HITS & PULSE",icon:"◉",detail:"Three living bands, sharp attacks"},
    {id:"silk",name:"Spectral Silk",tag:"FINE TEXTURE",icon:"≋",detail:"Dozens of musical light threads"},
    {id:"bloom",name:"Harmonic Bloom",tag:"OVERTONES",icon:"✳",detail:"A living, unfolding audio flower"},
    {id:"particles",name:"Sonic Stardust",tag:"TRANSIENTS",icon:"✦",detail:"Fine details turn into stars"},
    {id:"spectrum",name:"Spectrum Atlas",tag:"TIME & FREQUENCY",icon:"⌁",detail:"A moving map of sound history"},
    {id:"first",name:"The Original",tag:"YOUR FIRST FAVORITE",icon:"◎",detail:"The exact original three rings"}
  ];
  const PALETTES={
    prism:["#75f2ff","#b39cff","#f2a5dc"],
    aurora:["#81f7d9","#8ed2ff","#d7b2ff"],
    solar:["#ffd69e","#ffa27f","#eea3ff"]
  };
  const tune={detail:1.0,impact:1.0,palette:"prism"};
  const COLORS=()=>PALETTES[tune.palette]||PALETTES.prism;
  window.__sonicTune=tune;
  window.__sonicColors=COLORS();
  window.__frequencyImmersive=false;
  const $s=q=>document.querySelector(q);
  const device=$s("#device");
  const soundHistory=Array.from({length:3},()=>new Float32Array(168));
  let historyIndex=0,historySize=0,lastHistoryWrite=0;
  let pausedHold=0;
  let temporal,metricsLast=0;
  const active=()=>Boolean(state.playing&&analyser&&fft&&!audio.paused);
  const currentMode=()=>OPTIONS.find(o=>o.id===state.visualMode)||OPTIONS[0];
  const safe=(v,min,max)=>Math.min(max,Math.max(min,v));
  const r2=Math.PI*2;
  const bandPower=k=>active()?reactive.bands[k].envelope:0;
  const hit=k=>active()?reactive.bands[k].beat:0;
  const timeSeconds=()=>state.started?audio.currentTime:0;
  const spectrum=(i,k)=>{
    if(!active())return 0;
    const len=Math.min(fft.length,480);
    const idx=(Math.floor(i)+len)%len;
    return fft[idx]/255;
  };
  const fine=(idx,k,len=256)=>{
    if(!active())return 0;
    const c=Math.min(len,fft.length);
    const n=((Math.floor(idx+ k*13)%c)+c)%c;
    const sample=j=>fft[(j+c)%c]/255;
    return (sample(n)*6+(sample(n-1)+sample(n+1))*2+(sample(n-2)+sample(n+2)))/12;
  };
  const canvasSetup=canvas=>{
    const res=canvasSize(canvas);
    if(res){res.ctx.lineJoin="round";res.ctx.lineCap="round"}
    return res;
  };
  const mark=canvas=>{
    if(!canvas)return;
    canvas.dataset.sonicRenderMode=state.visualMode;
    if(!["reactor","first"].includes(state.visualMode))canvas.dataset.waveMotionStyle="sonic-"+state.visualMode+"-v6";
    canvas.dataset.waveActive=active()?"1":"0";
    canvas.dataset.signalBass=bandPower(0).toFixed(3);
    canvas.dataset.signalMid=bandPower(1).toFixed(3);
    canvas.dataset.signalHigh=bandPower(2).toFixed(3);
    canvas.dataset.signalBeat=hit(0).toFixed(3);
    canvas.dataset.signalDetail=tune.detail.toFixed(2);
    canvas.dataset.signalImpact=tune.impact.toFixed(2);
  };
  function ribbons(canvas,now){
    const c=canvasSetup(canvas);if(!c)return;
    const {ctx,w,h}=c,unit=Math.min(w,h),cx=w/2,cy=h/2,colors=COLORS();
    const p=now/1000,impact=tune.impact,detail=tune.detail;
    const count=Math.round(112+detail*45);
    const strands=Math.round(4+detail*5.5);
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(let k=0;k<3;k++){
      const pulse=bandPower(k),attack=hit(k);
      const base=unit*[.334,.386,.428][k],radiusCap=unit*.466;
      const strength=(5+pulse*18+attack*12)*impact;
      const lane=unit*.010;
      ctx.beginPath();
      for(let j=0;j<strands;j++){
        const spread=(j-(strands-1)/2)*lane*.35;
        const phase=j*.29+k*1.35;
        const curl=8+k*2;
        for(let i=0;i<=count;i++){
          const a=i/count*r2;
          const raw=fine(i/count*250+j*4,k);
          const wave=(Math.sin(a*(4+k)+p*(.74+k*.15)+phase)
             +Math.cos(a*(7+k)+p*(-.48+k*.08)-phase))*.31;
          const thread=(raw-.34)*.68 + wave*.54;
          const ripple=active()?thread*strength:wave*1.4;
          const radius=safe(base+spread+ripple,unit*.272,radiusCap);
          const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius;
          if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.closePath();
      }
      ctx.strokeStyle=colors[k];ctx.lineWidth=.52+.12*impact;
      ctx.globalAlpha=.32+.10*pulse;
      ctx.shadowColor=colors[k];ctx.shadowBlur=6+8*attack;
      ctx.stroke();
      // A single bright core thread gives a spine to each flowing material.
      ctx.beginPath();
      for(let i=0;i<=count;i++){
        const a=i/count*r2;
        const q=fine(i/count*250,k);
        const r=base+safe((q-.33)*strength*.8+
           Math.sin(a*(5+k)+p*(k===1?-.8:1.0))*(3+pulse*7)*impact,
           -unit*.075,unit*.075);
        if(i===0)ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
        else ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
      }
      ctx.closePath();ctx.lineWidth=1.2;ctx.globalAlpha=.78;
      ctx.shadowBlur=10;ctx.stroke();
    }
    ctx.restore();mark(canvas);
  }
  function bloom(canvas,now){
    const c=canvasSetup(canvas);if(!c)return;
    const {ctx,w,h}=c,unit=Math.min(w,h),cx=w/2,cy=h/2,colors=COLORS();
    const p=now/1000,impact=tune.impact,detail=tune.detail;
    const n=Math.round(180+detail*38);
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(let k=0;k<3;k++){
      const power=bandPower(k),attack=hit(k);
      const petals=Math.max(4,Math.round([5,9,14][k]*(.8+.20*detail)));
      const base=unit*[.339,.385,.425][k],cap=unit*.469;
      const phase=(k===1?-1:1)*p*(.10+.04*k);
      const swell=(5+power*14+attack*17)*impact;
      ctx.beginPath();
      for(let i=0;i<=n;i++){
        const a=i/n*r2;
        const overtone=(Math.sin(petals*a+phase+k)*.7 +
          Math.cos((petals-2)*a+phase*.5)*.22+
          Math.sin((petals+3)*a-phase*.71)*.10);
        const raw=fine(i/n*220,k);
        const sound=active()?swell*(overtone*.77+(raw-.35)*.36):2*overtone;
        const radius=safe(base+sound,unit*.286,cap);
        const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.strokeStyle=colors[k];ctx.lineWidth=1.35;
      ctx.globalAlpha=.87;ctx.shadowColor=colors[k];ctx.shadowBlur=8+attack*15;ctx.stroke();
      // A second shifted outline makes interwoven petals more dimensional.
      ctx.beginPath();
      for(let i=0;i<=n;i++){
        const a=i/n*r2;
        const radius=safe(base-5+Math.cos(petals*a+phase+.48)*(5+power*9)*impact,
          unit*.285,cap);
        if(i===0)ctx.moveTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);
        else ctx.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);
      }
      ctx.closePath();ctx.globalAlpha=.34;ctx.lineWidth=.7;ctx.shadowBlur=4;ctx.stroke();
    }
    ctx.restore();mark(canvas);
  }
  function stardust(canvas,now){
    const c=canvasSetup(canvas);if(!c)return;
    const {ctx,w,h}=c,unit=Math.min(w,h),cx=w/2,cy=h/2,colors=COLORS();
    const p=now/1000,impact=tune.impact,detail=tune.detail;
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(let k=0;k<3;k++){
      const power=bandPower(k),attack=hit(k);
      const base=unit*[.333,.383,.437][k];
      const particles=Math.round(55+detail*52);
      const shift=(k===1?-1:1)*p*(.10+.06*k);
      ctx.fillStyle=colors[k];ctx.shadowBlur=0;
      for(let i=0;i<particles;i++){
        // Deterministic constellation positions; sound controls their
        // radial distance/brightness, not random visual activity.
        const a=((i*.618033988749895)%1)*r2+shift;
        const q=fine(i*3.19+k*37,k);
        const pulse=active()?power*12+attack*(15+k*3)+(q-.25)*13*impact:0;
        const scatter=Math.sin(i*14.13+k*3.1)*12*detail;
        const radius=safe(base+scatter+pulse,unit*.275,unit*.468);
        const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius;
        const size=.8+(i%7===0?1.45:.55)+(active()?attack*1.15:0);
        ctx.globalAlpha=.40+.44*q+Math.min(.18,power*.20);
        ctx.fillRect(x-size/2,y-size/2,size,size);
      }
      // Luminous comet streaks tied to transients and different FFT bins.
      ctx.beginPath();
      for(let i=0;i<particles;i+=7){
        const a=((i*.618033988749895)%1)*r2+shift;
        const q=fine(i*3.19+k*37,k);
        const pulse=active()?power*12+attack*(15+k*3)+(q-.25)*13*impact:0;
        const scatter=Math.sin(i*14.13+k*3.1)*12*detail;
        const radius=safe(base+scatter+pulse,unit*.275,unit*.463);
        const trail=3+q*7*impact+attack*6;
        ctx.moveTo(cx+Math.cos(a)*(radius-trail),cy+Math.sin(a)*(radius-trail));
        ctx.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);
      }
      ctx.globalAlpha=.34+Math.min(.50,power*.35+attack*.29);
      ctx.strokeStyle=colors[k];ctx.lineWidth=.85;ctx.shadowColor=colors[k];ctx.shadowBlur=7;
      ctx.stroke();ctx.shadowBlur=0;
      ctx.beginPath();
      const spokes=Math.round(48+detail*28);
      for(let j=0;j<spokes;j++){
        const a=j/spokes*r2;
        const q=fine(j*2.4+k*18,k);
        const radius=safe(base+(q-.3)*15*impact+power*7,unit*.29,unit*.462);
        if(j===0)ctx.moveTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);
        else ctx.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);
      }
      ctx.closePath();ctx.globalAlpha=.24+.19*power;
      ctx.lineWidth=.58;ctx.strokeStyle=colors[k];ctx.shadowColor=colors[k];ctx.shadowBlur=5;ctx.stroke();
    }
    ctx.restore();mark(canvas);
  }
  function keepHistory(now){
    if(!active())return;
    if(now-lastHistoryWrite<35)return;
    lastHistoryWrite=now;
    for(let k=0;k<3;k++)soundHistory[k][historyIndex]=bandPower(k)*.76+hit(k)*.24;
    historyIndex=(historyIndex+1)%soundHistory[0].length;
    historySize=Math.min(soundHistory[0].length,historySize+1);
  }
  function atlas(canvas,now){
    const c=canvasSetup(canvas);if(!c)return;
    const {ctx,w,h}=c,unit=Math.min(w,h),cx=w/2,cy=h/2,colors=COLORS();
    const p=now/1000,impact=tune.impact,detail=tune.detail;
    keepHistory(now);
    ctx.save();ctx.globalCompositeOperation="lighter";
    // A growing ring of real listening history: each angle is an earlier
    // 35ms sample, not an aesthetic metronome.
    for(let k=0;k<3;k++){
      const base=unit*[.336,.377,.420][k];
      const n=Math.min(historySize,168);
      ctx.beginPath();
      for(let i=0;i<=168;i++){
        const angle=i/168*r2-Math.PI/2;
        const q=(historyIndex-1-i+168*3)%168;
        const value=(i<n)?soundHistory[k][q]:0;
        // Hann window: both ends meet at the same radius, so a past bass
        // transient never creates the ugly staircase seam at 12 o'clock.
        const blend=Math.sin(Math.PI*i/168)**2;
        const fineValue=active()?fine(i*1.5,k)*.29:0;
        const radius=safe(base+(value*26+fineValue*13)*impact*blend,unit*.288,unit*.468);
        const x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.closePath();ctx.globalAlpha=.88;ctx.lineWidth=1.4;ctx.strokeStyle=colors[k];
      ctx.shadowColor=colors[k];ctx.shadowBlur=8;ctx.stroke();
    }
    // Hairline spectral comb: 208 live frequency bins fan outward from
    // the outer history ring, revealing individual partials at a glance.
    const count=Math.round(88+detail*95),base=unit*.429;
    for(let k=0;k<3;k++){
      ctx.beginPath();
      for(let i=0;i<count;i++){
        if(i%3!==k)continue;
        const a=i/count*r2-Math.PI/2;
        const spectral=active()?fine(i*2.3,k):0;
        const tall=active()?(2+spectral*32*impact):1.2;
        const r1=base,r2p=safe(base+tall,base,unit*.474);
        ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);
        ctx.lineTo(cx+Math.cos(a)*r2p,cy+Math.sin(a)*r2p);
      }
      ctx.strokeStyle=colors[k];ctx.lineWidth=.72;ctx.globalAlpha=.42;
      ctx.shadowBlur=0;ctx.stroke();
    }
    ctx.restore();mark(canvas);
  }
  function drawMode(canvas,now){
    if(!canvas)return;
    switch(state.visualMode){
      case "silk":ribbons(canvas,now);break;
      case "bloom":bloom(canvas,now);break;
      case "particles":stardust(canvas,now);break;
      case "spectrum":atlas(canvas,now);break;
      default:originalWave(canvas,"player",reactive.energy,now);mark(canvas);break;
    }
  }
  const originalWave=drawWave;
  drawWave=function(canvas,mode,energy,now){
    if(mode!=="player"||state.visualMode==="reactor"||state.visualMode==="first"){
      const result=originalWave(canvas,mode,energy,now);
      if(mode==="player")mark(canvas);
      return result;
    }
    return drawMode(canvas,now);
  };
  const originalAnimate=animate;
  animate=function(now){
    originalAnimate(now);
    if(window.__frequencyImmersive){
      const canvas=$s("#sonicImmersiveCanvas");
      const energy=soundEnergy();
      if(state.visualMode==="reactor"||state.visualMode==="first")originalWave(canvas,"player",energy,now);
      else drawMode(canvas,now);
      mark(canvas);
    }
    if(now-metricsLast>90){metricsLast=now;updateMeters()}
  };
  const labHtml=()=>{
    return '<div id="sonicPanel" class="sonic-panel" hidden aria-hidden="true"><button class="sonic-shade" data-sonic="close" aria-label="Close visual lab"></button><section class="sonic-sheet" role="dialog" aria-modal="true" aria-label="Sonic Visual Lab">'+
      '<div class="sonic-sheet-head"><div><span class="sonic-eyebrow">FREQUENCY / SONIC STUDIO</span><h2>See every feeling.</h2><p>Six ways to see the same real song.</p></div><button data-sonic="close" class="sonic-sheet-close" aria-label="Close">×</button></div>'+
      '<div class="sonic-modes" id="sonicModes"></div>'+
      '<div class="sonic-meter-title"><span>LIVE AUDIO ENERGY</span><small>LOW · MID · HIGH</small></div>'+
      '<div class="sonic-levels">'+[0,1,2].map((k)=>'<div class="sonic-level"><span>'+["BASS","MIDS","HIGHS"][k]+'</span><div class="sonic-track"><i data-meter="'+k+'"></i></div></div>').join("")+'</div>'+
      '<div class="sonic-controls"><label><span>DETAIL</span><strong id="sonicDetailValue">100%</strong></label><input id="sonicDetail" aria-label="Visual detail" type="range" min="35" max="180" value="100" step="5"/>'+
      '<label><span>IMPACT</span><strong id="sonicImpactValue">100%</strong></label><input id="sonicImpact" aria-label="Reaction intensity" type="range" min="50" max="200" value="100" step="5"/></div>'+
      '<div class="sonic-palette-head">COLOR ATMOSPHERE</div><div class="sonic-palettes" id="sonicPalettes"></div>'+
      '<button data-sonic="immerse" class="sonic-immerse-action">✦ ENTER IMMERSIVE VISUALS <span>↗</span></button>'+
      '<p class="sonic-truth">The visuals respond to the recording’s combined frequency and timing data. Separating individual instruments would require separate audio stems or source separation.</p>'+
      '</section></div>';
  };
  const immersiveHtml=()=>'<div id="sonicImmersive" class="sonic-immersive" hidden aria-hidden="true">'+
    '<div class="sonic-imm-bg" id="sonicImmBg"></div>'+
    '<div class="sonic-imm-head"><button data-sonic="exitImmersive" class="sonic-imm-close">‹ PLAYER</button><span>FREQUENCY / IMMERSIVE</span><button data-sonic="open" class="sonic-imm-opts">✧ VIEWS</button></div>'+
    '<div class="sonic-imm-song"><span id="sonicImmWorld">FREQUENCY ORIGINALS</span><strong id="sonicImmTrack">Now playing</strong></div>'+
    '<div class="sonic-imm-stage"><canvas id="sonicImmersiveCanvas"></canvas><div class="sonic-imm-art"><img id="sonicImmArt" src="assets/velvet.jpg" alt="Currently playing artwork"></div></div>'+
    '<div class="sonic-imm-footer"><div class="sonic-imm-mode"><button data-sonic="prevMode" aria-label="Previous view">‹</button><div><small>VISUAL EXPERIENCE</small><strong id="sonicImmMode">Beat Reactor</strong></div><button data-sonic="nextMode" aria-label="Next view">›</button></div>'+
    '<div class="sonic-imm-signal">'+[0,1,2].map((k)=>'<div><span>'+["BASS","MIDS","HIGHS"][k]+'</span><div class="sonic-imm-meter"><i data-imm-meter="'+k+'"></i></div></div>').join("")+'</div>'+
    '<button data-sonic="playPause" id="sonicImmPause" class="sonic-imm-transport">Ⅱ Pause</button><p>True audio spectrum · original recording</p></div></div>';
  device.insertAdjacentHTML("beforeend",labHtml()+immersiveHtml());
  const renderModes=()=>{
    $s("#sonicModes").innerHTML=OPTIONS.map(o=>'<button class="sonic-mode-tile'+(state.visualMode===o.id?" active":"")+'" data-sonic-mode="'+o.id+'" aria-pressed="'+(state.visualMode===o.id?'true':'false')+'">'+
      '<span class="sonic-mode-icon sonic-icon-'+o.id+'">'+o.icon+'</span><span class="sonic-mode-copy"><strong>'+o.name+'</strong><small>'+o.tag+'</small></span></button>').join("");
    $s("#sonicPalettes").innerHTML=Object.keys(PALETTES).map(key=>{
      const c=PALETTES[key],chosen=tune.palette===key;
      return '<button data-sonic-palette="'+key+'" class="'+(chosen?'active':'')+'" aria-pressed="'+chosen+'"><i style="--c1:'+c[0]+';--c2:'+c[1]+';--c3:'+c[2]+'"></i>'+({prism:"Prism",aurora:"Aurora",solar:"Solar"}[key])+'</button>';
    }).join("");
    $s("#sonicDetail").value=String(Math.round(tune.detail*100));
    $s("#sonicImpact").value=String(Math.round(tune.impact*100));
    $s("#sonicDetailValue").textContent=Math.round(tune.detail*100)+"%";
    $s("#sonicImpactValue").textContent=Math.round(tune.impact*100)+"%";
  };
  const showPanel=()=>{
    renderModes();
    const p=$s("#sonicPanel");
    p.hidden=false;p.setAttribute("aria-hidden","false");
  };
  const closePanel=()=>{
    const p=$s("#sonicPanel");
    p.hidden=true;p.setAttribute("aria-hidden","true");
  };
  function refreshModeLabels(){
    const label=$s("#visualModeLabel");
    if(label)label.textContent=currentMode().name.toUpperCase()+" · TAP TO EXPLORE";
    if($s("#sonicImmMode"))$s("#sonicImmMode").textContent=currentMode().name;
    if(!$s("#sonicPanel").hidden)renderModes();
  }
  function chooseMode(mode){
    if(!OPTIONS.some(o=>o.id===mode))return;
    const old=state.visualMode;
    state.visualMode=mode;
    if(analyser && ((old==="first")!==(mode==="first")))configureAudioAnalysis();
    historySize=0;historyIndex=0;lastHistoryWrite=0;
    for(let k=0;k<3;k++)soundHistory[k].fill(0);
    refreshModeLabels();
  }
  const openImmersive=()=>{
    closePanel();
    if(state.route!=="player")navigate("player");
    const tr=TRACKS[state.song];
    $s("#sonicImmTrack").textContent=tr.title;
    $s("#sonicImmWorld").textContent=world(tr.world).title.toUpperCase();
    $s("#sonicImmArt").src=tr.art;
    $s("#sonicImmBg").style.backgroundImage="url('"+tr.art+"')";
    $s("#sonicImmPause").textContent=state.playing?"Ⅱ PAUSE":"▶ PLAY";
    const im=$s("#sonicImmersive");
    im.hidden=false;im.setAttribute("aria-hidden","false");
    window.__frequencyImmersive=true;
    refreshModeLabels();
  };
  const closeImmersive=()=>{
    window.__frequencyImmersive=false;
    const im=$s("#sonicImmersive");
    im.hidden=true;im.setAttribute("aria-hidden","true");
  };
  function actualMeter(k){
    if(!active())return 0;
    if(state.visualMode!=="first")return bandPower(k);
    // Meter the original track too, without altering the favorite v1
    // visualizer or its 512-point FFT and historical motion.
    const hz=audioCtx.sampleRate/analyser.fftSize;
    const ranges=[[45,190],[190,1900],[1900,10000]];
    const lo=Math.max(1,Math.floor(ranges[k][0]/hz));
    const hi=Math.min(fft.length-1,Math.ceil(ranges[k][1]/hz));
    let sum=0;
    for(let i=lo;i<=hi;i++)sum+=fft[i]/255;
    return safe(sum/Math.max(1,hi-lo+1)*[1.1,1.75,2.95][k],0,1);
  }
  function updateMeters(){
    const b=[0,1,2].map(k=>actualMeter(k));
    for(const el of device.querySelectorAll("[data-meter]")){
      const v=b[Number(el.dataset.meter)]||0;
      el.style.width=Math.round(v*100)+"%";
    }
    for(const el of device.querySelectorAll("[data-imm-meter]")){
      el.style.width=Math.round((b[Number(el.dataset.immMeter)]||0)*100)+"%";
    }
    const status=$s("#sonicImmPause");
    if(status)status.textContent=state.playing?"Ⅱ PAUSE":"▶ PLAY";
  }
  document.addEventListener("click",ev=>{
    const b=ev.target.closest("[data-sonic-mode],[data-sonic-palette],[data-sonic],[data-action]");
    if(!b)return;
    if(b.dataset.sonicMode){chooseMode(b.dataset.sonicMode);closePanel();return}
    if(b.dataset.sonicPalette){
      tune.palette=b.dataset.sonicPalette;
      window.__sonicColors=COLORS();
      renderModes();return;
    }
    if(b.dataset.action==="visuals"){showPanel();return}
    if(b.dataset.action==="immerse"){openImmersive();return}
    if(!b.dataset.sonic)return;
    switch(b.dataset.sonic){
      case "open":showPanel();break;
      case "close":closePanel();break;
      case "immerse":openImmersive();break;
      case "exitImmersive":closeImmersive();break;
      case "prevMode":
      case "nextMode":{
        const i=OPTIONS.findIndex(o=>o.id===state.visualMode);
        chooseMode(OPTIONS[(i+(b.dataset.sonic==="nextMode"?1:-1)+OPTIONS.length)%OPTIONS.length].id);
        break;
      }
      case "playPause":togglePlay();break;
    }
  });
  for(const [id,key] of [["sonicDetail","detail"],["sonicImpact","impact"]]){
    $s("#"+id).addEventListener("input",e=>{
      tune[key]=Number(e.target.value)/100;
      $s("#"+(key==="detail"?"sonicDetailValue":"sonicImpactValue")).textContent=e.target.value+"%";
    });
  }
  device.addEventListener("keydown",e=>{if(e.key==="Escape"){closePanel();closeImmersive()}});
  // A stable iPhone deep link opens the player directly, with a real song
  // ready but never auto-playing; Safari requires a user gesture for audio.
  const params=new URLSearchParams(location.search);
  if(params.get("lab")==="1"){
    const wanted=params.get("view")||"silk";
    if(OPTIONS.some(o=>o.id===wanted))chooseMode(wanted);
    const song=TRACKS[params.get("song")]?params.get("song"):"already-arrived";
    chooseSong(song,false);
  }
  refreshModeLabels();
  window.__sonicLab={
    modes:OPTIONS.map(({id,name})=>({id,name})),
    chooseMode,showPanel,closePanel,openImmersive,closeImmersive,
    getTuning:()=>({...tune}),
    getSignal:()=>reactive.bands.map(b=>({raw:b.raw,envelope:b.envelope,beat:b.beat}))
  };
})();
