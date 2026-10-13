#!/usr/bin/env python3
"""Losslessly relocate MP4/M4A metadata so mobile phones can start sooner.

Only changes files already published in listening-catalog.json.
This *remuxes* AAC samples (-c:a copy); it does not alter the music.
"""
import argparse
import json
import os
import shutil
import struct
import subprocess
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def boxes(path: Path):
    result={}
    size=path.stat().st_size
    with path.open('rb') as f:
        offset=0
        while offset+8<=size:
            f.seek(offset)
            header=f.read(8)
            length,kind=struct.unpack('>I4s',header)
            if length==1:
                extended=f.read(8)
                if len(extended)!=8:break
                length=struct.unpack('>Q',extended)[0]
            elif length==0:length=size-offset
            if length<8 or offset+length>size:break
            result.setdefault(kind,offset)
            offset+=length
    return result

def is_slow_start(path:Path):
    b=boxes(path)
    return b.get(b'moov',-1)>b.get(b'mdat',10**18)>=0

def process(path:Path):
    if not is_slow_start(path):return False
    fd,tmp=tempfile.mkstemp(suffix='.m4a',prefix='.faststart-',dir=str(path.parent))
    os.close(fd)
    try:
        subprocess.run(['ffmpeg','-hide_banner','-nostdin','-loglevel','error','-y','-i',str(path),
                        '-map','0:a:0','-c:a','copy','-movflags','+faststart',tmp],
                       check=True,timeout=90)
        if is_slow_start(Path(tmp)):raise ValueError('ffmpeg did not move moov metadata')
        if Path(tmp).stat().st_size<path.stat().st_size*.8:raise ValueError('Unexpected remux size')
        os.replace(tmp,path)
    finally:
        Path(tmp).unlink(missing_ok=True)
    return True

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--fix',action='store_true',help='Change the public files. Otherwise list candidates.')
    opts=parser.parse_args()
    if not shutil.which('ffmpeg'):raise SystemExit('ffmpeg required to remux')
    catalog=json.loads((ROOT/'listening-catalog.json').read_text())
    paths=sorted({ROOT/t['audio'] for t in catalog['tracks']
                  if t['audio'].lower().endswith('.m4a')})
    changed=[]
    for path in paths:
        if not path.is_file():raise SystemExit('Missing '+str(path))
        if is_slow_start(path):
            if opts.fix:process(path)
            changed.append(str(path.relative_to(ROOT)))
    print(f"{len(changed)} of {len(paths)} published M4A files need {'(fixed)' if opts.fix else '(would benefit from)'} fast-start.")
    for name in changed:print(name)
    if opts.fix and any(is_slow_start(p) for p in paths):
        raise SystemExit('At least one audio file still lacks fast-start metadata')

if __name__=='__main__':main()
