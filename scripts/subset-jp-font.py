#!/usr/bin/env python3
"""Rebuild src/assets/fonts/noto-serif-jp-subset.woff2.

Run this after adding new Japanese text (for example more color names) so the
new characters are included. Needs: pip install fonttools brotli

Usage:
  python3 scripts/subset-jp-font.py /path/to/NotoSerifJP[wght].ttf

Get the source font from https://github.com/google/fonts/tree/main/ofl/notoserifjp
(SIL Open Font License 1.1).
"""
import glob
import subprocess
import sys
import tempfile

if len(sys.argv) != 2:
    sys.exit(__doc__)

chars = set()
for f in glob.glob('src/**/*.ts*', recursive=True) + glob.glob('src/data/*.json'):
    with open(f, encoding='utf8') as fh:
        for ch in fh.read():
            if ord(ch) > 0x2E80 or ch in '•—–’“”№→←↑·×':
                chars.add(ch)
chars.update(chr(o) for o in range(0x3040, 0x30FF))  # hiragana + katakana

with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf8') as tmp:
    tmp.write(''.join(sorted(chars)))

subprocess.check_call([
    'pyftsubset', sys.argv[1], f'--text-file={tmp.name}', '--unicodes=U+0020-007E',
    '--flavor=woff2', "--layout-features=*",
    '--output-file=src/assets/fonts/noto-serif-jp-subset.woff2',
])
print(f'Subset {len(chars)} characters.')
