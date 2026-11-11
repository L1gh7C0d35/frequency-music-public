# Frequency Web: October 12 vs. Current — Classic comparison audit
Date: 2026-11-11. Baseline repository commit: `02e33ec` (2026-10-12).
Current canonical site: https://l1gh7c0d35.github.io/frequency-music-public/

## Creator direction and decision
The owner preferred the October 12 charcoal-blue `#090c12` look to the
October 13 Beta44 dark forest-green design, and also remembered the earlier
four-button navigation: Discover, Worlds, Music, Favorites.
They requested a view of that earlier experience **with today's larger
catalog**, without damaging the original site or losing new music.

Implementation: a reversible **Classic** view on the SAME website and SAME
player, reachable using `?view=classic` or **You → Navigation style** in the
current five-tab view. It retains 64 catalog tracks, 11 artist worlds, modern
player fixes, locally stored favorites/feedback, and the same source paths.
The default remains the current five-tab view until the visitor selects
Classic. The Classic deep link saves this reversible choice on that browser.
A visibly labelled **5-tab view** switch in Classic's top bar restores modern
navigation; saved appearance colors are restored separately. No new hosting,
duplicate player, or public audio release is created.

## Before vs. after — evidence from the repository
| Area | October 12 `02e33ec` | Current site, before Classic feature |
| --- | --- | --- |
| Main palette | Charcoal-blue `#090c12`, slate-gray surfaces | Green-black `#090d0c`, radial `#213329` |
| Primary navigation | Discover / Worlds / Music / Favorites | Home / Rituals / Sounds / Words / You |
| Catalog | 28 tracks | 64 tracks (31 songs and 33 soundscapes) |
| Artist/sound worlds | 4 | 11 |
| Wordmark | ◒ frequency; sidebar `LISTENING ROOM` | ◒ frequency.; sidebar track count |
| Phone Home Screen icon | No manifest with installed icon in this baseline | Added PWA icon assets and manifest |
| Browsing | Four-section listening room and simple filters | Artist-world drill-down, category/intent filters, broader search |
| Playback | Existing mini player and now-playing UI | Buffer feedback, faster mobile playback, lyric display, short-soundscape loop |
| Experiments | No standalone searchable experiments page | Public, opt-in experiments browsing and rating |
| Favorites | Browser-local | Still browser-local (no server account migration) |

Important details: zero of the October 12 track identifiers disappeared.
The 36 catalog additions comprise 33 Timekeeper soundscapes and 3 Fire Under
Calm alternate versions. **Twelve of the original songs were reassigned to
different primary worlds; seven titles have been changed, mostly
capitalization; all 28 original songs have updated descriptions/subtitles.**
This changes how familiar music is presented; no automatic metadata rollback
was performed, since such changes deserve a separate artistic review.

## Source-audio verification, not just filenames
All original 28 track audio paths and listed durations remained the same.
At the blob level, 11 files are exactly identical to October 12; the other
17 changed in the October 13 web playback/fast-start update. The modified
files were not simply a harmless bit-for-bit container copy: 14 produced
different decoded PCM checksums. On a 12-second segment sampled near the
28-second mark, **all 17 correlated between 0.9993 and 1.0000** with their
October 12 versions after decoding to mono 8 kHz and allowing +/-250 ms
alignment. Additional seven-second windows at 70 seconds and near the end
of all 17 tracks correlated between 0.99776 and 1.0000. These multiple
samples strongly indicate the same musical recordings, with codec or
streaming changes rather than substituted songs. They do not prove exact
audio equivalence for every sample over the full durations. No existing music file is overwritten
in this Classic work. Git history retains both revisions.

## Scope of Classic mode
- Original four navigation labels, charcoal-blue color system, original
  hero message, original wordmark punctuation and sidebar subtitle.
- Discover shows featured music, **all 11** current worlds, picks and the
  whole current library; Worlds drills into those worlds; Music shows all
  64 tracks with search and world filters; Favorites shows saved items.
- SAME DOM player, source code, current catalog, search, reviews and audio
  are reused in either view. Switching never reloads or restarts playback.
- Classic intentionally **does not** hide new soundscapes, reverse the
  12 artist-world assignments, remove lyrics/queue, or change the iOS
  TestFlight app. It is a historically inspired layout with the larger
  current catalog, not a byte-for-byte rollback to Oct 12.

## Green-tint cleanup across the site
The first Original Midnight palette only addressed outer chrome; it missed
some nested artist-track backgrounds and selected controls. New scoped
Midnight overrides cover nested `world-song` and active rows, world-detail
surfaces, lyric panels, experience chips, and player labels.

The additional 35 static top-level pages (Experiments, Studio, Classic
song pages, prior batch/lab pages) each receive an **opt-in** appearance
bridge. The generated file `frequency-legacy-appearance.css` is scoped
to the exact secondary page and only applies when a visitor chose Midnight
or Classic; without that choice, every page's old default CSS is untouched.
The CI-generated `song/<id>/` sharing redirects are also styled Midnight
for users in Classic mode, without changing their metadata or destination.

The supporting generator `scripts/build_legacy_appearance.py --install`
is idempotent: it generates scoped CSS from existing inline styles and only
adds two head elements to pages once. Re-run if those static pages are
regenerated or newly added.

## QA and guarding against future accidental redesign
- Unit tests cover catalog assets, mobile playback, search, favorite state,
  world navigation, JS syntax, appearance persistence and Classic tab state.
- Additional Bun smoke test confirms all four Classic controls, 64-track
  catalog, 11 worlds, search, favorite preservation and return to current UI.
- No audio, artwork, music metadata or source model is modified.
- Commit changes to the single canonical `frequency-music-public` repository
  and deploy via existing GitHub Pages, never another player or host.
- Before changing any user-preferred visual system, compare against commit
  `02e33ec`; explicitly solicit user feedback instead of guessing whether
  the old aesthetic should be globally imposed.
