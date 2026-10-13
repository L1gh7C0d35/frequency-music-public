#!/usr/bin/env python3
"""Publish one explicitly selected public test song into the Frequency Android web preview.

Dry-run by default. This script never scans/exports all drafts from Google Flow
or Music Maker. Only the named source is copied on --publish; any extra rights
review remains the owner's responsibility. The Github Actions workflow rebuilds
the site automatically after an ordinary GitHub push.
"""
from pathlib import Path
import argparse,json,subprocess,re,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
WORLD_IDS=set()
def run(cmd):
    subprocess.run(cmd,cwd=ROOT,check=True)
def slug(text):
    return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',text.lower())).strip('-')[:88]
def main():
    p=argparse.ArgumentParser(description='Add one approved-to-share test song to public site')
    p.add_argument('--audio',type=Path,required=True,help='Absolute path to one audio file')
    p.add_argument('--title',required=True)
    p.add_argument('--world',default='fresh-cuts')
    p.add_argument('--cover',type=Path,help='Optional JPEG/PNG image')
    p.add_argument('--subtitle',default='New listening preview')
    p.add_argument('--description',default='Fresh music for feedback and testing.')
    p.add_argument('--publish',action='store_true',help='Copy, commit, and push this song publicly')
    a=p.parse_args()
    if not a.audio.expanduser().is_file():raise SystemExit('Source audio missing')
    src=a.audio.expanduser().resolve()
    world_ids={w['id'] for w in json.loads((ROOT/'app-track-export.json').read_text())['worlds']}|{'fresh-cuts'}
    if a.world not in world_ids:raise SystemExit('Unknown sound world: '+a.world)
    name=slug(a.title)
    if not name:raise SystemExit('Title cannot be converted to a valid slug')
    ext=src.suffix.lower()
    if ext not in ('.mp3','.m4a','.wav','.flac','.aiff','.aif','.aac'):raise SystemExit('Unsupported audio format')
    dest=ROOT/'audio'/'new'/(name+'.m4a')
    meta=ROOT/'audio'/'new'/(name+'.json')
    if dest.exists() or meta.exists():raise SystemExit('Existing preview with this title. Use a unique version or rename it explicitly.')
    cover=None
    if a.cover:
        cover=a.cover.expanduser().resolve()
        if not cover.is_file() or cover.suffix.lower() not in ('.png','.jpg','.jpeg'):
            raise SystemExit('Cover must be an existing JPEG or PNG')
        ext_img='.png' if cover.suffix.lower()=='.png' else '.jpg'
        cover_dest=ROOT/'artwork'/'new'/(name+ext_img)
        if cover_dest.exists():raise SystemExit('Cover destination already exists')
    print('Public preview URL will include:', 'https://l1gh7c0d35.github.io/frequency-music-public/?track=new-'+name)
    print('Song title:',a.title,'| sound world:',a.world)
    print('Source:',src)
    print('By publishing, this audio and metadata will be publicly accessible to anyone with the URL.')
    if not a.publish:
        print('DRY RUN: no files copied and no GitHub publishing triggered. Add --publish to proceed.')
        return
    # Isolated independent changes only. Never git-add private files or unrelated work.
    run(['git','diff','--quiet'])
    if dest.parent not in src.parents and dest!=src:
        dest.parent.mkdir(exist_ok=True,parents=True)
        # Transcode the preview only, preserving the original source untouched.
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),
                        '-vn','-c:a','aac','-b:a','256k','-movflags','+faststart',str(dest)],check=True,timeout=600)
    else:raise SystemExit('Input must be an external source, not an existing web preview')
    if dest.stat().st_size>100_000_000:
        dest.unlink(missing_ok=True)
        raise SystemExit('Converted file exceeds GitHub file size limit')
    paths=[str(dest.relative_to(ROOT))]
    if cover:
        cover_dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(cover,cover_dest);paths.append(str(cover_dest.relative_to(ROOT)))
    fields=dict(title=a.title,subtitle=a.subtitle,description=a.description,world=a.world)
    meta.write_text(json.dumps(fields,indent=2,ensure_ascii=False)+'\n')
    paths.append(str(meta.relative_to(ROOT)))
    run([sys.executable,'scripts/build_listening_catalog.py'])
    paths.append('listening-catalog.json')
    run(['git','add','--',*paths])
    run(['git','diff','--cached','--check'])
    run(['git','commit','-m','Publish music web preview: '+a.title,'--',*paths])
    run(['git','push','origin','main'])
    print('Committed and pushed. GitHub Actions will rebuild the website automatically.')
if __name__=='__main__':main()
