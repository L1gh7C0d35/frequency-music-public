# Frequency — Public Music Listening Room

Public test link: https://l1gh7c0d35.github.io/frequency-music-public/

This is a web listening and testing companion, not the compiled native Frequency iOS app. It supports Android Chrome and iPhone Safari.

## What works
- Four focused tabs: **Home, New Music, Music, You** (on desktop and phone). Artist/music worlds are already on Home.
- Current public catalog: **69 recordings** (36 songs and 33 soundscapes). Home shows 10 curated artist-and-style worlds; the 11th catalog grouping, Fresh Cuts, is not a performer and does not appear in the Home worlds shelf.
- Mini-player and full-screen player, play, pause, seek, next/previous, shuffle, repeat and queue.
- Global search across all published music and soundscapes, including `528` and artist names; category filters remain available for browsing.
- Favorites, Keep/Potential/Pass ratings and listening notes in each phone's own local storage. Export feedback JSON when you want to share it.
- Lyrics stay inside **Now Playing**, with existing automatically aligned timing where supported; there is no separate Words tab.
- No Rituals tab or browser session timer. The focus is listening, worlds, and new music.
- Android Home Screen install manifest. Playback requires a connection; music is not bulk-downloaded offline.

## Experiments Listening Lab

The public Experiments page at experiments.html lists all already-public audio
assets not part of the main listening catalog, alongside curated A/B tests.
The regular Listening Room and Music Studio remain unchanged.
To update the existing public experiment index after adding public audio:

    python3 scripts/build_listening_catalog.py
    python3 scripts/build_experiments_catalog.py

Commit the generated experiments-catalog.json before pushing.
The existing Pages workflow copies the committed catalog and Experiments page;
the studio is a listening tool, not a private audio vault.

## New Music — direct GitHub Pages listening previews (November 11, 2026)

Seven **original Frequency listening previews** are intentionally available
as standard 256 kbps AAC/M4A files from `audio/new/`, using the **same
public catalog and native audio player** as all established Frequency songs.
There is **no encryption, special link, browser decryption or alternate
player**. New Music uses the shared album-style horizontal song rows, with
the existing bottom mini-player, queue and Next button.

**Latest two Frequency-native originals:** `I Know Who I Am` (cinematic soul,
3:12) and `I Live in the Overflow` (uplifting Afro-soul/R&B, 3:08) are the
first listening tests made *after* the owner-established manifestation and
already-embodied identity creative reset. They feature original English lyric
sheets and singable present-tense affirmations. Their audio has passed
technical integrity checks, **not** an owner taste approval. The previous
five exploratory previews remain in the list and are not automatically liked.
See `Developer/Music-Maker/docs/FREQUENCY_NORTHSTAR_LISTENING_TAKES_2026-11-11.md`
for creative request/QA provenance.

**Previous three high-energy originals:** `Disco on the Fire Escape` (dance-funk, 3:00),
`Neon Wildfire` (cinematic electro-rock, 3:10), and `Out of Orbit`
(fast drum-and-bass pop, 2:55). Each was made with a new original English
lyric sheet, a different sound direction and one untouched source WAV.
Earlier previews `What the Morning Knows` and `The Wild Part of Me` remain
available, but are no longer the newest entries. The catalog contains 71 tracks.

**Visibility:** GitHub Pages is a PUBLIC static website. All seven preview
copies are publicly accessible and downloadable, although the original WAV
masters and Music Maker project sources remain outside the web repository.
They are explicitly labelled early listening previews, not finished releases.
Future creations should only be added here intentionally with the publishing
script; generating a song does not automatically make it public.

Only expressly approved `audio/new/` uploads appear publicly in New Music. The three already-public **Fire Under Calm C1/C2/C3** trial recordings remain searchable and in the Experiments listening lab, but they are **not** New Music releases or Home editorial recommendations. A deliberately published song appears automatically, ordered by its `published_at` UTC timestamp. **Making a track in Music Maker does not publish it.**

For owner uploads from the Mac:

    cd /Users/darbybeenken/Developer/frequency-music-public
    python3 scripts/publish_new_song.py --audio "/path/new-song.wav" --title "New Song"
    python3 scripts/publish_new_song.py --audio "/path/new-song.wav" --title "New Song" --publish

Without --publish it is only a dry run. Publication is PUBLIC: people on the internet can reach audio files from the repo. Do not upload private/unapproved Flow drafts, credentials or rights paperwork.

This website runs in GitHub Pages without private servers. It cannot upload songs directly from a visitor's browser. You can add files with GitHub's upload interface, and a push automatically updates the website. The app code and assets are synced manually from Frequency Beta44 with scripts/sync_from_frequency.py when a newer build contains additional music.

## Test locally
    python3 scripts/build_listening_catalog.py
    python3 -m unittest discover -s scripts -p 'test_listening_room.py' -v
    node --check listening-room.js
    node --check frequency-parity.js

GitHub Actions reruns catalog building and tests for each push.

Private release workflow: /Users/darbybeenken/Developer/Music-Label. This public website does NOT submit to Spotify, YouTube, distributors, Content ID or claim copyright ownership.

## Mobile playback speed and reliability

The player now requests HTML media playback immediately on a tap, before rerendering track lists, and shows a connecting indicator. Song title taps start playback. The Start Listening button remains disabled during catalog loading.

Mobile-optimized public M4A streams store the MP4 moov metadata before audio samples. They are remuxed losslessly, using AAC stream copy with the faststart flag, to avoid a second end-of-file request. Run these checks before publishing future music:

    python3 scripts/faststart_public_audio.py
    python3 scripts/faststart_public_audio.py --fix

The iOS music exporter preserves this metadata order when mirroring future music. Data-Saver connections skip optional home-page audio preloading. Playback latency still depends on real device and network conditions.


## Original recording lengths (October 13, 2026)

A full byte-for-byte SHA-256 comparison confirmed all 33 public Timekeeper
soundscapes are identical to their corresponding source Timekeeper audio files.
The website did not truncate these recordings. All 28 core Frequency songs run
longer than two minutes. Nine soundscapes are under 90 seconds:

| Original soundscape | Recorded duration |
|---|---:|
| 396 Hz Grounded Foundation | 1:07 |
| 432 Hz Crystal Abundance | 1:05 |
| 852 Hz Spiritual Oneness | 1:05 |
| Balearic Gold Horizon | 1:01 |
| Unstoppable Golden Rise | 1:03 |
| Cozy Coffee & Lo-Fi Vinyl | 1:08 |
| Morning Velvet Bliss | 1:10 |
| Turquoise Truth Awakening | 1:09 |
| Sacred Abundance Stream | 1:18 |

The user-facing music browser marks these as **short original soundscapes**,
with true running time and an optional **Loop continuously** control. Repeat
does not constitute a new or full-length musical composition.

Future release work should write and approve *new* 3-5 minute arrangements
for the nine short items before calling them full-length songs; do not
mislabel loops, use artificial time stretches, or silently replace masters.
The Timekeeper source model currently says "Full track" for some 1-minute
assets; its native-app metadata should be corrected in the next deliberate
Timekeeper app update by that app's developer.


## Public song share links and Flow Music sound briefs

Every published song has a static social-preview landing URL. For example:
https://l1gh7c0d35.github.io/frequency-music-public/song/timekeeper-audio-528-hz-sacred-grace/

The landing page includes song-specific title, cover art, description and
Open Graph preview metadata, then opens that track in Frequency. Playback
still requires a tap. Users can open the artist world or explore all songs.

The MP3/M4A file does not reliably contain the original Flow Music SOUND
prompt, lyrics, BPM or creator's genre and intended experience. Share the
Flow song page URL with the approved audio file; if the link is private,
provide the SOUND text or screenshot. Save the metadata once in
flow-song-metadata.json keyed by the public track ID. The website catalog
merges creator-supplied details without guessing them from the audio.

The initial verified Flow metadata for 528 Hz Sacred Grace was transcribed
from the user's screenshot (70 BPM, Sound Bath category, and sound brief).
For a new, explicitly public upload create audio/new/slug.m4a and optional
audio/new/slug.json with title, world, sound, source_url, experiences,
instruments, bpm and description. The automated publish workflow generates
that new track's share page. Private Flow drafts stay private until approved.
Editorial sound worlds are not fake verified human performer identities.


## Creator-confirmed singer pairing and inline lyric sync (October 2026)

The creator confirmed the same vocal identity performs both 528 Hz Sacred
Grace and 528 Hz Miracle Awakening. Both tracks belong to Golden Current
in Frequency's native artist-world catalog and public web snapshot.
The metadata gives them the same voice_group with creator provenance.
The website build refuses shared-voice pairs split across artist worlds.

The now-playing page scrolls naturally, displays the entire SOUND
description, and shows original lyric text underneath its controls
without navigating away. Automatic word timing is generated offline
from the exact recorded master and the creator-approved lyric sheet.
Only exactly matched Whisper-transcribed lyric words receive timestamps;
unmatched words have no fabricated timing. SHA-256 source hashes in the
timing files prevent stale data when a master or its lyrics change.

All 28 vocal originals have timing drafts. The 27 with at least 60%
exact word matching show timed preview highlighting and an optional
auto-follow reader; a track below threshold displays its lyrics without
automatic highlighting. These are explicitly identified as unverified
automatic previews, not professional karaoke masters. Manual scrolling
turns auto-follow off; no word causes layout reflow.

Flow 528 Hz sound-bath recordings currently lack full lyric sheets in
the app export, so the player does not invent karaoke for them.
Sacred Grace instead links to its source Flow Music song page.


## Keep visitors in Frequency; Flow source URLs are editorial only

Do not render external Flow Music URLs in the player or missing-lyrics UI.
The offline import script `python3 scripts/import_flow_song_metadata.py` reads
only explicitly supplied original Flow Music URLs in the source catalog.
It extracts the original SOUND description, song timing, creator-written
lyrics, and available provenance without guessing performer identities.
For 528 Hz Sacred Grace, the original lyrics are now imported and displayed
inside Frequency; no exit to the source site is necessary.

The public JSON catalog only includes listener-relevant approved fields,
not the source URL or source ID. The GitHub Pages packaging step excludes
`flow-song-metadata.json`; generated source metadata is not part of the
public website bundle. If other songs lack source URLs, the importer will
not fabricate them; their verified app metadata remains intact.

## Creator listening tests

Fire Under Calm C1/C2/C3 remain public and are explicitly included in the public-test-tracks.json allow-list so they appear under Fresh Cuts and can be searched by version name. The list points to existing audio/*.m4a files without storing second copies. These are listening candidates, not finished commercial releases. Other unlisted test files are not automatically exposed in the player.

## Updated current Frequency direction — November 11, later creator review

The owner prefers the original richer green Forest palette again and asked
for familiar, recognizable tab icons instead of tiny dot/grid symbols.
Forest is the default; Midnight is now an optional **You → Appearance**
choice. Four navigation tabs remain **Home / New Music / Music / You**.
The separate Worlds tab was removed because all curated worlds already live on
Home. Rituals and Words remain absent as standalone tabs; inline lyrics still
work in Now Playing. Historic Classic remains accessible only by explicit link.

New Music and artist-world album pages share the exact **`renderSongRows`**
component; Home retains its larger square recommendation cards. In all three,
tapping Play uses the same **`playTrack(id,false)`** path, opening the bottom
mini-player without automatically opening full-screen Now Playing. The C1/C2/C3 experimental tracks are omitted from Home
picks, shuffle recommendations and New Music. They remain in public Music and
Experiments without deleting approved source assets.

The player's `audio.play()` stays synchronous on tap; full list, queue and
picks rerenders are deferred into the next animation frame for responsiveness.
A second tap on the same track during buffering no longer cancels loading.
The prominently featured track preloads only metadata to avoid competing with
other playback on slow phone connections. These fixes still need a normal
physical-phone listening check; a code test is not proof of network quality.

**Archived private-listening experiment (superseded):** The earlier
`private-media/*.bin` ciphertext, manifest and `frequency-private-music.js`
were a trial to keep previews inaccessible from the public website, but they
made iOS playback unreliable. The current website no longer loads the
private playback mechanism, though encrypted historical files may remain
accessible in the repository or prior Pages deployments. The decryption key
is not published. Earlier special-key links are unnecessary; use the normal
New Music tab instead. Current New Music streams the explicitly shared AAC files
through the existing `mainAudio` player like every other song.

## Current appearance and navigation (November 11, 2026)

Historical note (superseded by the newer creator review above): the owner
briefly chose the charcoal-blue Midnight palette with warm champagne highlights
**throughout the public website** (main player, artist cards, experiments,
studio and archived song pages). There is no green-theme switch.
The desktop and iPhone tabs are **Home / Worlds / New Music / Music / You**.
Worlds groups artist-inspired styles and moods; it does not claim that every
world is a verified human performer. Fresh Cuts is reserved for approved new
music rather than masquerading as a separate artist.

A historical four-tab comparison remains available **only through the explicit
`?view=classic` link**; it retains the larger catalog and can be exited via
**5-tab view**. No in-app navigation-style switch clutters the current UI.
The current app is the default even on browsers that previously saved Classic.
The old wordmark and mobile icon assets were not overwritten. The canonical
colors and new music layout are defined in `frequency-current.css` and the
historical Midnight coverage in `frequency-appearance.css`.

### Publishing gate

Only approved-to-share audio is placed on the public GitHub Pages server. The
existing `scripts/publish_new_song.py` remains **dry run by default** and
requires the deliberate `--publish` flag to upload/commit a selected track.
The published metadata records `published_at` for newest-first sorting. New
Music previews are explicitly labelled as previews, not finished releases.
Private Music Maker WAVs, rejects, alternate experiments, and originals are
never auto-published by running the music generator.

## Historical Classic comparison reference

Open <https://l1gh7c0d35.github.io/frequency-music-public/?view=classic>
only when intentionally reviewing the 2026-10-12 four-tab Discover, Worlds,
Music, Favorites layout. This keeps the modern player and the entire 64-track
catalog, but it is not the default. Use **5-tab view** to return.

A full audit of historical differences, remaining visual leaks, song
metadata changes, and the 17 original audio files rewritten for streaming
is in `docs/FREQUENCY_WEB_CLASSIC_AUDIT_20261111.md`. The Midnight
stylesheet covers the 35 secondary HTML pages by default, plus the
song-sharing redirect. Run
`python3 scripts/build_legacy_appearance.py --install` after adding
or regenerating static subpages.

**Do not blindly check out or publish the old October 12 tree:** it had
only 28 tracks, while the current catalog has 64 and additional
listening/search fixes. Do not add a new temporary player or hosting setup.

### New Music on iPhone — no special private link

Open **https://l1gh7c0d35.github.io/frequency-music-public/?tab=new**
in Safari or any normal browser. Both newly shared originals appear as album
song rows immediately, without a password or cryptographic unlock. Tap Play
on a song row to use the normal bottom mini-player, tap Next to hear the other.
Audio files stream as standard GitHub Pages AAC/M4A and support HTTP Range.

The audio is publicly shareable, while the 48-kHz source WAV masters stay
untouched in Music Maker. Please treat these as **listening previews**, not
approved commercial releases. To add more songs, use the deliberate
`--publish` workflow after choosing the right take. Do not reintroduce
browser-side encryption as a prerequisite for public listening.

### Album-row layout (shared component)

New Music and artist World pages both call `renderSongRows(root, tracks)`.
The component stacks horizontal song rows vertically, gives each one a direct
Play control and keeps the player/queue in `listening-room.js`. Home uses its
separate feature cards, but they play through that same audio element.
