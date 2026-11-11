/* Frequency Sonic Studio — one player, six cinematic views.
   IMPORTANT: Uses precomputed signals from the 71 approved public songs,
   synchronized to the existing #mainAudio playback clock.
   Never attaches an AudioContext to the live player or creates another audio.
   Private recordings have no published visual analysis and stay private.
*/
(() => {
"use strict";
const audio=document.getElementById("mainAudio");
const root=document.getElementById("fxStudio");
if(!audio||!root)return;
const $=selector=>root.querySelector(selector);
const escapeHtml=str=>String(str??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const COLORS=()=>PALETTES[tune.palette]||PALETTES.prism;
const PALETTES={prism:["#75f2ff","#b39cff","#f2a5dc"],aurora:["#81f7d9","#8ed2ff","#d7b2ff"],solar:["#ffd69e","#ffa27f","#eea3ff"]};
const OPTIONS=[
 {id:"reactor",name:"Beat Reactor",icon:"◉",tag:"BASS · MIDS · HIGHS"},
 {id:"silk",name:"Spectral Silk",icon:"≋",tag:"FINE MUSICAL THREADS"},
 {id:"bloom",name:"Harmonic Bloom",icon:"✳",tag:"HARMONIC GEOMETRY"},
 {id:"particles",name:"Sonic Stardust",icon:"✦",tag:"BEATS · TRANSIENTS"},
 {id:"spectrum",name:"Spectrum Atlas",icon:"⌁",tag:"FREQUENCY HISTORY"},
 {id:"first",name:"The Original",icon:"◎",tag:"YOUR FIRST FAVORITE"},
];
const DEFAULT={mode:"silk",detail:1,impact:1,palette:"prism"};
function readSaved(){
 try{
  const v=JSON.parse(localStorage.getItem("frequency-sonic-prefs-v1")||"{}");
  return {
   mode:OPTIONS.some(m=>m.id===v.mode)?v.mode:DEFAULT.mode,
   detail:Number.isFinite(v.detail)?Math.min(1.8,Math.max(.35,v.detail)):1,
   impact:Number.isFinite(v.impact)?Math.min(2,Math.max(.5,v.impact)):1,
   palette:Object.hasOwn(PALETTES,v.palette)?v.palette:"prism"
  };
 }catch{return {...DEFAULT}}
}
const saved=readSaved();
const tune={detail:saved.detail,impact:saved.impact,palette:saved.palette};
const state={visualMode:saved.mode,started:false,playing:false};
window.__sonicTune=tune;
window.__sonicColors=COLORS();
const reactive={bands:[0,1,2].map(()=>({raw:0,envelope:0,beat:0})),energy:0};
let fft=new Uint8Array(512);
const analyser={fftSize:1024}; // only a geometry-reference shim, NOT AudioContext.
let app=null,manifest=null,signal=null,lastTrackId="",fetchToken=0,frameIndex=-1,historyLastTime=0;
let visible=false,frameHandle=0,lastUI=0,signalMessage="",analyzing=false;
let lastFrameEnergy=0;
const r2=Math.PI*2;
const safe=(v,min,max)=>Math.max(min,Math.min(max,v));
const soundHistory=Array.from({length:3},()=>new Float32Array(168));
let historyIndex=0,historySize=0,lastHistoryWrite=-1;
const active=()=>!!signal && !!lastTrackId && !audio.paused && !audio.ended && audio.readyState>=2;
const bandPower=k=>active()?reactive.bands[k].envelope:0;
const hit=k=>active()?reactive.bands[k].beat:0;
const timeSeconds=()=>Number.isFinite(audio.currentTime)?audio.currentTime:0;
function canvasSize(canvas){
 if(!canvas)return null;
 const dpr=Math.min(2,window.devicePixelRatio||1);
 const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;
 if(w<3||h<3)return null;
 const cw=Math.floor(w*dpr),ch=Math.floor(h*dpr);
 if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}
 const ctx=canvas.getContext("2d",{alpha:true});
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,w,h);
 return {ctx,w,h};
}
const canvasSetup=canvas=>{
 const res=canvasSize(canvas);
 if(res){res.ctx.lineJoin="round";res.ctx.lineCap="round"}
 return res;
};
function fine(idx,k,len=256){
 if(!active())return 0;
 const c=Math.min(len,fft.length);
 const n=((Math.floor(idx+k*13)%c)+c)%c;
 const sample=j=>fft[(j+c)%c]/255;
 return (sample(n)*6+(sample(n-1)+sample(n+1))*2+(sample(n-2)+sample(n+2)))/12;
}
function mark(canvas){
 if(!canvas)return;
 canvas.dataset.sonicRenderMode=state.visualMode;
 canvas.dataset.waveActive=active()?"1":"0";
 canvas.dataset.signalBass=bandPower(0).toFixed(3);
 canvas.dataset.signalMid=bandPower(1).toFixed(3);
 canvas.dataset.signalHigh=bandPower(2).toFixed(3);
 canvas.dataset.signalBeat=hit(0).toFixed(3);
 canvas.dataset.signalDetail=tune.detail.toFixed(2);
 canvas.dataset.signalImpact=tune.impact.toFixed(2);
}
function clearSignal(){
 signal=null;frameIndex=-1;historyLastTime=0;
 fft.fill(0);reactive.energy=0;
 for(const b of reactive.bands){b.raw=0;b.envelope=0;b.beat=0}
 for(const h of soundHistory)h.fill(0);
 historyIndex=0;historySize=0;lastHistoryWrite=-1;
}
function readTrackData(id){
 const appTrack=app?.state.byId.get(id);
 const row=manifest?.tracks.find(t=>t.id===id);
 if(appTrack?.private){signalMessage="Private listening remains private. No public visual analysis is available.";return}
 if(!row){signalMessage="This recording is not yet analyzed; the music still works normally.";return}
 const myToken=++fetchToken;
 signalMessage="Loading the song’s visual details…";analyzing=true;
 fetch(row.file,{cache:"force-cache"}).then(r=>{
  if(!r.ok)throw Error("Signal "+r.status);
  return r.json();
 }).then(j=>{
  if(fetchToken!==myToken||lastTrackId!==id)return;
  if(j.version!==1||j.trackId!==id||j.channels!==102||j.spectrumBins!==96||!Number.isInteger(j.frames)||j.frames<1||!Number.isInteger(j.sampleIntervalMs)||j.sampleIntervalMs<10)throw Error("Invalid signal format");
  const raw=atob(j.data),bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  if(bytes.length!==j.frames*j.channels)throw Error("Signal length mismatch");
  signal={trackId:id,bytes,frames:j.frames,channels:j.channels,interval:j.sampleIntervalMs/1000};
  signalMessage="REAL AUDIO · TRACK-SYNCED DETAIL";analyzing=false;
 }).catch(()=>{
  if(fetchToken!==myToken)return;
  analyzing=false;signalMessage="Visual details unavailable for this track. Music playback is unaffected.";
 });
}
function updateTrack(force=false){
 const id=app?.state.current||"";
 if(!force&&id===lastTrackId)return;
 lastTrackId=id;fetchToken++;clearSignal();analyzing=false;
 const track=app?.state.byId.get(id);
 if(track){
  $("#fxTrack").textContent=track.title||"Now Playing";
  $("#fxWorld").textContent=(track.artist||"Frequency Originals").toUpperCase();
  $("#fxArt").src=track.image||"artwork/already-arrived.jpg";
  $("#fxBackdrop").style.backgroundImage="url("+JSON.stringify(track.image||"artwork/already-arrived.jpg")+")";
 }else{
  $("#fxTrack").textContent="Choose a song";
  $("#fxWorld").textContent="FREQUENCY ORIGINALS";
 }
 if(id)readTrackData(id);
 else signalMessage="Choose a song in Frequency to begin.";
}
function updateFrameData(){
 state.started=Boolean(lastTrackId);
 state.playing=active();
 if(!active()){reactive.energy=0;for(const b of reactive.bands){b.envelope=0;b.beat=0;b.raw=0}return}
 const time=timeSeconds(),f=safe(time/signal.interval-1.28,0,signal.frames-1);
 const at=Math.floor(f),end=Math.min(signal.frames-1,at+1),mix=f-at;
 const A=at*signal.channels,B=end*signal.channels,values=signal.bytes;
 const interp=(k)=>(values[A+k]*(1-mix)+values[B+k]*mix)/255;
 for(let k=0;k<3;k++){
  const b=reactive.bands[k];
  b.envelope=interp(k);b.beat=interp(3+k);b.raw=b.envelope;
 }
 reactive.energy=reactive.bands[0].envelope*.43+reactive.bands[1].envelope*.34+reactive.bands[2].envelope*.23;
 // Restore a fine-grained 512-cell texture for the exact Original,
 // Beat Reactor, Spectral Silk, Bloom, Stardust and Atlas algorithms.
 for(let j=0;j<fft.length;j++){
  const x=j*(95/(fft.length-1));
  const left=Math.floor(x),right=Math.min(95,left+1),a=x-left;
  const val=interp(6+left)*(1-a)+interp(6+right)*a;
  fft[j]=Math.round(val*255);
 }
 frameIndex=at;
 if(Math.abs(time-historyLastTime)>0.7){
  // On seeking, discard visual history that came from a different song moment.
  for(const h of soundHistory)h.fill(0);
  historyIndex=0;historySize=0;lastHistoryWrite=-1;
 }
 historyLastTime=time;
}

function drawWaveFirst(canvas,mode,energy,time){
 const cfg=canvasSize(canvas);if(!cfg)return;const {ctx,w,h}=cfg,cx=w/2,cy=h/2,r=Math.min(w,h)*.407;
 const colors=mode==="player"?["#75f2ff","#b39cff","#f2a5dc"]:["#7eeafa","#baa7fb","#fa9ddf"];
 ctx.globalCompositeOperation="lighter";
 for(let layer=0;layer<3;layer++){
  let pts=[];const n=210;
  for(let i=0;i<=n;i++){let a=i/n*Math.PI*2;const si=fft&&state.playing?fft[(i*2+layer*19)%fft.length]/255:0;
   const wobble=(Math.sin(a*(3+layer*2)+time*.00036+layer)+Math.cos(a*(7-layer)+time*.00052))*(2.4+energy*7);
   const rad=r+(layer-1)*14+wobble+(mode==="player"?si*(energy>0?.8:0)*46:si*7);
   pts.push([cx+Math.cos(a)*rad,cy+Math.sin(a)*rad]);
  }
  ctx.beginPath();ctx.moveTo(...pts[0]);pts.forEach(p=>ctx.lineTo(...p));ctx.closePath();
  ctx.strokeStyle=colors[layer];ctx.lineWidth=layer===0?1.9:1.4;
  ctx.shadowColor=colors[layer];ctx.shadowBlur=18+energy*24;ctx.globalAlpha=.82;ctx.stroke();
 }
 for(let i=0;i<43;i++){const a=i/43*Math.PI*2+time*.000035*(i%2?-1:1),rad=r+29+Math.sin(time*.00016+i)*4;
 ctx.beginPath();ctx.arc(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad,i%7===0?1.5:.65,0,Math.PI*2);
 ctx.fillStyle=i%2===0?"#afeaff":"#d5b2ff";ctx.globalAlpha=.25+.25*Math.sin(time*.001+i)**2;ctx.fill()}
 ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";
}

function drawWaveReactor(canvas,mode,energy,time){
 const cfg=canvasSize(canvas);if(!cfg)return;
 const {ctx,w,h}=cfg,cx=w/2,cy=h/2,unit=Math.min(w,h);
 const active=Boolean(state.playing&&analyser&&fft&&!audio.paused);
 const colors=window.__sonicColors||["#75f2ff","#b39cff","#f2a5dc"];
 const bases=[unit*.333,unit*.379,unit*.417];
 const floors=[unit*.281,unit*.305,unit*.337];
 const ceilings=[unit*.434,unit*.460,unit*.471];
 const n=Math.round(162+54*(window.__sonicTune?.detail||1));
 const phase=state.started?audio.currentTime:0;
 const spectrumLength=Math.min(256,fft?fft.length:256);
 ctx.save();
 ctx.lineCap="round";ctx.lineJoin="round";ctx.globalCompositeOperation="lighter";
 if(active){
  // The inner circle physically expands on a real kick onset.
  const kick=reactive.bands[0].beat;
  if(kick>.13){
   ctx.beginPath();ctx.arc(cx,cy,unit*.291+kick*8,0,Math.PI*2);
   ctx.lineWidth=1.3+kick*1.8;ctx.strokeStyle="#75f2ff";
   ctx.globalAlpha=.04+kick*.19;ctx.shadowColor="#75f2ff";
   ctx.shadowBlur=4+kick*7;ctx.stroke();
  }
 }
 for(let layer=0;layer<3;layer++){
  const data=reactive.bands[layer];
  const power=active?data.envelope:0;
  const accent=active?data.beat:0;
  const transient=active?data.raw:0;
  const raw=new Float32Array(n),smooth=new Float32Array(n);
  let mean=0;
  if(active){
   // Preserve the FIRST VERSION's wild, per-bin spectral identity.
   // A shared wide-band texture keeps each colored path intensely alive,
   // while the distinct bass/mids/highs envelopes give each its own pulse.
   for(let i=0;i<n;i++)raw[i]=fft[(i*2+layer*19)%spectrumLength]/255;
   for(let i=0;i<n;i++){
    const at=j=>raw[(j+n)%n];
    smooth[i]=(at(i)*9+(at(i-1)+at(i+1))*3+
      (at(i-2)+at(i+2)))/17;
    mean+=smooth[i];
   }
   mean/=n;
  }
  const freqDetail=[52,59,65][layer],maxIn=bases[layer]-floors[layer],maxOut=ceilings[layer]-bases[layer];
  const orbitSpeed=(layer===1?-1:1)*phase*(.8+layer*.25);
  const motifSize=4+layer;
  ctx.beginPath();
  for(let i=0;i<=n;i++){
   const p=i%n,a=i/n*Math.PI*2;
   const soundOffset=active?(smooth[p]-mean)*freqDetail:0;
   const contour=(Math.sin(a*motifSize+orbitSpeed+layer)*(.35+power*.9)
           +Math.cos(a*(motifSize+4)-orbitSpeed*.8)*(.2+transient*.9))*(7+power*14+accent*7);
   const attack=active?accent*(14+4*layer)*(.62+.38*Math.sin(a*(2+layer)+orbitSpeed*1.4)):0;
   const push=active?(power*(layer===0?12:7)+attack):0;
   const detail=active?soundOffset*(.6+power*.8):0;
   const displacement=(push+contour+detail)*(window.__sonicTune?.impact||1);
   // Smooth saturation, not per-frame normalization. Kicks remain visibly
   // larger and high hats can create fast fine ripples without hard clipping.
   const normalized=displacement>=0
     ?maxOut*Math.tanh(displacement/Math.max(1,maxOut))
     :maxIn*Math.tanh(displacement/Math.max(1,maxIn));
   const r=bases[layer]+normalized;
   const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.globalAlpha=.93;ctx.lineWidth=layer===0?2.05:1.7;
  ctx.strokeStyle=colors[layer];ctx.shadowColor=colors[layer];
  ctx.shadowBlur=12+Math.min(15,power*12+accent*11);
  ctx.stroke();
 }
 const sparkle=active?reactive.bands[2].beat:0;
 if(sparkle>.085){
  // One batched stroke, not 12 separate shadow-blurred canvas draws.
  ctx.beginPath();ctx.shadowBlur=0;
  for(let j=0;j<12;j++){
   const a=j/12*Math.PI*2+phase*.28,r=unit*.456;
   const len=1.3+sparkle*4.3;
   ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
   ctx.lineTo(cx+Math.cos(a)*(r+len),cy+Math.sin(a)*(r+len));
  }
  ctx.strokeStyle="#f2a5dc";ctx.lineWidth=.65+sparkle*.48;
  ctx.globalAlpha=.08+sparkle*.42;ctx.stroke();
 }
 ctx.restore();
 canvas.dataset.waveActive=active?"1":"0";
 canvas.dataset.waveMotionStyle="bass-mid-high-beat-reactor-v5";
 canvas.dataset.visualMode=state.visualMode;
 canvas.dataset.waveEnergy=energy.toFixed(3);
 canvas.dataset.waveBass=reactive.bands[0].envelope.toFixed(3);
 canvas.dataset.waveMid=reactive.bands[1].envelope.toFixed(3);
 canvas.dataset.waveHigh=reactive.bands[2].envelope.toFixed(3);
 canvas.dataset.waveKick=reactive.bands[0].beat.toFixed(3);
 canvas.dataset.waveSnare=reactive.bands[1].beat.toFixed(3);
 canvas.dataset.waveHats=reactive.bands[2].beat.toFixed(3);
 canvas.dataset.waveSpectralSamples=active?String(n):"0";
}

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

function drawCurrent(canvas,now){
 if(!canvas)return;
 const time=audio.currentTime*1000;
 switch(state.visualMode){
  case "reactor":drawWaveReactor(canvas,"player",reactive.energy,time);break;
  case "first":drawWaveFirst(canvas,"player",reactive.energy,time);break;
  case "silk":ribbons(canvas,time);break;
  case "bloom":bloom(canvas,time);break;
  case "particles":stardust(canvas,time);break;
  case "spectrum":atlas(canvas,time);break;
 }
 mark(canvas);
}
const activeOption=()=>OPTIONS.find(o=>o.id===state.visualMode)||OPTIONS[0];
function writePrefs(){
 try{localStorage.setItem("frequency-sonic-prefs-v1",JSON.stringify({...tune,mode:state.visualMode}))}catch(_){}
}
function syncUI(){
 const o=activeOption();
 $("#fxModeName").textContent=o.name;
 $("#fxModeTag").textContent=o.tag;
 $("#fxPaletteButtons").innerHTML=Object.entries(PALETTES).map(([key,c])=>'<button type="button" data-fx-palette="'+key+'" aria-pressed="'+(tune.palette===key)+'" class="'+(tune.palette===key?'selected':'')+'"><i style="--a:'+c[0]+';--b:'+c[1]+';--c:'+c[2]+'"></i>'+key.slice(0,1).toUpperCase()+key.slice(1)+'</button>').join("");
 $("#fxModes").innerHTML=OPTIONS.map(x=>'<button type="button" data-fx-mode="'+x.id+'" aria-pressed="'+(state.visualMode===x.id)+'" class="'+(state.visualMode===x.id?'selected':'')+'"><span>'+x.icon+'</span><strong>'+x.name+'</strong></button>').join("");
 for(const [key,name] of [["detail","Detail"],["impact","Impact"]]){
  const node=$("#fx"+name),output=$("#fx"+name+"Value");
  if(node&&node!==document.activeElement)node.value=String(Math.round(tune[key]*100));
  if(output)output.textContent=Math.round(tune[key]*100)+"%";
  node.disabled=state.visualMode==="first";
 }
 $("#fxPaletteButtons").querySelectorAll("button").forEach(b=>b.disabled=state.visualMode==="first");
 $("#fxOriginalNote").hidden=state.visualMode!=="first";
 $("#fxActiveSource").textContent=signalMessage||"Waiting for a track";
 $("#fxActiveSource").classList.toggle("unavailable",!signal);
 $("#fxPlay").textContent=audio.paused?"▶ PLAY":"Ⅱ PAUSE";
}
function setTuner(show){
 $("#fxTuner").hidden=!show;root.classList.toggle("is-tuning",Boolean(show));
 $("#fxTuneButton").textContent=show?"✓ DONE":"◈ TUNE";
 $("#fxTuneButton").setAttribute("aria-expanded",String(Boolean(show)));
 syncUI();
}
function setModes(show){
 $("#fxModes").hidden=!show;root.classList.toggle("show-modes",Boolean(show));
 $("#fxViewsButton").textContent=show?"✓ DONE":"✧ VIEWS";
 $("#fxViewsButton").setAttribute("aria-expanded",String(Boolean(show)));
}
function chooseMode(id){
 if(!OPTIONS.some(o=>o.id===id))return;
 state.visualMode=id;writePrefs();
 for(const h of soundHistory)h.fill(0);
 historySize=0;historyIndex=0;lastHistoryWrite=-1;
 syncUI();
}
function openStudio(){
 if(!app?.state.current){
  const first=app?.state.byId.get("already-arrived")||app?.state.tracks?.[0];
  if(first)app.loadTrack(first.id,false);
 }
 if(!app?.state.current)return;
 updateTrack(true);
 visible=true;
 root.hidden=false;root.setAttribute("aria-hidden","false");
 app.openNow(); // native Listening Room remains underneath, same player.
 setModes(false);setTuner(false);
 root.querySelector('[data-fx="close"]').focus({preventScroll:true});
 frameHandle=requestAnimationFrame(tick);
}
function closeStudio(){
 visible=false;cancelAnimationFrame(frameHandle);
 root.hidden=true;root.setAttribute("aria-hidden","true");
 setModes(false);setTuner(false);
 document.getElementById("nowVisuals")?.focus({preventScroll:true});
}
function tick(now){
 if(!visible)return;
 updateTrack();
 updateFrameData();
 drawCurrent($("#fxCanvas"),now);
 if(now-lastUI>95){
  lastUI=now;
  $("#fxPlay").textContent=audio.paused?"▶ PLAY":"Ⅱ PAUSE";
  $("#fxPosition").textContent=toClock(audio.currentTime);
  $("#fxSignalBass").style.width=Math.round(bandPower(0)*100)+"%";
  $("#fxSignalMid").style.width=Math.round(bandPower(1)*100)+"%";
  $("#fxSignalHigh").style.width=Math.round(bandPower(2)*100)+"%";
  const source=$("#fxActiveSource");
  if(source.textContent!==signalMessage)source.textContent=signalMessage;
  source.classList.toggle("unavailable",!signal);
 }
 frameHandle=requestAnimationFrame(tick);
}
function toClock(seconds){const n=Math.max(0,Math.floor(Number(seconds)||0));return Math.floor(n/60)+":"+String(n%60).padStart(2,"0")}
root.addEventListener("click",event=>{
 const b=event.target.closest("[data-fx],[data-fx-mode],[data-fx-palette]");
 if(!b)return;
 if(b.dataset.fxMode){chooseMode(b.dataset.fxMode);setModes(false);return}
 if(b.dataset.fxPalette){
  if(state.visualMode==="first")return;
  tune.palette=b.dataset.fxPalette;
  window.__sonicColors=COLORS();
  writePrefs();syncUI();return;
 }
 const action=b.dataset.fx;
 switch(action){
  case "close":closeStudio();break;
  case "tune":setTuner($("#fxTuner").hidden);break;
  case "views":setModes($("#fxModes").hidden);break;
  case "prevMode":case "nextMode":{
   const index=OPTIONS.findIndex(x=>x.id===state.visualMode);
   chooseMode(OPTIONS[(index+(action==="nextMode"?1:-1)+OPTIONS.length)%OPTIONS.length].id);break;
  }
  case "play":app?.togglePlay();break;
  case "prevTrack":app?.next(true);break;
  case "nextTrack":app?.next();break;
  case "reset":Object.assign(tune,{detail:1,impact:1,palette:"prism"});
   window.__sonicColors=COLORS();writePrefs();syncUI();break;
 }
});
for(const [key,id] of [["detail","fxDetail"],["impact","fxImpact"]]){
 $("#"+id).addEventListener("input",event=>{
  if(state.visualMode==="first")return;
  tune[key]=safe(Number(event.target.value)/100,key==="detail"?.35:.5,key==="detail"?1.8:2);
  $("#"+(key==="detail"?"fxDetailValue":"fxImpactValue")).textContent=Math.round(tune[key]*100)+"%";
  writePrefs();
 });
 $("#"+id).addEventListener("change",()=>syncUI());
}
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&visible){event.preventDefault();closeStudio()}});
async function init(){
 app=window.FrequencyPreview;
 if(!app)return;
 document.getElementById("nowVisuals")?.addEventListener("click",openStudio);
 try{
  const r=await fetch("sonic-signals/manifest.json",{cache:"force-cache"});
  if(!r.ok)throw Error("Manifest "+r.status);
  manifest=await r.json();
  if(manifest.version!==1||!Array.isArray(manifest.tracks)||!manifest.tracks.length)throw Error("Invalid signal manifest");
 }catch(err){
  manifest={tracks:[]};signalMessage="Track detail unavailable; sound playback still works.";
 }
 // Deep link to one unified Listening Room app, not a second player/site.
 const query=new URLSearchParams(location.search);
 if(query.get("sonic")==="1"){
  if(!app.state.current){
   const id=query.get("track");
   if(id&&app.state.byId.has(id))app.loadTrack(id,false);
   else if(app.state.byId.has("already-arrived"))app.loadTrack("already-arrived",false);
  }
  if(query.get("visual")&&OPTIONS.some(x=>x.id===query.get("visual")))chooseMode(query.get("visual"));
  openStudio();
  if(query.get("tune")==="1")setTuner(true);
 }
}
syncUI();
if(window.FrequencyPreview)void init();
else document.addEventListener("frequency:ready",()=>void init(),{once:true});
window.FrequencySonicStudio={open:openStudio,close:closeStudio,chooseMode,getSettings:()=>({...tune,mode:state.visualMode}),getSignal:()=>reactive.bands.map(b=>({...b})),getTrack:()=>lastTrackId,hasSignal:()=>Boolean(signal),getFrameIndex:()=>frameIndex};
})();
