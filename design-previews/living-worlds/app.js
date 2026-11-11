"use strict";
const WORLD=[
{id:"velvet",title:"Velvet Sun",subtitle:"Warm soul · possibility · gratitude",type:"ORIGINAL ARTIST WORLD",count:10,accent:"#7af2ee",second:"#d5a9e2",intro:"A softer kind of confidence. Music that already feels like the life you choose.",songs:["open-to-more"],signature:"Warm soul, spacious grooves, and original melodies."},
{id:"future",title:"Future Signal",subtitle:"Luminous pop · future self",type:"ORIGINAL ARTIST WORLD",count:4,accent:"#7fe3ff",second:"#b4a0ff",intro:"A place for the version of you who knows the next chapter is already unfolding.",songs:["already-arrived"],signature:"Expansive original pop with cinematic melodic lift."},
{id:"apex",title:"Apex Rhythm",subtitle:"Hip-hop · trap · strength",type:"ORIGINAL ARTIST WORLD",count:4,accent:"#e5a4ff",second:"#73d7ff",intro:"Built for motion. Confident grooves with something real to say.",songs:["built-for-this"],signature:"Rhythmic original tracks for movement and action."},
{id:"iron",title:"Iron Horizon",subtitle:"Resilience · cinematic courage",type:"ORIGINAL ARTIST WORLD",count:7,accent:"#ed9fa4",second:"#a9b0fa",intro:"When courage meets the horizon. Heavy emotion, honest strength.",songs:["i-do-not-break"],signature:"Original cinematic courage and resilient voice."},
{id:"bloom",title:"Electric Bloom",subtitle:"Movement · energy · celebration",type:"ORIGINAL ARTIST WORLD",count:7,accent:"#e7a4ec",second:"#84edcc",intro:"Movement is a feeling. A world for bright rhythmic moments.",songs:["momentum-is-mine"],signature:"Joyful, rhythm-led original recordings."}
];
const TRACKS={
"open-to-more":{title:"Open to More",world:"velvet",duration:"3:40",src:"audio/open-to-more.m4a",art:"assets/velvet.jpg"},
"already-arrived":{title:"Already Arrived",world:"future",duration:"3:02",src:"audio/already-arrived.m4a",art:"assets/future.jpg"},
"built-for-this":{title:"Built for This",world:"apex",duration:"2:48",src:"audio/built-for-this.m4a",art:"assets/apex.jpg"},
"i-do-not-break":{title:"I Do Not Break",world:"iron",duration:"3:04",src:"audio/i-do-not-break.m4a",art:"assets/iron.jpg"},
"momentum-is-mine":{title:"Momentum Is Mine",world:"bloom",duration:"2:30",src:"audio/momentum-is-mine.m4a",art:"assets/bloom.jpg"}
};
const state={route:"home",worldIndex:0,selectedWorld:"velvet",song:"open-to-more",playing:false,preparing:false,error:"",toneOn:false,toneHz:432,tonePattern:"phi",phase:0,counts:[0,0,0],intention:"",extra:"",soundsMode:"music",started:false};
const $=(s)=>document.querySelector(s);
const device=$("#device"),host=$("#viewHost"),audio=$("#audio");
let audioCtx,analyser,mediaSource,fft,osc,gain,frame=0,animationId,toastId;
const world=(id)=>WORLD.find(w=>w.id===id)||WORLD[0];
function esc(s){return String(s||"").replace(/[&<>\"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function fmt(seconds){if(!Number.isFinite(seconds)||seconds<0)return "0:00";return Math.floor(seconds/60)+":"+String(Math.floor(seconds%60)).padStart(2,"0")}
function art(w){return "assets/"+w+".jpg"}
function header(title,withBack=false,right=""){return '<header class="screen-head">'+(withBack?'<button class="head-action" data-action="back" aria-label="Back">‹</button>':'')+'<h1>'+title+'</h1>'+(right||'<button class="head-action" data-action="info" aria-label="About this preview">ⓘ</button>')+'</header>'}
function button(label,action,kind="secondary"){return '<button class="'+kind+'" data-action="'+action+'">'+label+'</button>'}
function songFor(w){return TRACKS[world(w).songs[0]]}
function setupSkin(id){const w=world(id);device.style.setProperty("--hero-art","url('"+art(id)+"')");device.style.setProperty("--hero-accent",w.accent);device.style.setProperty("--world-second",w.second)}
function toast(s){const el=$("#toast");el.textContent=s;el.classList.add("show");clearTimeout(toastId);toastId=setTimeout(()=>el.classList.remove("show"),2800)}
function viewHome(){
 const w=WORLD[state.worldIndex],t=songFor(w.id);
 return '<section class="screen screen-home">'+header('frequency<span class="dot">.</span>',false,'<button class="head-action" data-action="rituals" aria-label="Open rituals">✦</button>')+
 '<div class="home-opening"><div class="overline">LIVING ORIGINAL MUSIC WORLDS</div><h2>Step inside<br><em>your sound.</em></h2><div class="muted">Every world has a feeling. Choose yours.</div></div>'+
 '<div class="world-orbit" id="worldOrbit" role="group" aria-label="Select Artist World"><canvas id="worldCanvas"></canvas><div class="world-photo"></div><div class="orbit-caption"><div class="tiny">ORIGINAL ARTIST WORLD</div><strong>'+w.title+'</strong><small>'+w.subtitle+'</small></div><div class="orbit-gesture"><button data-action="prevWorld" aria-label="Previous world">‹</button><span>SWIPE TO EXPLORE</span><button data-action="nextWorld" aria-label="Next world">›</button></div></div>'+
 '<div class="world-meta"><span><b>'+w.count+'</b> original recordings</span><span>•</span><span>Art-led listening</span></div>'+
 '<div class="home-lead">'+button('Enter '+w.title+' ↗','enterWorld','primary')+button('▶ Play','playWorld','secondary')+'</div>'+
 '<div class="signal-rail"><button data-action="rituals"><span>✧</span>369 Ritual</button><button data-action="words"><span>“</span>Words</button><button data-action="sounds"><span>◉</span>Tone Worlds</button><button data-action="you"><span>✦</span>Your Frequency</button></div>'+
 '<div class="section-head"><strong>For this moment</strong><span class="overline">ONE REAL SONG</span></div>'+
 '<div class="featured-track"><img src="'+t.art+'" alt=""><div class="info"><div class="top">FROM '+w.title.toUpperCase()+'</div><b>'+t.title+'</b><small>'+t.duration+' · Original recording</small></div><button data-action="playWorld" aria-label="Play '+t.title+'">▶</button></div>'+
 '<div class="home-end"><div class="muted">This is a living visual prototype. The music above is a real Frequency original; its visualizer responds only when playback is active.</div></div>'+
 '</section>';
}
function viewSounds(){
 return '<section class="screen">'+header('Sounds',false,'<button class="head-action" data-action="player" aria-label="Now Playing">♫</button>')+
 '<div class="overline">A WORLD FOR EVERY KIND OF LISTENING</div><div class="muted" style="margin:8px 0 13px">Original songs and generated tones are different instruments. Explore them separately.</div>'+
 '<div class="seg"><button data-action="musicMode" class="'+(state.soundsMode==="music"?"on":"")+'">Music</button><button data-action="toneMode" class="'+(state.soundsMode==="tones"?"on":"")+'">Tones</button></div>'+
 (state.soundsMode==="music"?'<div class="section-head"><strong>Original Artist Worlds</strong><span class="linklike">'+WORLD.length+' featured</span></div><div class="world-index">'+WORLD.map(w=>'<button class="world-tile" data-action="world:'+w.id+'" style="background-image:url('+art(w.id)+')"><strong>'+w.title+'</strong><small>'+w.subtitle.split(" · ")[0]+'</small></button>').join("")+'</div>':
 '<div class="section-head"><strong>Generated Tone Worlds</strong><span class="overline">NOT SONGS</span></div><div class="world-index"><button class="world-tile" data-action="toneLab" style="background-image:url(assets/phi.jpg)"><strong>Golden Ratio</strong><small>φ geometry · tone synth</small></button><button class="world-tile" data-action="toneLab" style="background-image:url(assets/pure.jpg)"><strong>Pure Frequencies</strong><small>Individual tones</small></button></div><div class="detail-explainer">Tone shapes are mathematical visualizations, not universal patterns proven to occur at a particular frequency. Binaural presets require stereo headphones.</div>')+
 '<div class="home-end"></div></section>';
}
function viewWorld(){
 const w=world(state.selectedWorld),song=songFor(w.id);
 return '<section class="screen screen-world"><div class="world-hero" style="--hero-art:url('+art(w.id)+')"><button class="world-back" data-action="sounds">‹</button><div class="world-hero-copy"><span>'+w.type+'</span><h1>'+w.title+'</h1><p>'+w.subtitle+'</p></div></div>'+
 '<div class="world-transport">'+button('▶ Play '+w.title,'playWorld','primary')+button('More Worlds ↗','sounds','secondary')+'</div>'+
 '<div class="section-head"><strong>Original recordings</strong><span class="linklike">'+w.count+' in this world</span></div>'+
 '<button class="track-row" data-action="song:'+w.songs[0]+'"><img src="'+song.art+'" alt=""><div class="song"><b>'+song.title+'</b><small>Frequency Originals · '+song.duration+'</small></div><span class="play">▶</span><span class="menu">⋯</span></button>'+
 '<div class="detail-explainer"><span class="overline">ABOUT THE SOUND</span><p>'+w.intro+'</p><p style="margin-bottom:0">'+w.signature+'</p></div>'+
 '<div class="muted" style="margin-top:13px">This concept includes a playable lead song from each real world. The shipping catalog retains the full '+w.count+'-recording collection.</div>'+
 '</section>';
}
function viewPlayer(){
 const t=TRACKS[state.song],w=world(t.world),isCurrent=state.playing && !state.preparing;
 return '<section class="screen player-screen">'+
 '<div class="player-top"><button class="round-btn" data-action="back" aria-label="Close player">⌄</button><strong>RESONANCE · NOW PLAYING</strong><button class="round-btn" data-action="queue" aria-label="Queue">⋯</button></div>'+
 '<div class="resonance-stage" id="resonanceStage"><canvas id="resonanceCanvas"></canvas><div class="album-vessel"><img src="'+t.art+'" alt="Artwork for '+t.title+'"></div><div class="sound-state">'+(isCurrent?"LIVE AUDIO":"IDLE VISUAL")+'</div></div>'+
 '<div class="player-copy"><h1>'+t.title+'</h1><p>'+w.title+' · Frequency Originals</p><div class="real-state" id="playState">'+(state.error?"AUDIO UNAVAILABLE":state.preparing?"PREPARING AUDIO":state.playing?"PLAYING ORIGINAL RECORDING":"PAUSED · READY TO LISTEN")+'</div></div>'+
 '<input class="seek" type="range" min="0" max="1000" value="'+(audio.duration?Math.floor(audio.currentTime/audio.duration*1000):0)+'" data-action="seek" id="seek" aria-label="Seek track"><div class="seek-times"><span id="elapsed">'+fmt(audio.currentTime)+'</span><span id="remaining">−'+(audio.duration?fmt(audio.duration-audio.currentTime):t.duration)+'</span></div>'+
 '<div class="transport"><button data-action="shuffle" aria-label="Shuffle">⤨</button><button data-action="prevTrack" aria-label="Previous">◀◀</button><button class="main-play" data-action="togglePlay" aria-label="Play or pause">'+(state.preparing?'…':state.playing?'Ⅱ':'▶')+'</button><button data-action="nextTrack" aria-label="Next">▶▶</button><button data-action="repeat" aria-label="Repeat">↻</button></div>'+
 '<div class="player-utilities"><button data-action="lyrics"><span>〝</span>Lyrics</button><button data-action="queue"><span>≡</span>Queue</button><button data-action="output"><span>◉</span>Output</button><button data-action="share"><span>↗</span>Share</button></div>'+
 (state.extra?'<div class="extra-sheet"><h3>'+({queue:"Up next",lyrics:"Lyrics",output:"Audio output",share:"Share"}[state.extra]||"Details")+'</h3>'+({queue:'The next original track follows the selected world. Queue edits and saved history remain in the native app.',lyrics:'Original full lyrics remain in the Frequency native player. This prototype does not invent or synchronize words.',output:'Playback uses your device’s current browser audio route.',share:'Use your browser’s sharing controls to share this preview; no account data is exposed.'}[state.extra]||'')+'<br><button data-action="closeExtra">Close</button></div>':'')+
 '<div class="player-queue"><img src="'+songFor(WORLD[(WORLD.findIndex(a=>a.id===w.id)+1)%WORLD.length].id).art+'" alt=""><div class="qinfo"><b>Continue exploring worlds</b><small>Next sound · choose another Artist World</small></div><button class="ghost" data-action="sounds">Explore ↗</button></div>'+
 '</section>';
}
function viewTones(){
 return '<section class="screen screen-tones">'+header('Tone Geometry',true)+
 '<div class="overline">GENERATED SOUND · NOT A SONG</div><div style="font-size:31px;letter-spacing:-1px;font-weight:760;margin:8px 0 0">Music of mathematics.</div><div class="muted">A living illustration of ratio and rhythm, not a claim of biological effects.</div>'+
 '<div class="tone-orb"><canvas id="toneCanvas"></canvas><div class="tone-centre"><span>φ</span><small>GOLDEN RATIO</small></div></div>'+
 '<div class="tone-controls"><div class="tone-row">'+[432,528,639].map(h=>'<button data-action="setTone:'+h+'" class="'+(state.toneHz===h?'on':'')+'">'+h+' Hz</button>').join("")+'</div><label><span>Carrier frequency</span><strong id="toneLabel">'+state.toneHz+' Hz</strong></label><input type="range" min="174" max="963" step="1" id="toneRange" value="'+state.toneHz+'" aria-label="Carrier frequency">'+
 '<label><span>Geometry detail</span><strong>φ · 1.618…</strong></label><input type="range" min="60" max="250" step="1" value="180" id="densityRange" aria-label="Geometry density">'+button(state.toneOn?'■ Stop tone preview':'▶ Preview gentle tone','tonePlay','primary')+'</div>'+
 '<div class="tone-disclosure">This generates a quiet, user-started sine tone in your browser. Frequency labels are compositional parameters—not medical treatment or proven manifestation mechanisms. Start at a comfortable volume.</div></section>';
}
function viewRituals(){
 const caps=[3,6,9],n=state.counts[state.phase],phase=["MORNING","MIDDAY","EVENING"][state.phase];
 return '<section class="screen">'+header('Rituals',true)+
 '<div class="overline">YOUR 369 PRACTICE · LOCAL DEMO</div><div style="font:italic 25px Georgia,serif;margin:13px 0 4px;color:#edddff">Give intention a rhythm.</div><div class="muted">Morning 3 · Midday 6 · Evening 9. One quiet act at a time.</div>'+
 '<div class="ritual-hero"><canvas id="ritualCanvas"></canvas><div class="ritual-center"><span class="big">'+n+'/'+caps[state.phase]+'</span><span class="small">'+phase+' PRACTICE</span></div></div>'+
 '<div class="phase-rail">'+["Morning","Midday","Evening"].map((x,i)=>'<button class="'+(state.phase===i?'on':'')+'" data-action="phase:'+i+'">'+x+'<strong>'+state.counts[i]+' / '+caps[i]+'</strong></button>').join("")+'</div>'+
 '<div class="intention-field"><label for="intention">I AM ALREADY …</label><textarea id="intention" placeholder="Write one present-tense intention…" rows="2">'+esc(state.intention)+'</textarea></div>'+
 '<button class="primary ritual-primary" data-action="count" '+(!state.intention.trim()||n===caps[state.phase]?'disabled':'')+'>'+(!state.intention.trim()?'Write your intention first':n===caps[state.phase]?'This phase is complete ✓':'Count this intention · '+(n+1)+' of '+caps[state.phase])+'</button>'+
 '<button class="ghost" style="display:block;margin:15px auto 0;color:#c7bdff" data-action="words">Explore incantations in Words ↗</button>'+
 '<div class="ritual-notice">This screen uses example local counts and is not connected to your saved 369 history. Practice counts only change when you tap.</div></section>';
}
function viewWords(){
 return '<section class="screen">'+header('Words',true)+
 '<div class="overline">INCANTATIONS · FUTURE SELF</div><div class="muted" style="margin:9px 0 11px">A beautiful sentence can make the next action feel inevitable.</div>'+
 '<div class="words-visual"><div class="words-sigil">∞</div><div class="words-quote">“I am not chasing<br>the future.<br><em>I am living it.</em>”<div class="caption">ORIGINAL CONCEPT COPY · PRESENT TENSE</div></div></div>'+
 '<div class="word-actions">'+button('✦ Practice in 369','wordsTo369','primary')+button('♡ Save idea','saveWord','secondary')+'</div>'+
 '<div class="detail-explainer"><div class="overline">A DIFFERENT KIND OF READING</div><p>One line. One feeling. One decision to embody it. The native Words library still contains Incantations, Visualize, Quotes, Principles, Actions and Saved; this is an experimental presentation of an incantation.</p></div>'+
 '</section>';
}
function viewYou(){
 return '<section class="screen">'+header('Your Frequency',false)+
 '<div class="overline">A QUIET SPACE FOR YOUR PRACTICE</div><h2 class="you-title">Everything returns<br>to you.</h2>'+
 '<div class="you-hero"><div class="mark">φ</div><h2>Make it yours.</h2><p>Choose your music, shape your rituals, save what resonates. No invented scores or streaks.</p></div>'+
 '<div class="you-list"><button data-action="sounds"><span>♫</span><span>Your listening library</span>›</button><button data-action="rituals"><span>✦</span><span>Continue your 369 practice</span>›</button><button data-action="words"><span>〝</span><span>Words & incantations</span>›</button><button data-action="toneLab"><span>φ</span><span>Generated tone worlds</span>›</button></div>'+
 '<div class="muted" style="margin-top:20px">Plan status, saved music and reminders belong to the real signed-in app; none are simulated here.</div></section>';
}
const VIEWS={home:viewHome,sounds:viewSounds,world:viewWorld,player:viewPlayer,tones:viewTones,rituals:viewRituals,words:viewWords,you:viewYou};
function navigate(name,opts={}){
 if(state.toneOn&&name!=="tones")stopTone();
 state.route=name;state.extra="";
 if(opts.world)state.selectedWorld=opts.world;
 if(name==="player"){device.classList.add("player-mode")}else{device.classList.remove("player-mode")}
 if(name==="home")setupSkin(WORLD[state.worldIndex].id);
 else if(name==="world")setupSkin(state.selectedWorld);
 else if(name==="player")setupSkin(TRACKS[state.song].world);
 else if(name==="tones")setupSkin("future");
 else setupSkin(name==="rituals"?"apex":name==="words"?"future":"velvet");
 host.innerHTML=VIEWS[name]();
 host.scrollTop=0;
 const navVisible=!["player","world","tones","rituals","words"].includes(name);
 $("#bottomNav").style.display=navVisible?"flex":"none";
 document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active",x.dataset.nav===name));
 if(name==="world")$("#bottomNav").style.display="none";
 updateMini();
 if(name==="rituals"){$("#intention").addEventListener("input",e=>{state.intention=e.target.value;const b=$('[data-action="count"]');b.disabled=!state.intention.trim()||state.counts[state.phase]===[3,6,9][state.phase];b.textContent=!state.intention.trim()?"Write your intention first":"Count this intention · "+(state.counts[state.phase]+1)+" of "+[3,6,9][state.phase]})}
 if(name==="tones"){const e=$("#toneRange");e.addEventListener("input",ev=>{state.toneHz=+ev.target.value;$("#toneLabel").textContent=state.toneHz+" Hz";setToneFrequency(state.toneHz)});$("#densityRange").addEventListener("input",()=>{})}
 if(name==="player"){const seek=$("#seek");seek.addEventListener("input",ev=>{if(Number.isFinite(audio.duration))audio.currentTime=+ev.target.value/1000*audio.duration})}
 renderLabMenu();
}
function renderLabMenu(){
 const labels=[["home","01 · Living Worlds Home"],["world","02 · Artist World"],["player","03 · Resonance Player"],["sounds","04 · Sounds / Music"],["tones","05 · Tone Geometry"],["rituals","06 · 369 Constellation"],["words","07 · Words / Identity"],["you","08 · Your Frequency"]];
 $("#labMenu").innerHTML=labels.map(([id,label])=>'<button data-go="'+id+'" class="'+(state.route===id?'active':'')+'"><span>'+label.slice(0,2)+'</span>'+label.slice(5)+'</button>').join("");
}
function updateMini(){
 const mini=$("#miniPlayer"),hide=["player","world","tones","rituals","words"].includes(state.route)||!state.started;
 mini.classList.toggle("hidden",hide);
 if(hide)return;
 const t=TRACKS[state.song];mini.innerHTML='<img src="'+t.art+'" alt=""><div class="txt" data-action="player"><b>'+t.title+'</b><span>'+(state.playing?"Now playing":"Paused")+' · '+world(t.world).title+'</span></div><button data-action="togglePlay" aria-label="Play pause">'+(state.playing?'Ⅱ':'▶')+'</button>';
}
function switchWorld(delta){state.worldIndex=(state.worldIndex+delta+WORLD.length)%WORLD.length;setupSkin(WORLD[state.worldIndex].id);navigate("home")}
function chooseSong(id,auto=true){if(!TRACKS[id])return;const changed=state.song!==id;state.song=id;if(changed||!state.started){audio.pause();audio.src=TRACKS[id].src;audio.load();state.started=true}navigate("player");if(auto)playMusic();else updateMini()}
function prepareContext(){
 const C=window.AudioContext||window.webkitAudioContext;
 if(!C)return;
 if(!audioCtx)audioCtx=new C();
 if(analyser)return;
 analyser=audioCtx.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=.74;fft=new Uint8Array(analyser.frequencyBinCount);
 mediaSource=audioCtx.createMediaElementSource(audio);mediaSource.connect(analyser);analyser.connect(audioCtx.destination);
}
async function playMusic(){
 stopTone();
 if(!state.started){chooseSong(state.song,true);return}
 state.error="";state.preparing=true;refreshPlayerStatus();
 try{
   prepareContext();
   // Start media directly in the tap gesture; Safari can lose activation across awaits.
   const playback=audio.play();
   if(audioCtx?.state==="suspended")void audioCtx.resume().catch(()=>{});
   await playback;state.playing=true;state.preparing=false;refreshPlayerStatus();
 }catch(err){state.error=err?.message||"Playback unavailable";state.playing=false;state.preparing=false;refreshPlayerStatus();toast("This song could not start here. Try again.")}
}
function pauseMusic(){audio.pause();state.playing=false;state.preparing=false;refreshPlayerStatus()}
function togglePlay(){if(state.playing)pauseMusic();else playMusic()}
function refreshPlayerStatus(){
 if(state.route==="player"){
 const el=$("#playState");if(el)el.textContent=state.error?"AUDIO UNAVAILABLE":state.preparing?"PREPARING AUDIO":state.playing?"PLAYING ORIGINAL RECORDING":"PAUSED · READY TO LISTEN";
 const p=$(".main-play");if(p)p.textContent=state.preparing?"…":state.playing?"Ⅱ":"▶";
 const a=$(".sound-state");if(a)a.textContent=state.playing?"LIVE AUDIO":"IDLE VISUAL";
 }
 updateMini();
}
audio.addEventListener("play",()=>{state.playing=true;state.preparing=false;refreshPlayerStatus()});
audio.addEventListener("pause",()=>{state.playing=false;state.preparing=false;refreshPlayerStatus()});
audio.addEventListener("waiting",()=>{state.preparing=true;refreshPlayerStatus()});
audio.addEventListener("playing",()=>{state.preparing=false;state.playing=true;refreshPlayerStatus()});
audio.addEventListener("ended",()=>{state.playing=false;state.preparing=false;refreshPlayerStatus()});
audio.addEventListener("error",()=>{state.playing=false;state.preparing=false;state.error="Failed to load audio";refreshPlayerStatus()});
audio.addEventListener("timeupdate",()=>{if(state.route!=="player")return;const d=audio.duration,v=audio.currentTime;const el=$("#elapsed"),rem=$("#remaining"),seek=$("#seek");if(el)el.textContent=fmt(v);if(rem)rem.textContent="−"+(Number.isFinite(d)?fmt(d-v):TRACKS[state.song].duration);if(seek&&Number.isFinite(d))seek.value=Math.floor(v/d*1000)});
function nextTrack(delta){const i=WORLD.findIndex(w=>w.id===TRACKS[state.song].world);chooseSong(WORLD[(i+delta+WORLD.length)%WORLD.length].songs[0],true)}
function setToneFrequency(h){if(osc&&state.toneOn){osc.frequency.setTargetAtTime(h,audioCtx.currentTime,.04)}}
function stopTone(){if(!state.toneOn)return;state.toneOn=false;try{gain?.gain.setTargetAtTime(0,audioCtx.currentTime,.04);const previousOsc=osc;setTimeout(()=>{try{previousOsc?.stop()}catch(e){}},200)}catch(e){}if(state.route==="tones")navigate("tones")}
async function toggleTone(){
 if(state.toneOn){stopTone();return}
 if(state.playing)pauseMusic();
 try{
   if(!audioCtx){const C=window.AudioContext||window.webkitAudioContext;audioCtx=new C()}
   if(audioCtx.state==="suspended")await audioCtx.resume();
   const o=audioCtx.createOscillator(),g=audioCtx.createGain();
   o.type="sine";o.frequency.value=state.toneHz;g.gain.value=0;
   o.connect(g);g.connect(audioCtx.destination);o.start();
   g.gain.setTargetAtTime(.018,audioCtx.currentTime,.12);
   osc=o;gain=g;state.toneOn=true;navigate("tones");
 }catch(e){toast("Tone preview is unavailable in this browser.")}
}
function handleAction(a){
 if(a==="back"){navigate(["world","player"].includes(state.route)?"sounds":"home");return}
 if(a==="info"){toast("An interactive concept — not connected to your account or TestFlight.");return}
 if(a==="prevWorld"){switchWorld(-1);return}if(a==="nextWorld"){switchWorld(1);return}
 if(a==="enterWorld"){state.selectedWorld=WORLD[state.worldIndex].id;navigate("world");return}
 if(a==="playWorld"){const w=state.route==="world"?state.selectedWorld:WORLD[state.worldIndex].id;chooseSong(world(w).songs[0]);return}
 if(a.startsWith("world:")){state.selectedWorld=a.split(":")[1];navigate("world");return}
 if(a.startsWith("song:")){chooseSong(a.split(":")[1]);return}
 if(a==="togglePlay"){togglePlay();return}if(a==="player"){navigate("player");return}
 if(a==="nextTrack"){nextTrack(1);return}if(a==="prevTrack"){nextTrack(-1);return}
 if(a==="shuffle"||a==="repeat"){toast("This concept keeps playback simple. Queue and repeat are preserved in the real player.");return}
 if(["queue","lyrics","output","share"].includes(a)){state.extra=state.extra===a?"":a;navigateWithExtra();return}
 if(a==="closeExtra"){state.extra="";navigateWithExtra();return}
 if(a==="musicMode"){state.soundsMode="music";navigate("sounds");return}
 if(a==="toneMode"){state.soundsMode="tones";navigate("sounds");return}
 if(a==="toneLab"){navigate("tones");return}
 if(a.startsWith("setTone:")){state.toneHz=+a.split(":")[1];setToneFrequency(state.toneHz);navigate("tones");return}
 if(a==="tonePlay"){toggleTone();return}
 if(a.startsWith("phase:")){state.phase=+a.split(":")[1];navigate("rituals");return}
 if(a==="count"){
  if(!state.intention.trim()){toast("Write one intention before counting.");return}
  const cap=[3,6,9][state.phase];if(state.counts[state.phase]<cap)state.counts[state.phase]++;
  const done=state.counts[state.phase]===cap;navigate("rituals");if(done)toast("This phase is complete. Your next practice is ready.");
  return;
 }
 if(a==="wordsTo369"){state.intention="I am already living the future I choose.";state.phase=0;navigate("rituals");toast("Incantation added to this demo practice.");return}
 if(a==="saveWord"){toast("Design preview only — no account data was changed.");return}
 if(["sounds","home","you","rituals","words"].includes(a)){navigate(a);return}
}
function navigateWithExtra(){const ex=state.extra;host.innerHTML=viewPlayer();state.extra=ex;const seek=$("#seek");if(seek)seek.addEventListener("input",ev=>{if(Number.isFinite(audio.duration))audio.currentTime=+ev.target.value/1000*audio.duration});refreshPlayerStatus()}
document.addEventListener("click",e=>{const a=e.target.closest("[data-action], [data-go], [data-nav]");if(!a)return;const action=a.dataset.action||a.dataset.go||a.dataset.nav;handleAction(action)});
let swipeStart=null;document.addEventListener("pointerdown",e=>{const el=e.target.closest("#worldOrbit");if(el)swipeStart=e.clientX});document.addEventListener("pointerup",e=>{if(swipeStart===null)return;const dist=e.clientX-swipeStart;swipeStart=null;if(Math.abs(dist)>45)switchWorld(dist<0?1:-1)});
function canvasSize(canvas){if(!canvas)return null;const dpr=Math.min(2,window.devicePixelRatio||1),rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;if(w===0||h===0)return null;const cw=Math.floor(w*dpr),ch=Math.floor(h*dpr);if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return {ctx,w,h}}
function soundEnergy(){if(state.playing&&analyser&&fft){analyser.getByteFrequencyData(fft);let e=0;for(let i=3;i<115&&i<fft.length;i++)e+=fft[i];return e/(Math.min(115,fft.length)-3)/255}return 0}
function drawWave(canvas,mode,energy,time){
 const cfg=canvasSize(canvas);
 if(!cfg)return;
 const {ctx,w,h}=cfg,cx=w/2,cy=h/2;
 const unit=Math.min(w,h);
 const active=Boolean(state.playing&&fft&&analyser);
 // Six averaged spectral bands: every deformation remains a continuous harmonic.
 // Never map raw, discontinuous FFT-bin indices directly onto a circular path.
 const bands=[0,0,0,0,0,0];
 if(active){
  const start=4,span=Math.min(156,fft.length-start);
  for(let k=0;k<bands.length;k++){
   const from=start+Math.floor(span*k/bands.length);
   const to=start+Math.floor(span*(k+1)/bands.length);
   let sum=0;
   for(let j=from;j<to;j++)sum+=fft[j];
   bands[k]=sum/Math.max(1,to-from)/255;
  }
 }
 const colors=["#75f2ff","#b39cff","#f2a5dc"];
 const motion=time*(active?.00031:.000055);
 const maxRadius=unit/2-22; // includes glow margin, so no clipped edges
 for(let layer=0;layer<3;layer++){
  const radius=unit*(.347+.038*layer);
  const phase=layer*1.19;
  const n=240;
  ctx.beginPath();
  let minR=999,maxR=0;
  for(let i=0;i<=n;i++){
   const a=i/n*Math.PI*2;
   const ambient=2.8*Math.sin(a*(3+layer)+motion+phase)
                +2.2*Math.cos(a*(6+layer)+motion*.71-phase)
                +1.25*Math.sin(a*9-motion*.4+phase);
   const response=active?
       10.0*bands[(layer+1)%6]*Math.sin(a*4+motion*1.18+phase)
      +7.0*bands[(layer+3)%6]*Math.cos(a*7-motion*.9-phase)
      +4.3*bands[(layer+5)%6]*Math.sin(a*11+motion*.55+phase)
      :0;
   const rad=Math.max(unit*.295,Math.min(maxRadius,radius+ambient+response));
   minR=Math.min(minR,rad);maxR=Math.max(maxR,rad);
   const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.lineWidth=layer===1?1.9:1.65;
  ctx.lineJoin="round";ctx.lineCap="round";
  ctx.strokeStyle=colors[layer];
  ctx.shadowColor=colors[layer];
  ctx.shadowBlur=8+(active?Math.min(1,energy)*11:3);
  ctx.globalAlpha=.87;
  ctx.stroke();
  ctx.globalAlpha=.24;
  ctx.lineWidth=3.1;
  ctx.shadowBlur=17;
  ctx.stroke();
 }
 // Contained shimmer points — atmosphere, never a discontinuous waveform.
 ctx.shadowBlur=0;ctx.globalAlpha=1;
 const partR=unit*.45;
 for(let i=0;i<40;i++){
  const a=i/40*Math.PI*2+motion*.1;
  const r=partR+Math.sin(i*6+motion)*1.5;
  ctx.beginPath();
  ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,i%6===0?1.1:.55,0,Math.PI*2);
  ctx.fillStyle=i%2===0?"#b6eeff":"#e4bcff";
  ctx.globalAlpha=.19+.2*(.5+.5*Math.sin(i+motion));
  ctx.fill();
 }
 ctx.globalAlpha=1;
}
function drawTone(canvas,time){
 const c=canvasSize(canvas);if(!c)return;const {ctx,w,h}=c,cx=w/2,cy=h/2;
 const density=+($("#densityRange")?.value||180),phi=Math.PI*(3-Math.sqrt(5));
 ctx.globalCompositeOperation="lighter";
 for(let i=1;i<=density;i++){const n=i/density,a=i*phi+time*.000055,r=Math.sqrt(n)*w*.42;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;const k=i/density;
  ctx.beginPath();ctx.arc(x,y,(i%4?1.8:2.9)+(state.toneOn?.75:0),0,Math.PI*2);
  ctx.fillStyle=i%4===0?"#e3bfff":i%3===0?"#7de6fc":"#91afff";ctx.globalAlpha=.3+.56*(1-k);ctx.shadowBlur=7;ctx.shadowColor=ctx.fillStyle;ctx.fill();
 }
 ctx.globalAlpha=.3;ctx.lineWidth=.7;ctx.strokeStyle="#a0d7ff";for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(cx,cy,w*(.35+j*.035),h*(.17+j*.02),j*Math.PI/6+time*.000025,0,Math.PI*2);ctx.stroke()}
 ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.globalCompositeOperation="source-over";
}
function drawRitual(canvas,time){
 const c=canvasSize(canvas);if(!c)return;const {ctx,w,h}=c,cx=w/2,cy=h/2;const caps=[3,6,9];
 ctx.globalCompositeOperation="lighter";
 caps.forEach((cap,j)=>{
  const r=78+j*28,col=["#85eaf5","#beabf9","#ecaaef"][j];const start=-Math.PI/2;
  ctx.strokeStyle="#b8b4ea70";ctx.shadowColor="#ada8f3";ctx.shadowBlur=8;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  for(let k=0;k<cap;k++){const a=start+(k/cap)*Math.PI*2;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r,on=k<state.counts[j];
   ctx.fillStyle=on?col:"#a7a3cf";ctx.globalAlpha=on?1:.65;ctx.shadowColor=col;ctx.shadowBlur=on?18:0;ctx.beginPath();ctx.arc(x,y,on?5.8:3.5,0,Math.PI*2);ctx.fill();
  }
  const progress=state.counts[j]/cap;ctx.beginPath();ctx.arc(cx,cy,r,start,start+Math.PI*2*progress);
  ctx.lineWidth=3.5;ctx.strokeStyle=col;ctx.globalAlpha=.85;ctx.stroke();
 });
 for(let i=0;i<20;i++){let a=i*Math.PI*2/20+time*.000012,r=133+Math.sin(i*7)*7;ctx.fillStyle="#cbd7ff";ctx.globalAlpha=.2;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,1,0,Math.PI*2);ctx.fill()}
 ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";
}
function animate(t){
 frame++;
 if(state.route==="home"){const canvas=$("#worldCanvas");if(canvas)drawWave(canvas,"home",soundEnergy(),t)}
 if(state.route==="player"){const canvas=$("#resonanceCanvas");if(canvas)drawWave(canvas,"player",soundEnergy(),t)}
 if(state.route==="tones"){const canvas=$("#toneCanvas");if(canvas)drawTone(canvas,t)}
 if(state.route==="rituals"){const canvas=$("#ritualCanvas");if(canvas)drawRitual(canvas,t)}
 animationId=requestAnimationFrame(animate);
}
window.addEventListener("keydown",e=>{
 if(["ArrowLeft","ArrowRight"].includes(e.key)&&state.route==="home"){e.preventDefault();switchWorld(e.key==="ArrowRight"?1:-1)}
 if(e.key==="Escape"&&!["home","sounds","you"].includes(state.route))navigate("home");
});
window.addEventListener("pagehide",()=>{if(state.toneOn)stopTone()});
setupSkin("velvet");navigate("home");animationId=requestAnimationFrame(animate);
