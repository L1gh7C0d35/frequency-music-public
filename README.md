# Frequency · Listening Room

Public, mobile-first listening space for the tracks already published at:

**https://l1gh7c0d35.github.io/frequency-music-public/**

This GitHub Pages site is a *music listening and feedback preview*, not the private Music Label release dashboard. Spotify, YouTube distributor submissions, rights review, and Content ID do not happen here.

## Experience
- Responsive dark, cinematic interface inspired by Frequency's sound worlds and Timekeeper's music player
- Hero feature, four coherent *editorial* worlds (Velvet Sun, Iron Horizon, Quiet Atlas, Electric Bloom)
- Browse, search, play/pause, seek, next/previous, repeat, shuffle, queue
- Miniplayer and immersive Now Playing, Media Session controls where supported
- Favorites and listening notes saved on-device with localStorage
- Export listening notes using iOS Share Sheet (where supported) or downloaded JSON; **no remote collection server**
- Deep share links with ?track=slug (never auto-play on opening a link)
- All audio/artwork references point to files already in this public repository

Sound worlds are not verified musician identities or official streaming-artist profiles. Existing music credits read **Frequency Originals**.

## Architecture
- `index.html` — primary responsive listening site
- `music.html` — compatibility redirect for old share links
- `listening-room.css` and `listening-room.js` — presentation and player controls
- `listening-catalog.json` — deterministic catalog of public tracks
- `scripts/build_listening_catalog.py` — recreates catalog from existing public audio/artwork; parses metadata from `legacy-library.html` after migration
- `scripts/test_listening_room.py` — source integrity smoke tests
- `legacy-library.html` / `legacy-music.html` — prior listening homepage versions, retained for reference
- Standalone `song-*.html` and test lab pages remain in place.

## Update and test
```sh
python3 scripts/build_listening_catalog.py
python3 -m unittest discover -s scripts -p 'test_listening_room.py' -v
node --check listening-room.js
python3 -m http.server 8765
```
Open http://127.0.0.1:8765 to preview locally. The website itself does not need Node or Python at runtime.

## Public / private boundary
**Do not** upload unreleased Flow outputs, master files, rights documents, private studio database or user feedback exports to this public repo. Publish only music and artwork consciously selected for public listening. Keep approval and rights tracking in `/Users/darbybeenken/Developer/Music-Label`.
