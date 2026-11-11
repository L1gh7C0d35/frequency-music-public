# READ LATEST OWNER CORRECTION AT BOTTOM OF THIS DOCUMENT FIRST

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
- **One player and renderer:** both Home and New Music call the same `renderTrackCards` function. Play artwork/title uses the existing `playTrack(id,false)` path to show the bottom mini-player; only deliberate mini-player taps open the full Now Playing overlay.
- **New Music means newly created original songs**, not the C1/C2 experiments. The two corrected Music Maker English takes have encrypted AAC listening copies in `private-media/*.bin`, and a separately encrypted manifest. AES-256-GCM key is stored privately outside Git, supplied in the owner's URL fragment and remembered on that phone. No raw WAV or plaintext private audio, key, or private manifest has been published. Do not interpret encryption as commercial release approval or full server-side account control. Possession of the full secret link grants access.
- Playback reliability improvements: synchronously request audio before heavy DOM work; defer large library/picks/queue rerenders to the next animation frame; only preload featured metadata, not the whole song; don't cancel the same song with a second tap while buffering. Code and desktop audio tests are not a substitute for real iPhone network listening.
- History: Classic remains accessible only by explicitly opening `?view=classic`; don't add a separate substitute player or external hosting. This latest section is authoritative if older dated sections conflict.
