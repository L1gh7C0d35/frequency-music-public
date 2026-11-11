# Frequency — Living Worlds · Interactive Creative Study
**2026-11-11 · first wave: 8 connected prototype screens**

Open the mobile site: https://lot-sussex-drill-ties.trycloudflare.com/

This is an isolated mockup built from real Frequency Artist World artwork and original publicly previewed music. It is not the native Frequency app, no account or saved data is connected, and no real TestFlight build was changed.

## Explore
- Home: swipe the luminous world to change Artist Worlds, Enter the world or Play its original lead track
- World: keep world identity and play the first genuine song
- Resonance Player: actual original M4A playback + spectrum-driven sound sculpture; seek/pause/play
- Sounds: Music and Tones are separate
- Tone Geometry: phi phyllotaxis and quiet user-started browser tone, no health claims
- 369: enter an intention, count Morning 3 / Midday 6 / Evening 9 in local demo
- Words: original illustrative incantation with a handoff to 369
- You: calm navigation to real destination families (concept links)

The page works locally via \`python3 serve_preview.py 8989\` (Python 3). This server supports M4A byte range streaming. The quick Cloudflare tunnel is temporary and depends on the Mac remaining online.

## Source and QA
- \`app.js\` and \`style.css\`: editable interactive prototype
- \`assets/\` / \`audio/\`: source-grounded copies, see \`asset-provenance.json\`
- \`study-*.png\`: individual iPhone 390×844 pt mockup screen renders
- \`qa-render.json\`: browser/audio/interaction receipt
- \`serve_preview.py\`: isolated range-aware preview server
- \`../../docs/design/FREQUENCY_LIVING_WORLDS_MOCKUP_LAB_20261111.md\`: design rationale, source reconciliation, waves and production guards

For technical correctness, start with the Nov 11 signed Build 48 receipt: it has **three real tabs (Home/Sounds/You)** rather than the older five-tab schematic.

## November 11: compare the original three rings with the new beat reactor

Open the Now Playing screen and **tap the centered RESONANCE title** to switch between FIRST VERSION and BEAT REACTOR while the same original track continues. The first version is retained unmodified as an A/B baseline (including its original sharp edges). Beat Reactor is the new default: cyan tracks bass/kicks, violet tracks midrange, and magenta responds to highs/transients. All of the movement comes from real audio, not a fixed animation.

Visual comparison: reactor-a-b.jpg. Technical details and test evidence are in the Frequency-App design QA folder. No production iOS source has been changed.

## V6 Sonic Visual Lab (November 11)
Six switchable real-audio views: Beat Reactor, Spectral Silk, Harmonic Bloom, Sonic Stardust, Spectrum Atlas, and preserved Original. Open the SONIC VISUAL LAB heading or the floating VIEWS button in Now Playing to pick modes and change Detail (35-180%), Impact (50-200%), or color atmosphere. Use IMMERSIVE for a large, standalone listening canvas. Live signal meters display low/mid/high spectral energy. Switching views does not interrupt playback.

**Fast iPhone link:** https://frequency-living-lab.vercel.app/?lab=1&view=silk&v=6
**Actual visual QA images:** sonic-lab-guide.html and studies/ folder.
**Truth:** Browser audio analysis displays mixed audio frequency energy and recent timing history, not isolated individual instruments or actual physiological frequencies. Production iOS app untouched.
