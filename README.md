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
