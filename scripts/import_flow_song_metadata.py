#!/usr/bin/env python3
"""Enrich an explicitly supplied Frequency track from its original public Flow Music song page.

Only approved source URLs already in flow-song-metadata.json are fetched.
Store source provenance locally; do not expose the Flow URL in site catalog.
No login scraping or guessing new song IDs, voices or BPM.
"""
import html
import json
import re
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
STORE=ROOT/'flow-song-metadata.json'
HOSTS={'flowmusic.app','www.flowmusic.app'}
def clip_for_url(url):
    parsed=urlparse(url)
    if parsed.scheme!='https' or parsed.hostname not in HOSTS:
        raise ValueError('Unapproved Flow source URL')
    song_id=re.fullmatch(r'/song/([a-z0-9-]{20,70})/?',parsed.path)
    if not song_id:raise ValueError('Expected direct Flow Music song link')
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; FrequencyMetadataImporter/1.0)'})
    with urllib.request.urlopen(req,timeout=18) as response:
        page=response.read(1024*1024).decode('utf-8')
    match=re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',page,re.S)
    if not match:raise ValueError('No public song data in page')
    parsed_data=json.loads(html.unescape(match.group(1)))
    q=parsed_data['props']['sdc']['queryClient']['queries']
    clip=next((row['state']['data'] for row in q if row.get('queryKey')==['clip',song_id.group(1)]),None)
    if not isinstance(clip,dict) or clip.get('id')!=song_id.group(1):
        raise ValueError('Flow song metadata missing; sign-in may be required')
    return clip

def fetch_into_store():
    original=json.loads(STORE.read_text())
    all_track_ids={record['id'] for record in json.loads((ROOT/'app-track-export.json').read_text())['tracks']}
    results=[]
    for track_id,meta in original.items():
        url=meta.get('source_url')
        if not url:continue
        if track_id not in all_track_ids:raise ValueError('Unknown app track '+track_id)
        clip=clip_for_url(url)
        op=clip.get('operation') or {}
        sound=op.get('sound_prompt') or ''
        raw=clip.get('lyrics') or {}
        lyric_value=raw.get('value') or {}
        lyric_text=lyric_value.get('text','') if isinstance(lyric_value,dict) else ''
        if sound:meta['sound']=sound
        if lyric_text:
            meta['lyrics']=lyric_text
            meta['lyric_status']='source-Flow-lyrics-sheet-not-synced'
        if sound and (bpm:=re.search(r'(?<!\d)(\d{2,3})\s*BPM\b',sound,re.I)):
            meta['bpm']=int(bpm.group(1))
        meta['flow_clip_id']=clip['id']
        meta['source_duration_seconds']=float((clip.get('duration') or {}).get('value') or 0)
        meta['source_title']=clip.get('title','')
        meta['source_created_at']=clip.get('created_at')
        meta['metadata_provenance']='Direct creator-supplied Flow Music song URL; publicly visible source data, imported October 2026'
        meta['source_retrieved_from_public_page']=True
        meta['lyrics_provenance']='Flow Music supplied lyrics text (not necessarily every sung word)'
        results.append((track_id,bool(sound),len(lyric_text),meta['source_duration_seconds']))
    STORE.write_text(json.dumps(original,indent=2,ensure_ascii=False)+'\n')
    print('ENRICHED',results)
    return results

if __name__=='__main__':fetch_into_store()
