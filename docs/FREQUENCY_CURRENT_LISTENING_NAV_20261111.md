# READ THE FINAL NOVEMBER 11 DIRECT-AUDIO DECISION AT BOTTOM FIRST

# Frequency web — current listening-room product decision
Date: November 11, 2026. Repository: `L1gh7C0d35/frequency-music-public`.

## Owner decision
Keep the newer Frequency experience and its larger catalog, but retire
the forest-green palette, remove Rituals and Words as separate tabs,
bring curated musical Worlds into primary navigation, and add a dedicated
New Music landing area. The five destinations are now:

**Home · Worlds · New Music · Music · You** (mobile shows **New** for width).

- **Home:** inspiring featured listening, curated world shelf and picks
- **Worlds:** ten artist-inspired musical styles/moods, each with its
  actual tracks. Sound worlds are editorial groupings, not necessarily
  verified individual performers. Fresh Cuts is not shown as a fake artist
- **New Music:** real public `new:true` song records, currently three
  already-approved Fire Under Calm listening previews. Date-sorted when
  release metadata exists; each opens the SAME full Now Playing player,
  supports Save, and makes early-preview status clear. Has an honest
  empty state when nothing is published
- **Music:** all listening catalog with working Music / Soundscapes / All
  filters, world filter, global search and favorites shortcut
- **You:** locally stored favorites, listening notes, export and install
  guidance. Prior appearance and navigation-style controls were removed
  to avoid unnecessary versions/preferences

The lyric-reading and auto-follow experience remains **inside Now Playing**,
not in a separate Words screen. The browser Rituals timer was deliberately
removed. Historical Classic remains available only by explicit
`?view=classic` URL as an inspection aid; default homepage is the newer UI
even if a browser previously stored Classic.

## Visual system
The owner's chosen palette is the October 12-derived
**Midnight** system: charcoal-blue `#090c12`, slate surfaces,
legible neutral-white `#f4f2ed`, soft-muted `#adb6c4`, champagne
accents `#d7bd98`. A single palette is active by default.
There is no selectable Forest theme or conditional green fallback.
The same Midnight treatment applies to main player, nested artist tracks,
experiments/studio, 35 legacy public pages, and generated sharing pages.
The shared Fresh Cuts SVG (previously forest-green) was recolored to
charcoal-blue. Distinctive individual album covers and the already-blue
PWA icon were preserved. Manifest now uses Midnight for background/theme.

`frequency-current.css` owns current navigation and New Music layout.
`frequency-parity.css` uses neutral blue defaults; historical
`frequency-appearance.css` keeps the old nested-panel coverage.
Keep existing content legible on small phones, appropriate contrast
and touch targets, and do not invent metadata or performer identities.

## Public release gate / source truth
Creating a song in Music Maker **does not** publish it.
Only specifically approved audio deliberately copied to public
`audio/new` or already approved `public-test-tracks.json` goes into
the New Music tab. Existing `scripts/publish_new_song.py` is dry run
unless `--publish` is explicitly supplied. On an authorized
publish it records a UTC `published_at` time for newest-first ordering.
GitHub Pages CI rebuilds `listening-catalog.json`, then New Music reads
the same verified public catalog as the other tabs.
Do not automatically transfer private music, test masters, rejected takes,
AI source data or Drive references to this public GitHub website.

## Checkpoints
- Current nav and mobile labels, World grouping and New Music actions
- Current 64 recordings / 11 metadata worlds; ten shown as actual Worlds
- Three explicit public Fire Under Calm C1/C2/C3 early listening previews
- New Music playback opens existing player and Save uses existing favorites
- Current search and selected Music / Soundscapes / All filters unchanged
- Original lyric follow remains in the current Now Playing drawer
- Negative routes: no visible Rituals or Words screens or Forest toggle
- Midnight applied before browser paint; old green local preference ignored
- Existing artist artwork, private audio and PWA icon preserved
- Historical `?view=classic` remains inspectable, current main route default

See `scripts/test_listening_room.py`,
`scripts/test_new_music.js`, `scripts/test_search_smoke.js`,
`scripts/test_classic_view.js` and `scripts/test_appearance_preference.js`.
Browser appearance still needs creator's normal-phone visual judgment.
The fact that source tests pass is not a claim of perfect design.

## November 11, afternoon — LATEST owner correction (supersedes earlier five-tab / Midnight plan)

- Current Frequency site and original player are retained. Forest (richer green) is again the default. Midnight stays an optional **You → Appearance** preference.
- Four current desktop and phone tabs: **Home · New Music · Music · You**. The Worlds tab is removed as redundant; Home already shows the curated musical worlds. Previously removed Rituals/Words tabs remain absent, while song lyrics stay in Now Playing. One shared inline SVG symbol set provides recognizable navigation icons instead of small dotted/grid symbols.
- Home recommendations must exclude unfinished tests. The publicly approved Fire Under Calm C1/C2/C3 audio still exists in Experiments and Music for comparison, but no longer appears in handpicked Home picks, Home moods, Home shuffle, or New Music.
- **One player; one album-row source of truth:** New Music and artist-world album pages call the same `renderSongRows` component. Home retains its separate featured square-card layout. Every Play button uses the existing `playTrack(id,false)` path to show the same bottom mini-player; only deliberate mini-player taps open full-screen Now Playing.
- **New Music means newly created original songs**, not the C1/C2 experiments. The two corrected Music Maker English takes have encrypted AAC listening copies in `private-media/*.bin`, and a separately encrypted manifest. AES-256-GCM key is stored privately outside Git, supplied in the owner's URL fragment and remembered on that phone. No raw WAV or plaintext private audio, key, or private manifest has been published. Do not interpret encryption as commercial release approval or full server-side account control. Possession of the full secret link grants access.
- Playback reliability improvements: synchronously request audio before heavy DOM work; defer large library/picks/queue rerenders to the next animation frame; only preload featured metadata, not the whole song; don't cancel the same song with a second tap while buffering. Code and desktop audio tests are not a substitute for real iPhone network listening.
- History: Classic remains accessible only by explicitly opening `?view=classic`; don't add a separate substitute player or external hosting. This latest section is authoritative if older dated sections conflict.

## November 11 — iPhone private listening failure and recovery

The owner showed the real iPhone in-app browser on **New Music** with "Unable to
open private listening files" and zero visible songs. This is a private unlock
failure, not an absence of generated songs. The two corrected English takes
exist as encrypted M4A sources and were independently verified in a real
Chromium phone-sized browser with working playback in the **existing** mini-player.
The exact exception that occurred in iOS WebKit wasn't available from the
screenshot; don't assert a single unverified root cause.

Reliability fixes:
- Preserve the private URL fragment until a manifest and both authenticated
  recordings have been successfully decrypted. Previously it was removed at
  the start, so interrupted iOS browser sessions lost the retry key.
- Download/decrypt one recording at a time, showing available songs as they
  finish. This reduces peak browser memory usage.
- Retry once after failed or potentially stale ciphertext downloads using a
  fresh cache request; use plain ArrayBuffers for WebCrypto for WebKit
  compatibility rather than offset typed-array views.
- Display a **Try loading again** control inside the existing New Music UI.
  If retries fail, explain that opening the same link in Safari may help.
- Preserve already playable recordings if a later download fails; a retry
  skips tracks already in the shared music state without duplicating playback.
- Do not print, send, or commit the private key; no plaintext M4A/WAV is added.

Validation: 24 Python site tests, encrypted manifest/audio authentication,
browser-crypto unlock, failure-then-retry integration test, and a **real
headless Chrome mobile-sized browser** simulation where the manifest download
was intentionally aborted twice. After tapping Retry, the two songs appeared,
the browser removed the successful key fragment, and the normal mini-player
played *What the Morning Knows* without opening the full-screen overlay.
This is strong end-to-end coverage but is **not a physical iPhone WebKit
test**; user listening on their phone remains the final confirmation.

## November 11 — New Music uses the existing album song rows

The owner rejected square cards in New Music and explicitly requested the
same horizontal song rows already present inside artist-world album pages:
vertically stacked entries, small square artwork on the left, song title and
details in the middle, and a distinct Play button on the right.

This is implemented through **one source of truth**:
`listening-room.js` `renderSongRows(root, tracks)`, now called by both
`renderWorldDetail()` and `frequency-parity.js` `renderNewMusic()`.
Both contexts use the identical `playTrack(id,false)` mini-player action,
queue the songs within the chosen album, and keep the active row's Play/Pause
artwork synchronized. No separate new audio player, custom square-card UI, or
full-screen navigation was added.

The earlier private unlock implementation showed zero titles until both
encrypted audio files finished downloading/decrypting. On mobile webviews that
failed or paused while decoding, this looked like songs never existed.
`frequency-private-music.js` now authenticates the tiny encrypted manifest
first, inserts both title/album rows immediately as `privateLoading`, then
decrypts each recording sequentially. Each row changes from "Preparing private
audio…" to playable as its own file completes; retries reuse existing rows
instead of duplicating songs. A valid key is saved after authenticating the
manifest, before potentially slow audio fetches, so reopening Frequency can
re-establish access. The URL fragment is still removed only after successful
audio load. Unprepared rows are guarded against accidental HTML audio
playback from New Music **and** Music.

Mac mobile-sized browser integration successfully observed both actual song
titles during the loading state, full-width rows stacked vertically, playback
in the existing bottom mini-player (not full-screen), Next advancing to the
second original, and both songs reappearing after browser reload without the
fragment. This was a real headless Chrome test at 390px phone viewport, not
verification on the owner's physical iPhone. Master WAVs and the public
64-track catalog are unchanged; the two listening copies remain encrypted.

## FINAL November 11 correction — eliminate the overcomplicated private player

The owner correctly observed that Frequency already hosts playable music on
GitHub Pages and the new recordings should use that same proven mechanism.
The former AES-GCM encrypted private preview process added a key-fragment URL,
browser crypto, full-song downloads, memory copies, and timeout failures,
instead of using the normal streaming audio element. **This was an unnecessary
technical detour for the listening experience.**

The owner requested that **What the Morning Knows** and **The Wild Part of Me**
actually be hosted in New Music. Exactly these two corrected English-take
songs were transcoded from protected Music Maker WAV originals into standard
256 kbps AAC/M4A (48 kHz stereo, fast-start, 200 seconds each) and added to
`audio/new/` with publishing metadata. They are public listening previews,
**not** finished releases, and the original WAVs remain untouched.
GitHub Pages publicly exposes these preview audio files; anyone can listen or
download them. Clearly state that tradeoff to the owner.

The active web app now uses **one** source of truth: `listening-catalog.json`
is built by `scripts/build_listening_catalog.py` from the deliberately public
`audio/new/` files. `frequency-parity.js` New tab filters exactly the public
preview source, excluding old C1/C2/C3 experiment tests. Its horizontal album
rows call the existing `renderSongRows`/`playTrack(id,false)` mini-player.
**No** `frequency-private-music.js`, key fragment, private-login UI, or custom
AES runtime is loaded by the current app. The old encrypted experiment files
remain archived in the repository and may still be served as static files,
but are not referenced by Frequency's current player. The decryption key is
never part of the public site. New catalog = **66 tracks**, 11
catalog worlds, 5 `new:true` entries including 3 older C1-C3 test versions,
but New Music tab shows only the two new public listening previews.

Going forward: creator-picked new songs can use the same dry-run-first
`scripts/publish_new_song.py --publish` tool. Do not automatically publish every
Music Maker experiment; do not create another player or separate hosting site.
Tests must verify browser audio playback and Next navigation from the *deployed*
GitHub Pages website, not merely inspect HTML or test decryption.

## November 11 evening — three higher-energy originals in New Music

The owner disliked the previous two reflective/tame originals and requested **more exciting songs**. Music Maker generated three original English-lyric full songs from new, intentionally distinct prompts. These three are **listening previews**, not aesthetically approved finals:

- **Disco on the Fire Escape** — 128 BPM, 3:00, live disco-funk / dance pop, playful horns and bass concept
- **Neon Wildfire** — 146 BPM, 3:10, cinematic electro-rock with dramatic chorus concept
- **Out of Orbit** — 164 BPM, 2:55, fast breakbeat / drum-and-bass-pop concept

The frequency-music-public site has three independent 256kbps AAC/M4A assets in audio/new, with JSON metadata including explicit durations to support GitHub Actions (where ffprobe may be unavailable). These are **PUBLIC** and downloadable over HTTPS on GitHub Pages. WAV masters, generation seeds, complete lyric sheets and creative provenance remain exclusively in Music Maker and are not included in the web site. The public catalog now has **69 total recordings / 36 songs + 33 soundscapes**, of which New Music contains five ordinary public originals; the three high-energy takes sort above the previous two. The three Fire Under Calm C1/C2/C3 experiments remain only in the broader Music/Experiments areas, not New Music recommendations.

The same original album-song row component `renderSongRows` and existing mini-player/Next queue are used; no custom player, key or encryption flow. A live music browser test must verify nonzero playback time and audio readyState, not simply show five titles, on the deployed Pages URL before completion. No claim that a technical QC pass equals exciting music or a listener Keep vote. The owner should choose favorites after hearing them.

Future catalog tests are less tightly coupled to exact counts, and explicitly verify these named songs, source paths, duration metadata, direct AAC assets, and New Music rendering. Protect all prior masters and never silently alter an approved song when making another energetic version.

## Final verified publication — three energetic previews
Commit `a9874f4` published the three new 256kbps M4A listening previews (Disco on the Fire Escape, Neon Wildfire, Out of Orbit) and 69-recording catalog. GitHub Actions run `43018139315` reports full **success**. All three public files returned `206 Partial Content`, MIME `audio/mp4`; live catalog reports five public New Music originals, with these three first. A real Chromium browser at 390px tested the deployed Pages URL, verified five horizontal rows, clicked Play on the new Disco recording to an existing `mainAudio` player with `readyState=4` and `paused=false`, then clicked Next to Neon Wildfire, leaving fullscreen Now Playing closed. This is production integration evidence, not an actual physical iPhone test or an aesthetic rating. Source WAVs and lyric sheets remain private in Music Maker; only preview M4A files are public. No new backend/player, no secret link, no existing audio overwritten.
