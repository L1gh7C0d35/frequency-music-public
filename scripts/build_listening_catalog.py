#!/usr/bin/env python3
"""Build public Frequency preview from explicitly published web assets.

The app-track-export.json is a snapshot from the shipped Frequency app, not
a live connection to the developer Mac. New songs only enter from audio/new/
(a deliberately public upload folder). This runs on GitHub Actions.
"""
import json, subprocess,re,hashlib
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'app-track-export.json'
FLOW_METADATA=ROOT/'flow-song-metadata.json'
LYRIC_TIMINGS=ROOT/'word-timing'
PREVIEW=ROOT/'audio'/'new'
VALID={'.m4a','.mp3','.wav','.ogg','.aac','.flac'}
def duration(path):
    # ffprobe is optional; browser will load real duration for new tracks.
    if not __import__('shutil').which('ffprobe'):return None
    try:
        p=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],capture_output=True,text=True,timeout=6)
        return round(float(p.stdout.strip()),2)
    except Exception:return None
def title_from_name(stem):
    acronyms={'i':'I','ai':'AI','dj':'DJ'}
    return ' '.join(acronyms.get(x,x.capitalize()) for x in stem.lower().replace('_','-').split('-'))
def build():
    app=json.loads(SOURCE.read_text())
    worlds=[]
    for w in app['worlds']:
        ids=w.get('track_ids',[])
        # Hero art links to an existing public artwork, not a hypothetical performer.
        valid=[x for x in ids if (ROOT/'artwork'/(x+'.jpg')).is_file()]
        # The first two world covers looked identical to reviewers despite
        # being different files: select a distinctive existing Future Signal
        # cityscape instead of a second futuristic window.
        preferred={'future-signal':'this-is-my-normal'}.get(w['id'])
        if preferred and preferred in valid:
            valid.remove(preferred);valid.insert(0,preferred)
        world=dict(id=w['id'],name=w['name'],subtitle=w['subtitle'],
                   description=w['musicalSignature'],visual=w['visualSignature'],
                   image='artwork/'+valid[0]+'.jpg' if valid else 'artwork/fresh-cuts.svg',
                   count=0)
        worlds.append(world)
    tracks=[]
    flow_metadata=json.loads(FLOW_METADATA.read_text()) if FLOW_METADATA.is_file() else {}
    known_ids={r['id'] for r in app['tracks']}
    if set(flow_metadata)-known_ids:
        raise ValueError('Flow metadata refers to unknown song ids: '+str(set(flow_metadata)-known_ids))
    for record in app['tracks']:
        if not (ROOT/record['audio']).is_file():raise ValueError('Audio missing for app song: '+record['id'])
        if not (ROOT/record['image']).is_file():raise ValueError('Artwork missing for app song: '+record['id'])
        enriched=record.copy()
        # Creator-approved golden sacred-geometry cover overrides the old blue landscape.
        if record['id']=='timekeeper-audio-528-hz-sacred-grace':
            enriched['image']='artwork/timekeeper-audio-528-hz-sacred-grace-gold.jpg'
        if record['id'] in flow_metadata:
            # Import approved source details, not the outbound source URL.
            public_fields={'sound','lyrics','bpm','instruments','experiences',
                           'voice_group','voice_match_provenance','source_title',
                           'source_duration_seconds','source_created_at'}
            enriched.update({k:v for k,v in flow_metadata[record['id']].items()
                             if k in public_fields})
        # This creator-confirmed same-singer pair belongs to Golden Current.
        # No other sound world's performer identity is assumed.
        if enriched.get('voice_group') == 'golden-current-528-singer':
            enriched['artist']='Golden Current'
        # Even a future source snapshot must not push a listener offsite.
        enriched.pop('source_url',None)
        enriched.pop('flow_clip_id',None)
        timeline=LYRIC_TIMINGS/(record['id']+'.json')
        if timeline.is_file() and record.get('lyrics'):
            data=json.loads(timeline.read_text())
            current_lyrics=hashlib.sha256(record['lyrics'].encode()).hexdigest()
            current_audio=hashlib.sha256((ROOT/record['audio']).read_bytes()).hexdigest()
            if data['lyrics_hash']==current_lyrics and data['audio_sha256']==current_audio:
                if data.get('match_ratio',0)>=0.60:
                    enriched['wordTimes']=data['word_times']
                    enriched['wordTimingQuality']=data['match_ratio']
                    enriched['wordTimingSource']='offline automatic Whisper alignment · needs human verification'
            else:
                print('Stale lyric timing skipped:',record['id'])
        tracks.append(enriched)
    extras=[]
    if PREVIEW.is_dir():
        for p in sorted(PREVIEW.iterdir()):
            if not p.is_file() or p.suffix.lower() not in VALID:continue
            stem=p.stem
            safe=re.fullmatch(r'[a-z0-9][a-z0-9-]{0,90}',stem)
            if not safe:raise ValueError('Use lowercase hyphenated filenames for public uploads: '+p.name)
            ident='new-'+stem
            side=PREVIEW/(stem+'.json')
            metadata=json.loads(side.read_text()) if side.is_file() else {}
            world=metadata.get('world','fresh-cuts')
            if world not in {w['id'] for w in worlds}:world='fresh-cuts'
            cover=ROOT/'artwork'/'new'/(stem+'.jpg')
            if not cover.is_file():cover=ROOT/'artwork'/'new'/(stem+'.png')
            cover_name=str(cover.relative_to(ROOT)) if cover.is_file() else 'artwork/fresh-cuts.svg'
            extras.append(dict(id=ident,title=metadata.get('title') or title_from_name(stem),
                subtitle=metadata.get('subtitle') or 'New listening preview',
                description=metadata.get('description') or 'Fresh music for feedback and testing.',
                world=world,worlds=[world],artist='Frequency Originals',
                goals=metadata.get('goals') or [],genres=metadata.get('genres') or ['Preview'],
                experiences=metadata.get('experiences') or [],
                sound=metadata.get('sound') or '',bpm=metadata.get('bpm'),
                instruments=metadata.get('instruments') or [],
                # Flow provenance is a publishing input, never a listening exit link.
                audio=str(p.relative_to(ROOT)),image=cover_name,duration=duration(p),
                source='Public preview upload',type='song',new=True))
    if extras:
        worlds.append(dict(id='fresh-cuts',name='Fresh Cuts',subtitle='Latest uploads · listen & respond',
             description='New tracks uploaded for listening and feedback.',
             visual='Artwork pending final review',image='artwork/fresh-cuts.svg',count=0))
        tracks=extras+tracks
    # A creator-confirmed shared voice must never be separated into different
    # artist worlds by future uploads or by a catalog sync.
    voices={}
    for record in tracks:
        voice=record.get('voice_group')
        if voice:
            voices.setdefault(voice,set()).add(record['world'])
    for voice,world_ids in voices.items():
        if len(world_ids)!=1:
            raise ValueError(f'Same singer scattered across artist worlds: {voice}: {world_ids}')
    for w in worlds:w['count']=sum(1 for t in tracks if w['id'] in t.get('worlds',[t['world']]))
    # This artifact is plain JSON with no secrets, owner data, private master paths, or lyrics.
    manifest={'version':3,'collection':'Frequency Originals · Android/iOS web preview',
              'worlds':worlds,'tracks':tracks,'new_count':len(extras)}
    (ROOT/'listening-catalog.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print('Published catalog generated:',len(tracks),'songs,',len(worlds),'worlds,',len(extras),'new preview uploads')
if __name__=='__main__':build()
