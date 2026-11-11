# Frequency Listening Room + Sonic Studio — one browser app

Date: 2026-11-11
GitHub repository: L1gh7C0d35/frequency-music-public
Canonical public app: https://l1gh7c0d35.github.io/frequency-music-public/
Direct unified visual experience: https://l1gh7c0d35.github.io/frequency-music-public/?track=already-arrived&sonic=1&visual=silk&tune=1

The Sonic Visual Lab is now an additive feature of the existing Listening Room's Now Playing, not a duplicate music player. Only one mainAudio element exists. Current song, queue, playlists, favorites, reviews, lyrics, shuffle, repeat, buffering, and audio media session remain owned by listening-room.js.

Added one in-place Visuals button, sonic-studio.js and sonic-studio.css, and a full-screen integrated overlay. Preserves original visual geometry, Beat Reactor, Spectral Silk, Harmonic Bloom, Stardust and Spectrum Atlas; immersive live sliders, palettes, reset and view navigation are all present.

The public site derives signal details from the same published recording using FFmpeg/NumPy at 20 updates per second, 96 spectrum bins and three frequency-energy/attack bands. A time-aligned asset is generated for every currently approved public catalog track, 71 at merge. Playback timing comes from the existing mainAudio.currentTime. No second audio stream or Web Audio signal rerouting; private listening audio remains private and always retains playback when visual data is unavailable.

Future public additions get matching analysis by running scripts/build_sonic_signals.py and committing its generated files alongside each new approved recording. The existing GitHub Pages workflow remains unmodified because the available GitHub OAuth token cannot update workflow files. The legacy design-previews/living-worlds experiment remains as a historical A/B reference only. Production Frequency iOS/TestFlight not changed.

QA: 25 preexisting Listening Room tests and 4 new public signal/privacy/one-player tests passed. All 71 public analysis data verified by frame counts. In an iPhone-size Chrome session served with HTTP Range, one song played with real time-aligned visuals, all six modes, live tuning, seek from approximately 15s to 23s, switching to another song, return to native Now Playing, and reopen without playback loss. Zero JS exceptions and no duplicate audio element. Physical iPhone Safari review remains pending.
