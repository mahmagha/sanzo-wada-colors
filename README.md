# 和田三造 Sanzo Wada — A Dictionary of Color Combinations (Volumes 1 & 2)

An interactive, responsive digital viewer and color harmony studio for **Sanzo Wada's** (1883–1967) seminal works:
- ***Haishoku Sōkan* (配色総鑑 / *A Dictionary of Color Combinations Vol. 1*, 1933)**
- ***Haishoku Sōkan B-hen* (配色総鑑 B篇 / *A Dictionary of Color Combinations Vol. 2: Seasonal*, 1934–1935)**

Digitized archive containing:
- **420 Color Combinations** (348 Vol. 1 harmonies + 72 Vol. 2 seasonal plates across the 12 calendar months)
- **171 Master Colors** (159 Vol. 1 swatches + 12 newly introduced in Vol. 2), including documented Japanese kanji & romaji readings (currently **36 of 171** from the upstream dataset).

---

## ✨ Features

- **420 Combinations Across Both Volumes**:
  - **Volume Filter**: Switch between **All Volumes (420)**, **Vol. 1: Harmony (348)**, or **Vol. 2: Seasonal (72)**.
  - **Seasonal & 12-Month Calendar Filtering (Vol. 2)**: Filter by season (🌸 Spring, 🌿 Summer, 🍁 Autumn, ❄️ Winter) or pick any of the 12 Japanese calendar months (*睦月 Mutsuki* – *師走 Shiwasu*).
  - **Multi-Term Search & Swatch Filtering**: Search across multiple terms simultaneously (e.g. `"warm spring"`, `"pink blue"`, `"toki-iro"`, `"v2-14"`), or filter the grid to all combinations containing any chosen swatch (`?swatch=`).
  - **Color Count & Tone Filters**: Filter by 2, 3, 4, or 5+ colors (up to 7 on Vol. 2 plates) and by *Warm*, *Cool*, *Earthy*, *Pastel*, *Deep*, or *Neutral* tones.
  - **Sort, Compare & Share**: Sort by plate number, precomputed contrast ratio, or frequency; pin up to 3 palettes to compare side by side; and share deep-linked URLs (`?combo=`, `?color=`, `?swatch=`).
- **171 Master Color Swatches & Closest Match (CIEDE2000)**:
  - **Color Match Tool**: Pick or enter any HEX color to rank the perceptually nearest Wada swatches by $\Delta E_{00}$ and jump directly to their combinations.
  - **Sort & Kanji Filter**: Sort swatches by ID, Hue Spectrum, Lightness, Popularity, or Name, and filter to documented Japanese kanji entries.
  - **Full Color Space Profiles**: **HEX**, **OKLCH**, **RGB**, **CMYK**, and **CIE-LAB** with bidirectional swatch ↔ palette navigation.
- **Deep Inspection Studio (Modal)**:
  - **Color Vision Deficiency (CVD) Simulator**: Preview swatches, UI mockups, and contrast under *Protanopia*, *Deuteranopia*, *Tritanopia*, and *Achromatopsia*.
  - **Showa Art Print**: Japanese editorial poster with vertical kanji spine (*配色総鑑*), Wada Sanzo hanko seal (*三造*), Equal vs. 60/30/10 proportions toggle, and print-ready **SVG** & **2× PNG** exports.
  - **Interactive UI Component Mockup**: Assign **Background**, **Surface**, **Accent**, and **Text / Ink** roles with live WCAG AA/AAA contrast badges and semantic role CSS export.
  - **Color Science & Developer/Design Exports**: Pairwise WCAG 2.1 matrix plus exports for **CSS (`:root` HEX / OKLCH)**, **Tailwind v4 (`@theme`)**, **Tailwind v3**, **W3C / Figma Tokens**, **SVG Palette**, **GIMP/Procreate `.gpl`**, **Adobe Swatch `.ase`**, and **JSON**.
- **Accessible, Fast & Offline-Ready**:
  - **Zero-Jump Layout & Keyboard UX**: Stable filter toolbars, modal focus trapping, scroll locking, `Escape` to close, and `←` / `→` palette stepping.
  - **Code-Split & PWA Support**: Lazy-loaded studio dialogs and service worker caching (`public/sw.js` + `manifest.webmanifest`) for offline use.
  - **Three Themes**: **Washi Paper** (`#F7F4EC`), **Clean Studio** (`#FAFAFA`), and **Dark Gallery** (`#121214`), respecting OS preference on first visit.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Typecheck and run unit tests
npm test

# 4. Typecheck and build production bundle
npm run build
```

Visit `http://localhost:5173` in your browser.

---

## 🌐 Deploy to GitHub Pages (Automated)

The project includes an automated GitHub Actions deployment workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) and is published at:
[https://mahmagha.github.io/sanzo-wada-colors/](https://mahmagha.github.io/sanzo-wada-colors/)

Every push to `main` runs tests, builds `dist/`, and updates the live deployment.

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vite.dev/) (relative asset resolution & lazy chunk splitting)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Typography**: Google Fonts (*Noto Serif JP*, *Cinzel*, *Plus Jakarta Sans*, *JetBrains Mono*)
- **Icons**: [Lucide React](https://lucide.dev/)
- **FX**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) (dynamically imported)

---

## 📜 License

MIT License. Color research originally by Sanzo Wada (1883–1967).
