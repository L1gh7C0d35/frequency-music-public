#!/usr/bin/env python3
"""Build the public candidate-only manifest from actual audio metadata."""
import json
import subprocess
from pathlib import Path
from datetime import datetime, timezone
root = Path(__file__).resolve().parents[1]
items = []
for audio in sorted((root / "audio").glob("*.m4a")):
    proc = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(audio)],
        capture_output=True, text=True, check=False, timeout=15)
    try:
        duration = round(float(proc.stdout.strip()), 2)
    except ValueError:
        continue
    if 10 <= duration <= 1200:
        items.append({"filename": audio.name, "duration": duration})
out = root / "lab-manifest.json"
out.write_text(json.dumps({
    "schema": 1,
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "tracks": items
}, indent=2) + "\n")
print("manifest_entries=" + str(len(items)))
