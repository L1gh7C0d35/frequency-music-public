#!/usr/bin/env python3
"""Validate the static Listening Room before publishing GitHub Pages."""
import json
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
    def test_links_and_controls(self):
        for path in ('listening-room.css','listening-room.js','frequency-parity.js','frequency-parity.css','manifest.webmanifest','sw.js','music.html','studio.html','legacy-library.html'):
            self.assertTrue((ROOT/path).is_file())
        for ident in ('mainAudio','worldGrid','trackList','nowOverlay','nowPlay','miniPlay','feedbackModal','exportFeedback','ritualsScreen','wordsScreen','youScreen','nowLyrics','appModeRow','intentFilters'):
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
        self.assertEqual(source.count("querySelectorAll('button[data-app-tab]')"),2)
        self.assertIn("app.closeWorld({restoreScroll:false})",source)
        # Body itself carries data-app-tab for CSS. Attaching a click handler
        # to it made every artist/track click silently navigate Home.
        self.assertIn('document.body.dataset.appTab=id',source)

    def test_javascript_syntax(self):
        p=subprocess.run(['node','--check',str(ROOT/'listening-room.js')],capture_output=True,text=True)
        self.assertEqual(p.returncode,0,p.stderr)
        for name in ('frequency-parity.js','sw.js'):
            result=subprocess.run(['node','--check',str(ROOT/name)],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)

if __name__=='__main__':unittest.main()
