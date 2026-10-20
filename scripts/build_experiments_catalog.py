#!/usr/bin/env python3
"""Index ALREADY-PUBLIC, Git-tracked audio missing from the main listening catalog.
Never uploads audio, includes untracked local drafts, or changes the main catalog.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / 'audio'
OUTPUT = ROOT / 'experiments-catalog.json'

def title(stem):
    tokens = {'c1': 'C1', 'c2': 'C2', 'c3': 'C3', 'v1': 'V1', 'v2': 'V2', 'v3': 'V3',
              'ab': 'A/B', 'ace': 'ACE', 'hifi': 'Hi-Fi', 'phi': 'Phi', 'gamma': 'Gamma',
              '528': '528', 'hz': 'Hz', 'ai': 'AI'}
    return ' '.join(tokens.get(x, x.capitalize()) for x in stem.split('-'))

def make():
    catalog=json.loads((ROOT/'listening-catalog.json').read_text())
    main={record['audio'] for record in catalog['tracks']}
    main_titles={record['id']:record['title'] for record in catalog['tracks']}
    tracked=subprocess.run(['git','ls-files','--','audio'], cwd=ROOT,
                           text=True,capture_output=True,check=True).stdout.splitlines()
    assets=[]
    for rel in tracked:
        if not re.fullmatch(r'audio/[a-zA-Z0-9][a-zA-Z0-9_-]{0,100}\.(m4a|mp3)',rel):
            continue
        p=ROOT/rel
        if not p.is_file() or rel in main:
            continue
        stem=p.stem
        base=next((x for x in sorted(main_titles,key=len,reverse=True)
                   if stem.startswith(x+'-')),None)
        if not base:
            base=re.sub(r'-(?:c[1-9]|v[0-9a-z]+|hook|dry|stereo-(?:drift|pulse)|theta-orbit|phi-orbit|gamma-pulse)$','',stem)
        assets.append({'id':stem,'title':title(stem), 'group':base,
                       'groupTitle':main_titles.get(base,title(base)),
                       'audio':rel,'sizeBytes':p.stat().st_size,
                       'kind':'Existing public test / alternate'})
    # Already-listed public A/B tests should appear in the lab too.
    for record in catalog['tracks']:
        if record.get('source')=='Creator-approved public test':
            assets.append({'id':record['id'],'title':record['title'],
                           'group':record['id'].rsplit('-',1)[0],
                           'groupTitle':record['title'].rsplit(' — ',1)[0],
                           'audio':record['audio'],'sizeBytes':(ROOT/record['audio']).stat().st_size,
                           'kind':'Curated listening test'})
    ids=[r['id'] for r in assets]
    if len(ids)!=len(set(ids)):raise ValueError('Duplicate experiment IDs')
    assets.sort(key=lambda x:(x['groupTitle'].casefold(),x['title'].casefold()))
    result={'version':1,'notice':'These are public test versions, not mastered releases. Notes stay in this browser.',
            'count':len(assets),'tracks':assets}
    OUTPUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print('Experiments catalog:',len(assets),'tracks,',len(assets)-len(
          [t for t in assets if t['kind']=='Curated listening test']),'existing public unlisted files')
    return result

if __name__=='__main__':make()
