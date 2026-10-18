#!/usr/bin/env python3
"""Local-only public/native parity check. Never imports or publishes private master audio."""
from pathlib import Path
import argparse, json, re, sqlite3, sys

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--native-root",type=Path,required=True)
    parser.add_argument("--label-db",type=Path)
    args=parser.parse_args()
    web=Path(__file__).resolve().parents[1]
    native=args.native_root.expanduser().resolve()
    tracks=json.loads((web/"listening-catalog.json").read_text())["tracks"]
    web_ids={track["id"] for track in tracks}
    audio=native/"Resources/Audio"
    native_audio_ids={p.stem for p in audio.iterdir() if p.suffix.lower() in (".mp3",".m4a",".wav",".aac")}
    source=(native/"App/AppModel.swift").read_text()
    native_catalog_ids=set(re.findall(r'FrequencyTrack\(id:\s*"([^"]+)"',source))
    issues={
        "not_in_native_audio":sorted(web_ids-native_audio_ids),
        "native_audio_not_in_web":sorted(native_audio_ids-web_ids),
        "not_in_native_catalog":sorted(web_ids-native_catalog_ids),
        "native_catalog_not_in_web":sorted(native_catalog_ids-web_ids),
        "missing_public_media":[t["id"] for t in tracks if not (web/t["audio"]).is_file() or not (web/t["image"]).is_file()],
    }
    print(f'Public: {len(web_ids)}; native catalog: {len(native_catalog_ids)}; native recordings: {len(native_audio_ids)}')
    for name,ids in issues.items():
        print(f'{name}: {len(ids)}'+(f' ({", ".join(ids[:5])})' if ids else ''))
    if args.label_db:
        con=sqlite3.connect(f'file:{args.label_db.expanduser().resolve()}?mode=ro',uri=True)
        label=con.execute('select id, final_approved from tracks').fetchall()
        extras=[x for x,_ in label if x not in web_ids]
        unapproved=sum(not bool(v) for _,v in label)
        print(f'Private Label catalog entries: {len(label)}; not on public site: {len(extras)}; no final approval flag: {unapproved}')
    if any(issues.values()):
        return 1
    print('PASS: public and native catalog/song files match exactly.')
    return 0

if __name__=="__main__":
    sys.exit(main())
