#!/usr/bin/env python3
"""Make one metadata-rich GitHub Pages landing URL for each public Frequency track."""
from pathlib import Path
import argparse
import html
import json
import re
from urllib.parse import quote

ROOT=Path(__file__).resolve().parents[1]
BASE="https://l1gh7c0d35.github.io/frequency-music-public/"
def page(track):
    title=str(track['title'])
    identifier=str(track['id'])
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,120}",identifier):
        raise ValueError("Unsafe track slug "+identifier)
    sound=str(track.get('sound') or track.get('description') or track.get('subtitle') or 'Original Frequency recording.')
    artist=str(track.get('world') or 'Frequency Music')
    desc=(sound[:240]+'…') if len(sound)>240 else sound
    target=BASE+"song/"+quote(identifier)+"/"
    cover=BASE+quote(track["image"],safe="/")
    audio=BASE+quote(track["audio"],safe="/")
    audio_type="audio/mp4" if track["audio"].endswith(".m4a") else "audio/mpeg"
    homepage="../../?track="+quote(identifier)+"&from=share"
    escaped_title=html.escape(title,quote=True)
    escaped_desc=html.escape(desc,quote=True)
    escaped_cover=html.escape(cover,quote=True)
    escaped_url=html.escape(target,quote=True)
    escaped_audio=html.escape(audio,quote=True)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escaped_title} · Frequency Music</title>
<meta name="description" content="{escaped_desc}">
<meta property="og:type" content="music.song">
<meta property="og:site_name" content="Frequency Music">
<meta property="og:title" content="{escaped_title} · Frequency Music">
<meta property="og:description" content="{escaped_desc}">
<meta property="og:url" content="{escaped_url}">
<meta property="og:image" content="{escaped_cover}">
<meta property="og:audio" content="{escaped_audio}">
<meta property="og:audio:type" content="{audio_type}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{escaped_title} · Frequency Music">
<meta name="twitter:description" content="{escaped_desc}">
<meta name="twitter:image" content="{escaped_cover}">
<link rel="canonical" href="{escaped_url}">
<meta http-equiv="refresh" content="1;url={html.escape(homepage,quote=True)}">
<style>html{{color-scheme:dark;font:16px system-ui;background:#0d1711;color:#f3f0e8}}
body{{display:grid;min-height:90vh;place-items:center;text-align:center;padding:1rem}}
main{{max-width:340px}}img{{width:100%;aspect-ratio:1;object-fit:cover;border-radius:18px}}
a{{display:inline-block;margin-top:18px;background:#f3f0e8;color:#0d1711;padding:12px 22px;
border-radius:999px;text-decoration:none;font-weight:700}}</style>
</head><body><main><img src="{escaped_cover}" alt="Song cover artwork">
<h1>{escaped_title}</h1><p>Opening your song in Frequency Music…</p>
<a href="{html.escape(homepage,quote=True)}">▶ Listen to this song</a>
<p><small>One tap to play · Browse the whole collection afterward</small></p>
</main><script>location.replace({json.dumps(homepage)});</script></body></html>
"""
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--site-dir",type=Path,default=ROOT,help="Where index.html and song/ will be served")
    args=parser.parse_args()
    catalog=json.loads((ROOT/"listening-catalog.json").read_text())
    dest=args.site_dir/"song"
    for record in catalog["tracks"]:
        folder=dest/record["id"]
        folder.mkdir(parents=True,exist_ok=True)
        (folder/"index.html").write_text(page(record),encoding="utf-8")
    print("Made",len(catalog["tracks"]),"individual song sharing pages at",dest)
if __name__=="__main__":main()
