#!/usr/bin/env python3
"""Mirror *selected* Frequency Beta music assets and metadata to public Preview site.
This intentionally reads only shipped-in-app media. Private Creator/Flow output is excluded.
"""
import json,re,shutil,hashlib,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
APP=Path('/Users/darbybeenken/Developer/Frequency-App-Beta44')
WORLD_PATTERN=r'id: "([^"]+)",\s*name: "([^"]+)",\s*subtitle: "([^"]+)",\s*musicalSignature: "([^"]+)",\s*visualSignature: "([^"]+)",\s*referenceTrackIDs: \[([^]]*)\]'
TRACK_PATTERN=r'FrequencyTrack\(id: "([^"]+)", title: "([^"]+)", subtitle: "([^"]+)", detail: "([^"]+)", resourceName: "([^"]+)", duration: ([\d.]+), symbol: "([^"]+)", goals: \[([^\]]*)\], genres: \[([^\]]*)\]'
def strings(value):
    return re.findall(r'"([^"]+)"',value)
def copy_if_changed(source,target):
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.is_file() and source.stat().st_size==target.stat().st_size:
        # Never rely on timestamps: source has been rebuilt or rebundled.
        if hashlib.sha256(source.read_bytes()).digest()==hashlib.sha256(target.read_bytes()).digest():return False
    shutil.copyfile(source,target)
    return True
def main():
    model=(APP/'App'/'AppModel.swift').read_text()
    catalog=(APP/'App'/'FrequencyArtistCatalog.swift').read_text()
    parsed=re.findall(TRACK_PATTERN,model)
    worlds=[]
    for id,name,subtitle,signature,visual,refs in re.findall(WORLD_PATTERN,catalog):
        worlds.append(dict(id=id,name=name,subtitle=subtitle,musicalSignature=signature,visualSignature=visual,track_ids=strings(refs)))
    if len(parsed)<61 or len(worlds)<10:raise SystemExit('Unexpected app music model: refusing incomplete catalog export')
    parsed_ids={x[0] for x in parsed}
    lyrics={key:body.strip() for key,body in re.findall(r'"([a-z0-9-]+)": ##"""(.*?)"""##',model,re.S) if key in parsed_ids}
    tracks=[];changed=[]
    asset_root=APP/'Resources'/'Assets.xcassets'
    for id,title,subtitle,detail,res,duration,symbol,goals,genres in parsed:
        audio_path=None
        for ext in ('.m4a','.mp3'):
            p=APP/'Resources'/'Audio'/(res+ext)
            if p.is_file():audio_path=p;break
        if not audio_path:raise SystemExit('Missing app audio '+id)
        art=asset_root/('Artwork_'+id.replace('-','_')+'.imageset')/'art.jpg'
        if not art.is_file():raise SystemExit('Missing original Frequency app artwork '+id)
        audio_target=ROOT/'audio'/(id+audio_path.suffix)
        cover_target=ROOT/'artwork'/(id+'.jpg')
        if copy_if_changed(audio_path,audio_target):changed.append(str(audio_target.relative_to(ROOT)))
        if copy_if_changed(art,cover_target):changed.append(str(cover_target.relative_to(ROOT)))
        assigned=[w['id'] for w in worlds if id in w['track_ids']]
        tracks.append(dict(id=id,title=title,subtitle=subtitle,description=detail,goals=strings(goals),
            genres=strings(genres),artist='Frequency Originals',world=assigned[0] if assigned else 'fresh-cuts',
            worlds=assigned,audio='audio/'+audio_target.name,image='artwork/'+cover_target.name,
            duration=float(duration),source='Frequency Beta44',lyrics=lyrics.get(id,''),
            type='soundscape' if id.startswith('timekeeper-audio-') else 'song'))
    index=dict(schema_version=2,updated_from='Frequency Beta44',tracks=tracks,worlds=worlds)
    (ROOT/'app-track-export.json').write_text(json.dumps(index,indent=2,ensure_ascii=False)+'\n')
    print(f'Indexed {len(tracks)} tracks and {len(worlds)} sound worlds; {len(changed)} media files updated.')
    if changed:print('Changed files (first 20):',', '.join(changed[:20]))
if __name__=='__main__':main()
