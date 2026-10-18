# Frequency — Android Music Companion (Beta 44)

Public test link: https://l1gh7c0d35.github.io/frequency-music-public/

This is a web listening and testing companion, not the compiled native Frequency iOS app. It supports Android Chrome and iPhone Safari.

## What works
- Five app-style tabs: Home, Rituals, Sounds, Words and You.
- Full Beta44 collection of 61 tracks (including Timekeeper soundscapes), 10 editorial artist worlds, with the same cover art and descriptions as Frequency.
- Mini-player and full-screen player, play, pause, seek, next/previous, shuffle, repeat and queue.
- Global search across all published music and soundscapes, including `528` and artist names; category filters remain available for browsing.
- Favorites, Keep/Potential/Pass ratings and listening notes in each phone's own local storage. Export feedback JSON when you want to share it.
- Text lyrics for 28 songs; word-by-word timing remains pending verification (we do not fake karaoke highlighting).
- A simplified browser Rituals listening timer (3/5/10/20 minutes), plus modes. It is not an OS alarm.
- Android Home Screen install manifest. Playback requires a connection; music is not bulk-downloaded offline.

## New songs automatically appear after upload
GitHub Actions builds the public catalog when files are pushed to main. A song intentionally uploaded into the public audio/new folder is included under Fresh Cuts automatically; artwork in artwork/new with the same stem is optional. Add a matching JSON file with title, world and description if desired.

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
