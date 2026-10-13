# Frequency — Android Music Companion (Beta 44)

Public test link: https://l1gh7c0d35.github.io/frequency-music-public/

This is a web listening and testing companion, not the compiled native Frequency iOS app. It supports Android Chrome and iPhone Safari.

## What works
- Five app-style tabs: Home, Rituals, Sounds, Words and You.
- Full Beta44 collection of 61 tracks (including Timekeeper soundscapes), 10 editorial artist worlds, with the same cover art and descriptions as Frequency.
- Mini-player and full-screen player, play, pause, seek, next/previous, shuffle, repeat and queue.
- Feelings/mood filters, music versus soundscape filters, searchable library.
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
