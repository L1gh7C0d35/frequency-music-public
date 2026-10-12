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
                self.assertGreater((ROOT/track['image']).stat().st_size,3000)
    def test_exclusive_public_catalog_paths(self):
        for t in self.data['tracks']:
            for key in ('audio','image'):
                self.assertFalse(t[key].startswith('/'))
                self.assertNotIn('..',Path(t[key]).parts)
                self.assertNotIn('Users',t[key])
        self.assertEqual(len({t['id'] for t in self.data['tracks']}),len(self.data['tracks']))
    def test_worlds(self):
        names={w['id'] for w in self.data['worlds']}
        self.assertEqual(len(names),4)
        self.assertEqual(len(self.data['tracks']),28)
        for w in self.data['worlds']:
            self.assertTrue((ROOT/w['image']).is_file())
            self.assertEqual(w['count'],sum(t['world']==w['id'] for t in self.data['tracks']))
        self.assertTrue(all(t['world'] in names for t in self.data['tracks']))
    def test_links_and_controls(self):
        for path in ('listening-room.css','listening-room.js','music.html','studio.html','legacy-library.html'):
            self.assertTrue((ROOT/path).is_file())
        for ident in ('mainAudio','worldGrid','trackList','nowOverlay','nowPlay','miniPlay','feedbackModal','exportFeedback'):
            self.assertIn('id="'+ident+'"',self.html)
        self.assertIn('listening-catalog.json',(ROOT/'listening-room.js').read_text())
        self.assertIn('location.replace',(ROOT/'music.html').read_text())
    def test_javascript_syntax(self):
        p=subprocess.run(['node','--check',str(ROOT/'listening-room.js')],capture_output=True,text=True)
        self.assertEqual(p.returncode,0,p.stderr)

if __name__=='__main__':unittest.main()
