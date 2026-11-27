# Contributing

## Setup

```bash
npm install
npm run dev        # local dev server
npm test           # typecheck and unit tests
npm run build      # typecheck and production build
npm run test:e2e   # headless Chrome checks against dist/ (needs Chrome or Edge)
npm run audit-data # data consistency check and Japanese name coverage
```

## Guidelines

- Keep changes small and add a unit test for new color or data logic (`tests/`).
- Do not invent Japanese color names. Add one only with a citable source (see [SOURCES.md](SOURCES.md)).
- New Japanese text needs the font subset rebuilt: `python3 scripts/subset-jp-font.py <font.ttf>` (see the README).
- Add a line to `CHANGELOG.md` under `Unreleased`.
