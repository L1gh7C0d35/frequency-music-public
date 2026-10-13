#!/usr/bin/env python3
"""Local, offline Whisper word-time drafts for *existing* creator-supplied lyrics.

Exact matched words only; unmatched text has null timing and never lights up.
This produces a PREVIEW, not verified professional lyric sync. Never adjust
timestamps via interpolation, time stretching, or fabricated lyric timing.
"""
import difflib
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MODEL=Path.home()/'.cache/whisper-models/ggml-base.en.bin'
DEST=ROOT/'word-timing'
def word(s):
    return re.sub(r'[^a-z0-9]', '',s.lower().replace('’',"'"))
def lines_to_words(lyrics):
    lines=lyrics.replace('\r','').strip().split('\n')
    return [w for line in lines if line.strip() and not re.fullmatch(r'\[[^\]]+\]',line.strip())
            for w in line.strip().split()]
def candidate(rec):
    raw=rec.get('text','').strip()
    if not raw or not word(raw):return None
    offsets=rec.get('offsets',{})
    a=offsets.get('from');b=offsets.get('to')
    if not isinstance(a,(int,float)) or not isinstance(b,(int,float)) or b<=a:return None
    return (raw,round(a/1000,2),round(b/1000,2))
def main():
    if not MODEL.exists():raise SystemExit('Missing local ASR model: '+str(MODEL))
    src=json.loads((ROOT/'listening-catalog.json').read_text())
    tracks=[t for t in src['tracks'] if t.get('lyrics','').strip()]
    DEST.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='frequency-word-sync-') as tmp:
        wave=Path(tmp)/'track.wav'
        prefix=Path(tmp)/'whisper'
        for t in tracks:
            out=DEST/(t['id']+'.json')
            if out.exists():
                try:
                    existing=json.loads(out.read_text())
                    if existing.get('lyrics_hash')==__import__('hashlib').sha256(t['lyrics'].encode()).hexdigest() and existing.get('audio_sha256')==__import__('hashlib').sha256((ROOT/t['audio']).read_bytes()).hexdigest():
                        print('EXISTING',t['id'],existing.get('match_ratio'));continue
                except Exception:pass
            audio=ROOT/t['audio']
            subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-i',str(audio),
                            '-ac','1','-ar','16000','-c:a','pcm_s16le',str(wave)],
                           check=True,timeout=50)
            p=subprocess.run(['whisper-cli','-m',str(MODEL),'-f',str(wave),
                             '-t','4','-ml','1','-sow','-ojf','-of',str(prefix)],
                            stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=80)
            if p.returncode!=0:raise RuntimeError('Whisper failed for '+t['id'])
            draft=json.loads(prefix.with_suffix('.json').read_text())
            trans=[c for s in draft['transcription'] if (c:=candidate(s))]
            lyrics=lines_to_words(t['lyrics'])
            al=difflib.SequenceMatcher(None,[word(w) for w in lyrics],
                                        [word(s[0]) for s in trans],autojunk=False)
            timeline=[None]*len(lyrics)
            for a,b,n in al.get_matching_blocks():
                for i in range(n):
                    raw,t0,t1=trans[b+i]
                    timeline[a+i]=[t0,t1]
            matched=sum(x is not None for x in timeline)
            ratio=round(matched/max(1,len(lyrics)),3)
            # Do not expose a word-follow control if automated matching
            # is unreliable. Full lyrics remain available regardless.
            payload={'schema':1,'id':t['id'],'method':'offline-whisper-base-en-exact-word-match',
                'status':'automatic-preview-not-verified','match_ratio':ratio,
                'matched_words':matched,'lyric_words':len(lyrics),
                'lyrics_hash':__import__('hashlib').sha256(t['lyrics'].encode()).hexdigest(),
                'audio_sha256':__import__('hashlib').sha256(audio.read_bytes()).hexdigest(),
                'word_times':timeline}
            out.write_text(json.dumps(payload,separators=(',',':'))+'\n')
            print(t['id'],f'{matched}/{len(lyrics)} ({100*ratio:.1f}%)',flush=True)
    print('Generated',len(tracks),'word-time drafts.')
if __name__=='__main__':main()
