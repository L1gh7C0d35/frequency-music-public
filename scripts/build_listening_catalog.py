#!/usr/bin/env python3
"""Build public listening catalog only from audio and approved-to-be-public existing artwork.
Uses files that were already in the public music Pages repository. Never scans private label catalog.
"""
import json,re,subprocess
from pathlib import Path
from html import unescape
ROOT=Path(__file__).resolve().parents[1]
WORLD={
 "velvet-sun":dict(name="Velvet Sun",short="Soul & light",subtitle="Warm soul · possibility · gratitude",description="Warmth, gratitude, and the feeling of something good arriving.",image="artwork/already-grateful.jpg",track_ids=["already-arrived","already-grateful","gold-on-my-mind","light-finds-me","open-to-more","everything-opens","i-give-the-signal"]),
 "iron-horizon":dict(name="Iron Horizon",short="Courage & rise",subtitle="Cinematic · courage · conviction",description="For the moments you choose to keep going.",image="artwork/crowned-by-fire.jpg",track_ids=["crowned-by-fire","storm-in-my-blood","i-do-not-break","made-of-mountains","pressure-into-power","watch-me-build","command-the-day","i-decide"]),
 "quiet-atlas":dict(name="Quiet Atlas",short="Calm & depth",subtitle="Stillness · reflection · deep focus",description="A quieter world with more room to breathe.",image="artwork/quiet-empire.jpg",track_ids=["quiet-empire","built-in-silence","future-in-the-room","soft-life-strong-mind","this-is-my-normal"]),
 "electric-bloom":dict(name="Electric Bloom",short="Energy & motion",subtitle="Rhythm · energy · celebration",description="Movement for the life you're making.",image="artwork/golden-hour.jpg",track_ids=["momentum-is-mine","money-meets-motion","run-with-the-light","golden-hour","move-like-money","luck-follows-action","built-for-this","the-room-changes"]),
}
# Sound worlds are editorial clusters, not claimed individual artist credits.
LEGACY=(ROOT/"legacy-library.html").read_text()
METADATA={}
for article in re.findall(r'<article class="song".*?</article>',LEGACY,re.S):
    slug=re.search(r'data-slug="([^"]+)"',article)
    if not slug: continue
    duration=re.search(r'<div class="sub">([^<]+)</div>',article)
    description=re.search(r'<p class="desc">([^<]+)</p>',article)
    title=re.search(r'data-title="([^"]+)"',article)
    METADATA[slug.group(1)]={
       "subtitle":unescape(duration.group(1).strip()) if duration else "",
       "description":unescape(description.group(1).strip()) if description else "",
       "title":unescape(title.group(1).strip()) if title else ""
    }
def duration(path):
    try:
        r=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)],capture_output=True,text=True,timeout=4)
        return int(round(float(r.stdout.strip())))
    except Exception:return None
seen=set()
tracks=[]
for world_id,world in WORLD.items():
 for slug in world["track_ids"]:
  audio=ROOT/"audio"/(slug+".m4a")
  cover=ROOT/"artwork"/(slug+".jpg")
  if not (audio.is_file() and cover.is_file()):
   print("SKIP missing public asset",slug);continue
  if slug in seen: raise ValueError("Duplicate song "+slug)
  seen.add(slug)
  old=METADATA.get(slug,{})
  dur=duration(audio)
  nice=old.get("title") or " ".join(w.upper() if w=="i" else w.capitalize() for w in slug.split("-"))
  tracks.append(dict(id=slug,title=nice,world=world_id,artist="Frequency Originals",image="artwork/"+slug+".jpg",
                     audio="audio/"+slug+".m4a",duration=dur,subtitle=world["subtitle"],
                     description=old.get("description") or world["description"]))
result=dict(version=1,collection="Frequency Listening Room",worlds=[
 dict(id=k,**{i:v for i,v in val.items() if i!="track_ids"},count=sum(t["world"]==k for t in tracks)) for k,val in WORLD.items()
],tracks=tracks)
(ROOT/"listening-catalog.json").write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n")
print("Wrote",len(tracks),"songs across",len(WORLD),"worlds")
