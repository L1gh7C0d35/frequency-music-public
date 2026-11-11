#!/usr/bin/env python3
"""Time-aligned spectral envelope assets for approved PUBLIC Frequency recordings.

Reads only the public catalog and publicly published files in this repository.
Never opens private library assets, never writes decoded audio back to disk.
Run locally: /opt/homebrew/bin/python3 scripts/build_sonic_signals.py --workers 6
"""
import argparse
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys

try:
    import numpy as np
except ImportError:
    sys.exit("numpy is required: python3 -m pip install numpy")

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "sonic-signals"
RATE = 16000
FFT_SIZE = 2048
HOP = 800                    # 20 updates/sec, 50 ms temporal resolution
BINS = 96
CHANNELS = 6 + BINS         # bass/mid/high, three transients, 96 spectral values
MAX_WAV_SECONDS = 1200       # safety bound for public tracks, 20 minutes max
BAND_LIMITS = ((45, 190), (190, 1900), (1900, 7750))
FFMPEG = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"


def norm_amplitude(array, low=3, high=98.5):
    """Compress per-track amplitudes while retaining their local dynamics."""
    a = np.asarray(array, dtype=np.float32)
    p = float(np.percentile(a, high))
    if p < 1.e-7:
        return np.zeros_like(a, dtype=np.float32)
    return np.clip((np.maximum(0, a) / p) ** 0.57, 0, 1)


def analyze(item):
    track_id = item['id']
    audio = ROOT / item['audio']
    if not audio.is_file():
        raise FileNotFoundError(f"Public recording missing for {track_id}: {audio}")
    if audio.suffix.lower() not in ('.m4a', '.mp3', '.wav', '.aac'):
        raise ValueError(f"Unexpected public recording type: {audio}")
    source_sha = hashlib.sha256(audio.read_bytes()).hexdigest()
    outfile = OUT / f"{track_id}.json"
    if outfile.exists():
        try:
            cached = json.loads(outfile.read_text())
            if (cached.get("version") == 1 and
                    cached.get("trackId") == track_id and
                    cached.get("sourceSha256") == source_sha and
                    cached.get("channels") == CHANNELS and
                    cached.get("spectrumBins") == BINS and
                    cached.get("sampleIntervalMs") == HOP * 1000 // RATE):
                return {
                    "id": track_id, "file": f"sonic-signals/{track_id}.json",
                    "durationSeconds": cached["durationSeconds"],
                    "frames": cached["frames"], "bytes": outfile.stat().st_size,
                    "audioSha256": source_sha
                }
        except (OSError, ValueError, KeyError, TypeError):
            pass
    # No shell, no network requests, decode only a single known public file.
    proc = subprocess.run(
        [FFMPEG, '-hide_banner', '-loglevel', 'error', '-nostdin',
         '-i', str(audio), '-vn', '-ac', '1', '-ar', str(RATE),
         '-t', str(MAX_WAV_SECONDS), '-f', 'f32le', 'pipe:1'],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True,
    )
    samples = np.frombuffer(proc.stdout, dtype='<f4')
    if len(samples) < FFT_SIZE:
        raise ValueError(f"Too little published audio to analyze: {track_id}")
    n = 1 + (len(samples) - FFT_SIZE) // HOP
    # Avoid producing enormous intermediate FFT arrays: process in 9-second windows.
    window = np.hanning(FFT_SIZE).astype('f4')
    freq = np.fft.rfftfreq(FFT_SIZE, 1 / RATE)
    log_targets = np.geomspace(45, 7750, BINS)
    bin_indices = np.clip(np.rint(log_targets / (RATE / FFT_SIZE)).astype('i4'), 1, FFT_SIZE // 2)
    band_lo = [max(1, int(np.floor(a / (RATE / FFT_SIZE)))) for a, _ in BAND_LIMITS]
    band_hi = [min(FFT_SIZE // 2, int(np.ceil(b / (RATE / FFT_SIZE)))) for _, b in BAND_LIMITS]
    bands = np.empty((n, 3), dtype=np.float32)
    spectrum = np.empty((n, BINS), dtype=np.float32)
    batch = 180
    for start in range(0, n, batch):
        stop = min(n, start + batch)
        starts = np.arange(start, stop) * HOP
        chunk = samples[starts[:, None] + np.arange(FFT_SIZE)[None, :]]
        magnitude = np.abs(np.fft.rfft(chunk * window, axis=1)).astype('f4')
        spectrum[start:stop] = magnitude[:, bin_indices]
        for k in range(3):
            section = magnitude[:, band_lo[k]:band_hi[k]+1]
            bands[start:stop, k] = np.sqrt(np.mean(section**2, axis=1))
    energies = np.empty_like(bands)
    for k in range(3):
        energies[:, k] = norm_amplitude(bands[:, k])
    # Fast onsets from a real track's measured energy, not randomly triggered effects.
    beats = np.zeros_like(energies)
    for k in range(3):
        previous = np.concatenate((np.zeros(2, dtype='f4'), energies[:-2, k]))
        recent = np.convolve(energies[:, k], np.ones(14, dtype='f4') / 14, mode='same')
        strikes = np.maximum(0, energies[:, k] - previous) * 2.65
        contrasts = np.maximum(0, energies[:, k] - recent * 1.08) * 1.25
        beats[:, k] = np.clip(strikes + contrasts, 0, 1)
    # Track-relative spectral structure, retaining quiet-vs-loud information.
    level = np.mean(energies, axis=1)
    spec_norm = np.empty_like(spectrum)
    for k in range(BINS):
        spec_norm[:, k] = norm_amplitude(spectrum[:, k]) * (0.32 + level * 0.68)
    # Efficient compact binary: 102 bytes for 50 ms of real measured audio.
    payload = np.clip(np.concatenate((energies, beats, spec_norm), axis=1) * 255, 0, 255).astype('u1')
    assert payload.shape == (n, CHANNELS)
    outfile.write_text(json.dumps({
        "version": 1, "trackId": track_id, "source": "approved-public-audio",
        "sampleIntervalMs": HOP * 1000 // RATE, "channels": CHANNELS,
        "spectrumBins": BINS, "frames": n,
        "durationSeconds": round(len(samples) / RATE, 2),
        "sourceSha256": source_sha,
        "data": base64.b64encode(payload.tobytes()).decode('ascii')
    }, separators=(',', ':')) + '\n')
    return {
        "id": track_id, "file": f"sonic-signals/{track_id}.json",
        "durationSeconds": round(len(samples) / RATE, 2),
        "frames": n, "bytes": outfile.stat().st_size,
        "audioSha256": source_sha
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--id', action='append', default=[], help="Only selected published IDs")
    args = parser.parse_args()
    catalog = json.loads((ROOT / 'listening-catalog.json').read_text())
    items = [x for x in catalog['tracks'] if not x.get('private') and (not args.id or x['id'] in args.id)]
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 10))) as pool:
        futures = {pool.submit(analyze, t): t['id'] for t in items}
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            print(f"analyzed {result['id']}: {result['frames']} samples, {result['bytes']} bytes", flush=True)
    manifest_file = OUT / 'manifest.json'
    existing = {}
    if manifest_file.exists():
        existing = {x['id']: x for x in json.loads(manifest_file.read_text()).get('tracks', [])}
    existing.update({x['id']: x for x in results})
    allowed = {item['id'] for item in catalog['tracks'] if not item.get('private')}
    existing = {tid: row for tid, row in existing.items() if tid in allowed}
    manifest = {
        "version": 1, "source": "approved-public-Frequency-catalog",
        "sampleRateHz": RATE, "fftSize": FFT_SIZE,
        "sampleIntervalMs": 50, "channels": CHANNELS, "spectrumBins": BINS,
        "tracks": sorted(existing.values(), key=lambda x: x['id'])
    }
    manifest_file.write_text(json.dumps(manifest, indent=2) + '\n')
    print(f"COMPLETE: {len(results)} analyzed, {len(manifest['tracks'])} in manifest, {sum(x['bytes'] for x in manifest['tracks'])} bytes JSON")


if __name__ == "__main__":
    main()
