# 和田三造 Sanzo Wada — A Dictionary of Color Combinations (Volumes 1 & 2)

An interactive, responsive digital viewer and color harmony studio for **Sanzo Wada's** (1883–1967) seminal works:
- ***Haishoku Sōkan* (配色総鑑 / *A Dictionary of Color Combinations Vol. 1*, 1933)**
- ***Haishoku Sōkan B-hen* (配色総鑑 B篇 / *A Dictionary of Color Combinations Vol. 2: Seasonal*, 1934–1935)**

Digitized archive containing:
- **420 Color Combinations** (348 Vol. 1 harmonies + 72 Vol. 2 seasonal plates across the 12 calendar months)
- **171 Master Colors** (159 Vol. 1 swatches + 12 newly introduced in Vol. 2), including verified Japanese kanji & romaji readings (**44 of 171** documented via upstream data + verified overrides).

---

## ✨ Features

- **420 Combinations Across Both Volumes**:
  - **Volume Filter**: Switch between **All Volumes (420)**, **Vol. 1: Harmony (348)**, or **Vol. 2: Seasonal (72)**.
  - **Seasonal & 12-Month Calendar Filtering (Vol. 2)**: Filter by season (🌸 Spring, 🌿 Summer, 🍁 Autumn, ❄️ Winter) or pick any of the 12 Japanese calendar months (*睦月 Mutsuki* – *師走 Shiwasu*).
  - **Multi-Term Search & Swatch Filtering**: Search across multiple terms simultaneously (e.g. `"warm spring"`, `"pink blue"`, `"toki-iro"`, `"v2-14"`), or filter the grid to all combinations containing any chosen swatch (`?swatch=`).
  - **Color Count & Tone Filters**: Filter by 2, 3, 4, or 5+ colors (up to 7 on Vol. 2 plates) and by *Warm*, *Cool*, *Earthy*, *Pastel*, *Deep*, or *Neutral* tones.
  - **Sort, Compare & Share**: Sort by plate number, precomputed contrast ratio, or frequency; pin up to 3 palettes (persisted in `localStorage` & `?compare=`) to compare side by side; and share deep-linked URLs (`?combo=`, `?mix=`, `?color=`, `?swatch=`, `?layout=map`, `?kanji=1`).
- **171 Master Color Swatches, Image Extractor & Custom Composer**:
  - **Closest Color Match & Image Extractor**: Match any HEX color, upload/drop an image with live thumbnail preview, or click 1-click sample artwork presets (*Ukiyo-e Sunset*, *Botanical Moss*, *Nocturne Indigo*) to quantize dominant colors locally (k-means + CIEDE2000 $\Delta E$) and launch in Studio.
  - **Custom Palette Composer (`Mix`)**: Compose 2–6 swatches from the 171 pigments, save named mixes in `localStorage`, inspect in Studio with dedicated Custom Mix branding/exports, and share via `?mix=`.
  - **Grid, 2D Spectrum Map & 360° Color Wheel**: Sort swatches by ID, Hue Spectrum, Lightness, Popularity, or Name, filter to documented Japanese kanji entries (`Kanji (44)`), switch across the collision-repelled **2D Hue × Lightness Spectrum Map** or **360° Polar Wada Color Wheel** (`Show #IDs` & URL `?layout=wheel`), and also pick pigments directly on the wheel inside `Color Match` and `Custom Mix`.
  - **Menswear Garment Color Chooser (`Menswear` / `?view=menswear`)**: Dress interactive **Tailored Suit**, **Casual Coat & Knit**, and traditional **Haori & Kimono (*Wafuku*)** silhouettes across 5 garment pieces (`Jacket/Haori`, `Shirt/Kimono`, `Trousers/Hakama`, `Tie/Scarf/Obi`, `Shoes & Belt`) using all 171 Wada pigments on the 360° Color Wheel, apply any of the 420 historical combinations in 1 click, check contrast & closest 1933 Wada plate harmony, save custom looks, and export CSS or share URLs.
  - **Full Color Space Profiles**: **HEX**, **OKLCH**, **RGB**, **CMYK**, and **CIE-LAB** with bidirectional swatch ↔ palette navigation.
- **Deep Inspection Studio (Modal)**:
  - **Color Vision Deficiency (CVD) Simulator**: Preview swatches, UI mockups, and contrast under *Protanopia*, *Deuteranopia*, *Tritanopia*, and *Achromatopsia*.
  - **Showa Art Print**: Japanese editorial poster with vertical kanji spine (*配色総鑑*), Wada Sanzo hanko seal (*三造*), Equal vs. proportional balance (**70/30**, **60/30/10**, or tiered ratios), one-click **↑ Dominant** promotion, and matching **SVG** & **2× PNG** exports.
  - **Multi-Template UI Mockup**: Switch across **Landing Hero**, **Analytics Dashboard**, **Editorial Article**, and **Mobile App Card** templates; assign **Background**, **Surface**, **Accent**, and **Text / Ink** roles with live WCAG AA/AAA badges and semantic Role CSS export.
  - **Color Science & Developer/Design Exports**: Pairwise WCAG 2.1 matrix plus exports for **CSS (`:root` HEX / OKLCH)**, **Tailwind v4 (`@theme`)**, **Tailwind v3**, **W3C / Figma Tokens**, **SVG Palette**, **GIMP/Procreate `.gpl`**, **Adobe Swatch `.ase`**, and **JSON**.
- **Accessible, Fast & Offline-Ready PWA**:
  - **Zero-Jump Layout & Keyboard UX**: Stable filter toolbars, modal focus trapping, scroll locking, `/` search focus, `?` guide & favorites JSON backup dialog, `Escape` to close, and `←` / `→` palette stepping.
  - **Code-Split & Build-Time Precached PWA**: Lazy-loaded dialogs and a build-generated service worker precache manifest (`dist/sw.js`) for full offline support.
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

# 4. Typecheck and build production bundle (with SW precache manifest & self-hosted fonts)
npm run build

# 5. Run headless Chrome/Edge CDP E2E & ARIA checks against dist/
npm run test:e2e
```

Visit `http://localhost:5173` in your browser.

---

## 🌐 Deploy to GitHub Pages (Automated)

The project includes an automated GitHub Actions deployment workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) and is published at:
[https://mahmagha.github.io/sanzo-wada-colors/](https://mahmagha.github.io/sanzo-wada-colors/)

Every push to `main` runs unit tests, builds `dist/`, runs headless Chrome CDP E2E checks, and updates the live deployment.

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vite.dev/) (relative asset resolution, lazy chunk splitting, & SW manifest injection)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Typography**: Self-hosted Latin variable `.woff2` fonts (*Cinzel*, *Plus Jakarta Sans*, *JetBrains Mono*) precached offline + Google Fonts *Noto Serif JP* with local Mincho fallback
- **Icons**: [Lucide React](https://lucide.dev/)
- **FX**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) (dynamically imported)

---

## 📜 License

MIT License. Color research originally by Sanzo Wada (1883–1967).
