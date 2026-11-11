"""QA for the one-player Frequency Sonic Studio feature in the public site."""
import base64
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]

class TestSonicSignals(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog=json.loads((ROOT/'listening-catalog.json').read_text())
        cls.manifest=json.loads((ROOT/'sonic-signals/manifest.json').read_text())

    def test_all_approved_public_tracks_have_corresponding_analysis(self):
        expected={t['id'] for t in self.catalog['tracks'] if not t.get('private')}
        indexed={t['id'] for t in self.manifest['tracks']}
        self.assertEqual(expected,indexed)
        self.assertGreater(len(expected),0)

    def test_every_public_analysis_has_correct_shape(self):
        self.assertEqual(1,self.manifest['version'])
        self.assertEqual(96,self.manifest['spectrumBins'])
        self.assertEqual(102,self.manifest['channels'])
        for item in self.manifest['tracks']:
            with self.subTest(track=item['id']):
                self.assertEqual(f"sonic-signals/{item['id']}.json",item['file'])
                signal=json.loads((ROOT/item['file']).read_text())
                self.assertEqual(signal['trackId'],item['id'])
                self.assertEqual(1,signal['version'])
                self.assertEqual(50,signal['sampleIntervalMs'])
                self.assertEqual(102,signal['channels'])
                self.assertEqual(96,signal['spectrumBins'])
                self.assertGreater(signal['frames'],5)
                self.assertEqual(signal['frames']*102,len(base64.b64decode(signal['data'])))
                self.assertAlmostEqual(item['durationSeconds'],signal['durationSeconds'],places=2)

    def test_single_audio_player_and_no_browser_audio_rerouting(self):
        html=(ROOT/'index.html').read_text()
        js=(ROOT/'sonic-studio.js').read_text()
        self.assertEqual(1,html.count('<audio '))
        self.assertIn('id="mainAudio"',html)
        self.assertIn('id="nowVisuals"',html)
        self.assertIn('sonic-studio.js',html)
        self.assertIn('document.getElementById("mainAudio")',js)
        self.assertIn('FrequencyPreview',js)
        self.assertNotIn('new Audio(',js)
        self.assertNotIn('createMediaElementSource(',js)
        self.assertNotIn('createMediaStreamSource(',js)
        self.assertNotIn('createOscillator(',js)

    def test_analysis_generated_only_for_public_catalog_assets(self):
        for t in self.catalog['tracks']:
            if t.get('private'):
                self.assertNotIn(t['id'],{x['id'] for x in self.manifest['tracks']})
        self.assertFalse(any(x['id'].startswith('private-') for x in self.manifest['tracks']))

if __name__=="__main__":
    unittest.main()
