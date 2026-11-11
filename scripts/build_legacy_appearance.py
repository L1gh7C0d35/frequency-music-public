#!/usr/bin/env python3
"""Generate opt-in Midnight color overrides for Frequency's archived HTML pages.

Preserves existing CSS, layout, music and pages. Does not edit their defaults.
Every generated rule is scoped to the saved appearance AND its exact page.
"""
from __future__ import annotations

import colorsys
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'frequency-legacy-appearance.css'
EXCLUDE = {'index.html', 'music.html'}
PAGES = sorted(p for p in ROOT.glob('*.html') if p.name not in EXCLUDE)

EXACT = {
    '#090d0c': '#090c12', '#090d0d': '#090c12', '#0b1010': '#0c0f15',
    '#151c1b': '#151a22', '#151b18': '#151a22', '#1f2924': '#1b212b',
    '#23312a': '#263246', '#18241e': '#1d2532', '#35483b': '#37455a',
    '#0c1110': '#0e121a', '#1b2522': '#1b2532', '#23302c': '#253043',
    '#2b4939': '#364356', '#425149': '#515b6c', '#293630': '#2d3849',
    '#2c3634': '#303844', '#090d0c': '#090c12', '#070908': '#090c12',
    '#071009': '#0c0f15', '#0b0f0c': '#0e131b', '#173025': '#203045',
    '#1f2d25': '#222d3b', '#263d30': '#2c3b50', '#0b0e0c': '#10131b',
    '#193125': '#263346', '#26342d': '#2c3b4e', '#93bfa8': '#d1bca0',
    '#5e806d': '#78859b', '#78a989': '#adb7c8', '#72917d': '#a9b5c5',
    '#090d0d': '#090c12', '#0b150f': '#151b25', '#122018': '#171d27',
    '#0b1610': '#111723', '#23342b': '#282d33', '#101b14': '#141a24'
}
COLOR = re.compile(r'#[\da-fA-F]{6}(?:[\da-fA-F]{2})?(?![\da-fA-F])')
STYLES = re.compile(r'<style(?:\s[^>]*)?>(.*?)</style>', re.I | re.S)
COMMENTS = re.compile(r'/\*.*?\*/', re.S)

def convert(token: str) -> str:
    lower = token.lower()
    if lower[:7] in EXACT:
        return EXACT[lower[:7]] + lower[7:]
    r, g, b = (int(lower[n:n+2], 16) / 255 for n in (1, 3, 5))
    hue, sat, val = colorsys.rgb_to_hsv(r, g, b)
    if not (.18 < hue < .57 and sat > .09 and val < .86):
        return token
    new_sat = min(sat, .43) if val < .65 else min(sat, .25)
    nr, ng, nb = colorsys.hsv_to_rgb(.62, new_sat, val)
    return '#' + ''.join(f'{round(c*255):02x}' for c in (nr, ng, nb)) + lower[7:]

def find_rules(text: str):
    """Yield (header, content) with balanced brace pairs, including media blocks."""
    pos = 0
    while True:
        start = text.find('{', pos)
        if start < 0:
            return
        header = text[pos:start].strip()
        depth = 1
        end = start + 1
        while end < len(text) and depth:
            if text[end] == '{':
                depth += 1
            elif text[end] == '}':
                depth -= 1
            end += 1
        if depth:
            return
        if header:
            yield header, text[start+1:end-1]
        pos = end
def render(css: str, scope: str) -> str:
    lines = []
    css = COMMENTS.sub('', css)
    for header, content in find_rules(css):
        if header.startswith(('@keyframes', '@-webkit-keyframes', '@font-face')):
            continue
        if header.startswith(('@media', '@supports', '@container')):
            nested = render(content, scope)
            if nested:
                lines.append(header + '{\n' + nested + '\n}')
            continue
        if header.startswith('@'):
            continue
        changed = []
        for declaration in content.split(';'):
            if ':' not in declaration:
                continue
            name, value = declaration.split(':', 1)
            value = value.strip()
            converted = COLOR.sub(lambda m: convert(m.group()), value)
            if converted != value:
                changed.append(name.strip() + ':' + converted)
        if not changed:
            continue
        selectors = [x.strip() for x in header.split(',') if x.strip()]
        scoped = []
        for sel in selectors:
            if sel in ('html', ':root', 'html:root'):
                scoped.append(scope)
            elif sel.startswith(('html ', ':root ')):
                scoped.append(scope + sel[sel.find(' '):])
            elif sel.startswith('body'):
                scoped.append(scope + ' ' + sel)
            else:
                scoped.append(scope + ' ' + sel)
        if scoped:
            lines.append(',\n'.join(scoped) + '{' + ';'.join(changed) + '}')
    return '\n'.join(lines)

def build() -> tuple[str, list[str]]:
    result = [
        '/* GENERATED. Opt-in midnight colors for classic/experimental Frequency pages.',
        '   Keep source HTML layout intact; regenerate via scripts/build_legacy_appearance.py. */'
    ]
    included = []
    for page in PAGES:
        content = page.read_text()
        match = STYLES.search(content)
        if not match:
            continue
        scope = 'html[data-frequency-appearance="midnight"][data-frequency-page="' + page.name + '"]'
        rendered = render(match.group(1), scope)
        if not rendered:
            continue
        included.append(page.name)
        result.append('/* ' + page.name + ' */\n' + rendered)
    return '\n\n'.join(result) + '\n', included

def install_links(included: list[str]) -> list[str]:
    """Attach opt-in CSS to existing static subpages without changing default UI."""
    changed = []
    for name in included:
        path = ROOT / name
        source = path.read_text()
        if 'frequency-legacy-appearance.css?v=' in source:
            continue
        safe_name = name.replace("'", "")
        snippet = (
            '<script>(function(){try{'
            "const q=new URLSearchParams(location.search).get('view');"
            "const saved=localStorage.getItem('frequency-web-view-v1');"
            "const color=localStorage.getItem('frequency-theme-choice-v2');"
            "if(q==='classic'||(q!=='modern'&&saved==='classic')||color==='midnight')"
            "document.documentElement.dataset.frequencyAppearance='midnight';"
            "document.documentElement.dataset.frequencyPage='" + safe_name + "';"
            "const meta=document.querySelector('meta[name=theme-color]');"
            "if(meta&&document.documentElement.dataset.frequencyAppearance==='midnight')meta.content='#090c12';"
            '}catch(_){}})();</script>' + chr(10) +
            '<link rel="stylesheet" href="frequency-legacy-appearance.css?v=20261111a">' + chr(10)
        )
        result, number = re.subn(r'</head>', lambda m: snippet + m.group(), source, count=1, flags=re.I)
        if number != 1:
            raise RuntimeError('Expected one head closing tag in ' + name)
        path.write_text(result)
        changed.append(name)
    return changed


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--install', action='store_true', help='Attach opt-in theme links to static subpages')
    args = parser.parse_args()
    output, included = build()
    OUTPUT.write_text(output)
    print('Generated:', OUTPUT.name, 'bytes', len(output), 'pages', len(included))
    if args.install:
        touched = install_links(included)
        print('Installed Midnight opt-in on', len(touched), 'static subpages')
    else:
        for name in included:
            print('  ' + name)
