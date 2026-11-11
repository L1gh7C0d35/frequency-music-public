#!/usr/bin/env python3
"""Validate the static Listening Room before publishing GitHub Pages."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

class ListeningRoomTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'listening-catalog.json').read_text())
        cls.html=(ROOT/'index.html').read_text()
    def test_all_public_media_exists(self):
        for track in self.data['tracks']:
            with self.subTest(track=track['id']):
                self.assertTrue((ROOT/track['audio']).is_file(),track['audio'])
                self.assertTrue((ROOT/track['image']).is_file(),track['image'])
                self.assertGreater((ROOT/track['audio']).stat().st_size,100000)
                self.assertGreater((ROOT/track['image']).stat().st_size,100 if track['image'].endswith('.svg') else 3000)
    def test_exclusive_public_catalog_paths(self):
        for t in self.data['tracks']:
            for key in ('audio','image'):
                self.assertFalse(t[key].startswith('/'))
                self.assertNotIn('..',Path(t[key]).parts)
                self.assertNotIn('Users',t[key])
        self.assertEqual(len({t['id'] for t in self.data['tracks']}),len(self.data['tracks']))
    def test_worlds(self):
        names={w['id'] for w in self.data['worlds']}
        self.assertGreaterEqual(len(names),10)
        self.assertGreaterEqual(len(self.data['tracks']),61)
        for w in self.data['worlds']:
            self.assertTrue((ROOT/w['image']).is_file())
            self.assertEqual(w['count'],sum(w['id'] in t.get('worlds',[t['world']]) for t in self.data['tracks']))
        self.assertTrue(all(t['world'] in names for t in self.data['tracks']))
    def test_published_m4a_metadata_is_fast_start(self):
        from faststart_public_audio import is_slow_start
        files={ROOT/t['audio'] for t in self.data['tracks'] if t['audio'].endswith('.m4a')}
        self.assertGreaterEqual(len(files),20)
        for p in files:
            with self.subTest(path=p.name):
                self.assertFalse(is_slow_start(p),
                    'M4A metadata at the end makes mobile playback request extra bytes')

    def test_short_soundscapes_are_labeled_and_repeat_is_opt_in(self):
        tracks=self.data['tracks']
        soundscapes=[t for t in tracks if t.get('type')=='soundscape']
        short=[t for t in soundscapes if t['duration']<90]
        self.assertEqual(len(soundscapes),33)
        self.assertEqual(len(short),9)
        self.assertEqual(len([t for t in tracks if t.get('type')=='song']),31)
        self.assertEqual(len([t for t in tracks if t.get('new')]),3)
        grounded=next(t for t in tracks if t['id']=='timekeeper-audio-396-hz-grounded-foundation')
        self.assertAlmostEqual(grounded['duration'],66.58,places=1)
        for ident in ('shortSoundscapeHint','shortSoundscapeCopy','shortSoundscapeLoop'):
            self.assertIn('id="'+ident+'"',self.html)
        source=(ROOT/'listening-room.js').read_text()
        self.assertIn("t.type==='soundscape' && t.duration<90",source)
        self.assertIn('Original recording',source)
        self.assertIn("state.repeat=!state.repeat;",source)
        self.assertIn("syncShortSoundscape(t);",source)
        # The recording is not extended, time-stretched, or deceptively
        # presented as a full-length mastered song.
        self.assertNotIn('Extended Version',self.html)

    def test_fire_under_calm_public_listening_versions(self):
        ids={'fire-under-calm-c1','fire-under-calm-c2','fire-under-calm-c3'}
        featured={t['id']:t for t in self.data['tracks'] if t['id'] in ids}
        self.assertEqual(set(featured),ids)
        self.assertEqual(self.data['new_count'],3)
        fresh=next(w for w in self.data['worlds'] if w['id']=='fresh-cuts')
        self.assertEqual(fresh['count'],3)
        for i in (1,2,3):
            track=featured[f'fire-under-calm-c{i}']
            self.assertEqual(track['audio'],f'audio/fire-under-calm-c{i}.m4a')
            self.assertEqual(track['world'],'fresh-cuts')
            self.assertEqual(track['type'],'song')
            self.assertTrue(track['new'])
            self.assertIn('not a final release',track['subtitle'])
            self.assertTrue((ROOT/track['audio']).is_file())
        self.assertFalse(any((ROOT/f'audio/new/fire-under-calm-c{i}.m4a').exists() for i in (1,2,3)))

    def test_one_tap_playback_is_requested_before_rendering(self):
        source=(ROOT/'listening-room.js').read_text()
        load=source.split('function loadTrack(id,play=false)',1)[1].split('function playTrack(',1)[0]
        self.assertLess(load.index('if(play)requestPlay();'),load.index('schedulePlaybackRefresh();'),
                        'Invoke HTMLMediaElement.play while the tap is still active')
        show=source.split('function showTrack(id)',1)[1].split('function queueFromContext',1)[0]
        self.assertIn('playTrack(id,false)',show)
        self.assertIn("audio.addEventListener('waiting'",source)
        self.assertIn("audio.addEventListener('playing'",source)
        self.assertIn('audio-buffering',source)
        self.assertIn('Loading music…',source)
        self.assertIn('TAP PLAY TO RETRY',source)

    def test_flow_metadata_and_song_sharing_pages(self):
        from generate_song_pages import page
        sacred=next(t for t in self.data['tracks']
                    if t['id']=='timekeeper-audio-528-hz-sacred-grace')
        self.assertEqual(sacred['bpm'],70)
        self.assertIn('sound-bath',sacred['experiences'])
        self.assertIn('glass harmonica',sacred['sound'])
        self.assertNotIn('source_url',sacred)
        self.assertNotIn('flow_clip_id',sacred)
        self.assertIn('source_url',__import__('json').loads((ROOT/'flow-song-metadata.json').read_text())['timekeeper-audio-528-hz-sacred-grace'])
        rendered=page(sacred)
        self.assertIn('property="og:title"',rendered)
        self.assertIn('property="og:image"',rendered)
        self.assertIn('glass harmonica',rendered)
        self.assertIn('timekeeper-audio-528-hz-sacred-grace',rendered)
        self.assertIn('location.replace',rendered)
        self.assertIn('Cells awakening with the dawn',sacred['lyrics'])

    def test_every_song_in_one_artist_world(self):
        names={w['id'] for w in self.data['worlds']}
        self.assertTrue(all(t.get('world') in names for t in self.data['tracks']))
        for t in self.data['tracks']:
            self.assertIn(t['world'], t.get('worlds') or [t['world']])
        covers={w['id']:w['image'] for w in self.data['worlds']}
        self.assertNotEqual(covers['golden-current'],covers['future-signal'])
        self.assertIn('this-is-my-normal',covers['future-signal'])

    def test_frequency_search_covers_music_and_soundscapes(self):
        source=(ROOT/'listening-room.js').read_text()
        self.assertIn("state.previewType='all';state.previewGoal='all';state.previewRecent=false;",source)
        self.assertIn("state.previewExperience='all';state.filter='all';state.favoritesOnly=false;",source)
        self.assertIn("[t.title,t.artist,t.subtitle,t.description",source)
        ids={t['id'] for t in self.data['tracks'] if '528' in t['title']}
        expected={'timekeeper-audio-528-hz-sacred-grace',
                  'timekeeper-audio-528-hz-miracle-awakening'}
        self.assertEqual(ids,expected)
        self.assertTrue(all(t['artist']=='Golden Current' for t in self.data['tracks'] if t['id'] in ids))

    def test_creator_confirmed_528_singer_pair_is_together(self):
        ids=('timekeeper-audio-528-hz-sacred-grace',
             'timekeeper-audio-528-hz-miracle-awakening')
        songs=[next(x for x in self.data['tracks'] if x['id']==i) for i in ids]
        self.assertEqual([x['world'] for x in songs],['golden-current']*2)
        self.assertEqual([x['voice_group'] for x in songs],['golden-current-528-singer']*2)
        self.assertTrue(all('Creator confirmed' in x['voice_match_provenance'] for x in songs))
        golden=next(w for w in self.data['worlds'] if w['id']=='golden-current')
        ether=next(w for w in self.data['worlds'] if w['id']=='ether-codes')
        self.assertEqual(golden['count'],8)
        self.assertEqual(ether['count'],5)
        import json
        app=json.loads((ROOT/'app-track-export.json').read_text())
        source={w['id']:w for w in app['worlds']}
        self.assertTrue(all(i in source['golden-current']['track_ids'] for i in ids))
        self.assertTrue(all(i not in source['ether-codes']['track_ids'] for i in ids))

    def test_lyrics_match_source_word_counts_without_invented_times(self):
        from align_word_lyrics import lines_to_words
        tracks=[t for t in self.data['tracks'] if t.get('lyrics','').strip()]
        self.assertEqual(len(tracks),29)
        synced=[t for t in tracks if t.get('wordTimes')]
        self.assertGreaterEqual(len(synced),25)
        for t in synced:
            with self.subTest(title=t['title']):
                words=lines_to_words(t['lyrics'])
                stamps=t['wordTimes']
                self.assertEqual(len(stamps),len(words))
                self.assertGreaterEqual(t['wordTimingQuality'],0.6)
                self.assertTrue(all(x is None or
                    (len(x)==2 and 0<=x[0]<x[1]<=t['duration']+5) for x in stamps))
                self.assertIn('automatic',t['wordTimingSource'])
        html=self.html
        self.assertIn('id="nowLyricsSection"',html)
        self.assertIn('id="nowLyricsText"',html)
        self.assertIn('id="nowLyricFollow"',html)
        source=(ROOT/'listening-room.js').read_text()
        self.assertIn('function syncNowLyrics()',source)
        self.assertIn('renderNowLyrics(t);',source)
        self.assertIn('Automatic lyric timing preview',source)
        self.assertNotIn('Open original Flow Music song',source)
        self.assertNotIn('Flow page has song details',source)
        css=(ROOT/'frequency-parity.css').read_text()
        self.assertIn('max-height:none',css)
        self.assertIn('.lyric-word.is-current',css)

    def test_public_listening_has_no_source_site_exit(self):
        song=next(t for t in self.data['tracks'] if t['id']=='timekeeper-audio-528-hz-sacred-grace')
        self.assertIn('Cells awakening with the dawn',song['lyrics'])
        self.assertEqual(song['bpm'],70)
        self.assertNotIn('source_url',song)
        self.assertNotIn('flow_clip_id',song)
        self.assertTrue(all('source_url' not in t for t in self.data['tracks']))
        self.assertNotIn('flowmusic.app', (ROOT/'listening-room.js').read_text())
        self.assertNotIn('Open original Flow Music', self.html)

    def test_links_and_controls(self):
        for path in ('listening-room.css','listening-room.js','frequency-parity.js','frequency-parity.css','manifest.webmanifest','sw.js','music.html','studio.html','legacy-library.html'):
            self.assertTrue((ROOT/path).is_file())
        for ident in ('mainAudio','worldGrid','trackList','nowOverlay','nowPlay','miniPlay','feedbackModal','exportFeedback','newMusicScreen','newMusicList','newMusicEmpty','youScreen','nowLyrics','appModeRow','intentFilters'):
            self.assertIn('id="'+ident+'"',self.html)
        self.assertIn('listening-catalog.json',(ROOT/'listening-room.js').read_text())
        self.assertIn('location.replace',(ROOT/'music.html').read_text())
    def test_artist_world_detail_has_dedicated_navigation(self):
        for ident in ('worldDetail','worldDetailCover','worldDetailTitle','worldDetailTracks',
                      'worldDetailBack','worldDetailPlay','worldDetailShare'):
            self.assertIn('id="'+ident+'"',self.html)
        source=(ROOT/'listening-room.js').read_text()
        world_route=source.split('function chooseWorld(id) {',1)[1].split('function renderWorlds()',1)[0]
        self.assertIn('showWorld(id);',world_route)
        self.assertNotIn('scrollIntoView',world_route)
        self.assertIn("history.pushState({frequencyWorld:id}",source)
        self.assertIn("window.addEventListener('popstate'",source)
        self.assertIn('const requestedWorld=new URL(location.href).searchParams.get',source)

    def test_all_worlds_have_actual_descriptions_and_media(self):
        for w in self.data['worlds']:
            self.assertTrue(w.get('subtitle'),w['id'])
            self.assertTrue(w.get('description'),w['id'])
            matching=[t for t in self.data['tracks'] if t['world']==w['id'] or w['id'] in t.get('worlds',[])]
            self.assertEqual(len(matching),w['count'],w['id'])
        source=(ROOT/'listening-room.js').read_text()
        self.assertIn('w.subtitle',source)
        self.assertNotIn('safeText(w.short)',source)

    def test_tabs_never_bind_to_entire_body(self):
        source=(ROOT/'frequency-parity.js').read_text()
        self.assertNotIn("querySelectorAll('[data-app-tab]')",source)
        self.assertGreaterEqual(source.count("querySelectorAll('button[data-app-tab]')"),2)
        self.assertIn("app.closeWorld({restoreScroll:false})",source)
        # Body itself carries data-app-tab for CSS. Attaching a click handler
        # to it made every artist/track click silently navigate Home.
        self.assertIn('document.body.dataset.appTab=id',source)

    def test_appearance_options_are_opt_in_and_keep_existing_player(self):
        html=self.html
        for ident in ('mainAudio','youScreen','newMusicScreen'):
            self.assertIn('id="'+ident+'"',html)
        self.assertIn('data-appearance="current"',html)
        self.assertNotIn('id="ritualsScreen"',html)
        self.assertNotIn('id="wordsScreen"',html)
        self.assertIn("frequency-theme-choice-v2",html)
        css=(ROOT/'frequency-appearance.css').read_text()
        self.assertIn('html[data-frequency-appearance="midnight"]',css)
        self.assertIn('--bg:#090c12',css)
        self.assertNotIn('audio/',css)
        js=(ROOT/'frequency-appearance.js').read_text()
        self.assertIn("dataset.frequencyAppearance='midnight'",js)
        self.assertIn('delete root.dataset.frequencyAppearance',js)
        self.assertIn('forest',js.lower())
        palette=(ROOT/'frequency-parity.css').read_text()
        self.assertIn('--bg:#090d0c',palette)
        self.assertIn('#213329',palette)
        sw=(ROOT/'sw.js').read_text()
        self.assertIn("'./frequency-appearance.css'",sw)
        self.assertIn("'./frequency-appearance.js'",sw)
        self.assertIn("'./frequency-current.css'",sw)
        self.assertIn("'./frequency-private-music.js'",sw)
        self.assertEqual(json.loads((ROOT/'manifest.webmanifest').read_text())['start_url'],'./?app=1')

    def test_current_tabs_and_new_music_are_one_real_catalog(self):
        html=self.html
        for name in ('home','new','music','you'):
            self.assertEqual(html.count('data-app-tab="'+name+'"'),2,name)
        for removed in ('rituals','words','sounds','worlds'):
            self.assertNotIn('data-app-tab="'+removed+'"',html)
        for ident in ('newMusicScreen','newMusicList','newMusicEmpty','newMusicSummary'):
            self.assertIn('id="'+ident+'"',html)
        self.assertNotIn('id="ritualsScreen"',html)
        self.assertNotIn('id="wordsScreen"',html)
        self.assertIn('data-shortcut="recent"',html)
        self.assertIn('Worlds',html)
        self.assertIn('newMusicScreen',(ROOT/'frequency-current.css').read_text())
        current=(ROOT/'frequency-parity.js').read_text()
        self.assertIn("function renderNewMusic()",current)
        self.assertIn("t.new===true && t.type==='song'",current)
        self.assertIn("app.renderTrackCards($('newMusicList'),tracks)",current)
        self.assertIn("t.source!=='Creator-approved public test'",current)
        self.assertNotIn('setupRituals',current)
        self.assertNotIn('renderLyrics()',current)
        self.assertIn("w.id!=='fresh-cuts'",(ROOT/'listening-room.js').read_text())
        self.assertEqual(len(self.data['tracks']),64)
        self.assertEqual(len([t for t in self.data['tracks'] if t.get('new')]),3)
        self.assertEqual(len([w for w in self.data['worlds'] if w['id']!='fresh-cuts']),10)
        release=(ROOT/'scripts/publish_new_song.py').read_text()
        self.assertIn("a.publish",release)
        self.assertIn("'--publish'",release)
        self.assertIn('published_at',release)
        builder=(ROOT/'scripts/build_listening_catalog.py').read_text()
        self.assertIn("published_at=metadata.get('published_at')",builder)
        runner=shutil.which('node') or shutil.which('bun')
        self.assertIsNotNone(runner)
        result=subprocess.run([runner,str(ROOT/'scripts/test_new_music.js')],
                              capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('New Music PASS',result.stdout)

    def test_private_originals_are_encrypted_and_not_auto_published(self):
        private=ROOT/'private-media'
        expected={'manifest-20261111.bin','p1-20261111.bin','p2-20261111.bin'}
        self.assertEqual({p.name for p in private.iterdir()},expected)
        self.assertGreater((private/'p1-20261111.bin').stat().st_size,5_000_000)
        self.assertGreater((private/'p2-20261111.bin').stat().st_size,5_000_000)
        for file in private.iterdir():
            self.assertNotIn(b'ftyp',file.read_bytes()[:100])
            self.assertFalse(file.name.endswith(('.m4a','.wav','.mp3')))
        code=(ROOT/'frequency-private-music.js').read_text()
        self.assertIn("name:'AES-GCM'",code)
        self.assertIn("window.location.hash",code)
        self.assertIn("document.body.dataset.appTab==='new'",code)
        self.assertIn("KEY_STORE='frequency-private-key-v1'",code)
        self.assertIn("private-media/manifest-20261111.bin",code)
        self.assertIn("'./frequency-private-music.js'",(ROOT/'sw.js').read_text())
        for source in (ROOT/'index.html',ROOT/'frequency-parity.js',ROOT/'listening-catalog.json'):
            self.assertNotIn('what-the-morning-knows-english-take',source.read_text())
        play=(ROOT/'listening-room.js').read_text()
        self.assertIn('function renderTrackCards(root,tracks)',play)
        self.assertIn("playTrack(btn.dataset.play,false)",play)
        self.assertIn("state.current===id && state.buffering",play)
        self.assertIn('schedulePlaybackRefresh();',play)
        self.assertNotIn('state.tracks.filter(x=>x.new).map(x=>x.id)',play)

    def test_classic_navigation_preserves_current_catalog(self):
        html=self.html
        for name in ('discover','worlds','music','favorites'):
            self.assertIn('data-classic-tab="'+name+'"',html)
        self.assertIn('frequency-classic.css',html)
        self.assertIn('frequency-classic.js',html)
        self.assertIn("if(q==='classic')",html)
        self.assertNotIn('data-view-choice="classic"',html)
        css=(ROOT/'frequency-classic.css').read_text()
        self.assertIn('data-frequency-view="classic"',css)
        self.assertIn('repeat(4,minmax(0,1fr))',css)
        script=(ROOT/'frequency-classic.js').read_text()
        self.assertIn("app.resetLibrary()",script)
        self.assertIn("app.state.favoritesOnly=next==='favorites'",script)
        self.assertIn("window.FrequencyWebNavigation?.tab",script)
        self.assertNotIn("new Audio",script)
        self.assertEqual(len(self.data['tracks']),64)
        self.assertEqual(len(self.data['worlds']),11)
        runner=shutil.which('node') or shutil.which('bun')
        self.assertIsNotNone(runner)
        result=subprocess.run([runner,str(ROOT/'scripts/test_classic_view.js')],
                              capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('Classic navigation PASS',result.stdout)

    def test_classic_midnight_covers_entire_public_site(self):
        css=(ROOT/'frequency-legacy-appearance.css').read_text()
        subpages=[
            p for p in ROOT.glob('*.html')
            if 'frequency-legacy-appearance.css?v=' in p.read_text()
        ]
        self.assertGreaterEqual(len(subpages),35)
        for page in subpages:
            with self.subTest(page=page.name):
                text=page.read_text()
                self.assertEqual(text.count('frequency-legacy-appearance.css?v='),1)
                self.assertIn("frequency-theme-choice-v2",text)
                self.assertIn('data-frequency-appearance="midnight"',css)
                self.assertIn('data-frequency-page="'+page.name+'"',css)
        for selector in ('.world-song.active','.world-song','.track-row.active',
                         '.experience-scroll button','.lyrics-body','.world-detail-body'):
            self.assertIn(selector,(ROOT/'frequency-appearance.css').read_text())
        self.assertIn("'./frequency-legacy-appearance.css'",(ROOT/'sw.js').read_text())
        from generate_song_pages import page
        generated=page(self.data['tracks'][0])
        self.assertIn('frequency-theme-choice-v2',generated)
        self.assertIn('#090c12',generated)

    def test_appearance_preference_behavior(self):
        runner=shutil.which('node') or shutil.which('bun')
        self.assertIsNotNone(runner,'Node or Bun is needed for preference interactions')
        result=subprocess.run([runner,str(ROOT/'scripts/test_appearance_preference.js')],
                              capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('Appearance PASS',result.stdout)

    def test_javascript_syntax(self):
        checker=shutil.which('node') or shutil.which('deno')
        self.assertIsNotNone(checker,'Node or Deno is needed to validate browser JavaScript')
        command=[checker,'--check'] if Path(checker).name=='node' else [checker,'check']
        for name in ('listening-room.js','frequency-parity.js','frequency-appearance.js','frequency-classic.js','frequency-private-music.js','sw.js'):
            result=subprocess.run([*command,str(ROOT/name)],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,f'{name}: {result.stderr}')

if __name__=='__main__':unittest.main()
