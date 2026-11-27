# Data sources and accuracy

## Where the data comes from

`scripts/build-all-data.mjs` builds `src/data/*.json` from two public datasets:

- [mattdesl/dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations) (MIT license). 348 combinations and 159 colors from Volume 1. That project says its data was first compiled by Dain M. Blodorn Kim ([dblodorn/sanzo-wada](https://github.com/dblodorn/sanzo-wada/)) and that colors were converted from CMYK to RGB.
- [adrian729/wada-sanzo-colors](https://github.com/adrian729/wada-sanzo-colors). The 72 seasonal combinations of Volume 2, 12 extra colors, and Japanese names for part of the colors. Its GitHub license field reads "no assertion" (checked November 2026), so the license is unclear. See the open questions below.

The books themselves are *Haishoku Sōkan* (配色総鑑) Volume 1 (1933) and *B-hen* (1934 to 1935) by Sanzo Wada (1883 to 1967).

## What is and is not verified

| Item | Status |
| --- | --- |
| Internal consistency (hex matches RGB, every combination points to a real color, no duplicate ids) | Checked automatically by `npm run audit-data`. |
| Japanese names | 44 of 171 colors have one. The other 127 are listed in `docs/color-names-todo.csv`. They are not filled in because no verified source has been checked for them. |
| Hex values vs the printed plates | **Not verified.** Hexes were derived from the printed CMYK values, and printed colors vary with paper, ink and age. Treat them as close approximations. |
| Copyright and license | **Not verified.** See below. |

## Open questions for the maintainer

1. **License of the adrian729 data.** The repository has no clear license. Ask the author, or replace that data, before relying on it for anything beyond personal use.
2. **Copyright of the underlying work.** Wada died in 1967. Whether his plates and the compiled books are in the public domain depends on the country and on the publisher's rights (Seigensha published the modern edition). Get legal advice if this site becomes more than a personal project.
3. **Japanese names.** Fill `docs/color-names-todo.csv` only from a source you can cite (the book, or a published color-name reference), put the source in the `verified_source` column, then copy the values into `src/data/wadaColors.json`.

## Re-running the audit

```bash
npm run audit-data                                   # checks and coverage
node scripts/audit-data.mjs --csv docs/color-names-todo.csv   # refresh the to-do list
```
