# 和田三造 Sanzo Wada — A Dictionary of Color Combinations (Volumes 1 & 2)

An interactive, responsive digital viewer and color harmony studio for **Sanzo Wada's** (1883–1967) seminal works:
- ***Haishoku Sōkan* (配色総鑑 / *A Dictionary of Color Combinations Vol. 1*, 1933)**
- ***Haishoku Sōkan B-hen* (配色総鑑 B篇 / *A Dictionary of Color Combinations Vol. 2: Seasonal*, 1934–1935)**

Digitized archive containing:
- **420 Color Combinations** (348 Vol. 1 harmonies + 72 Vol. 2 seasonal plates across the 12 calendar months)
- **171 Master Colors** (159 Vol. 1 swatches + 12 newly introduced in Vol. 2) with English & Japanese names (*Kanji* and *Romaji* where documented).

---

## ✨ Features

- **420 Combinations Across Both Volumes**:
  - **Volume Filter**: Switch between **All Volumes (420)**, **Vol. 1: Harmony (348)**, or **Vol. 2: Seasonal (72)**.
  - **Seasonal & 12-Month Calendar Filtering (Vol. 2)**: Filter by season (🌸 Spring, 🌿 Summer, 🍁 Autumn, ❄️ Winter) or pick any of the 12 Japanese calendar months (*睦月 Mutsuki*, *如月 Kisaragi*, *弥生 Yayoi*, etc.).
  - **Color Count**: Filter by 2-color, 3-color, 4-color, and 5+ color combinations (up to 7 colors on Vol. 2 seasonal plates).
  - **Tone Filter**: *Warm*, *Cool*, *Earthy*, *Pastel*, *Deep*, or *Neutral*.
  - **Sort Options**: By plate number, precomputed contrast ratio, or color frequency.
  - **Progressive Loading & URL Deep-Linking**: Shareable URL parameters for active filters, palettes (`?combo=v1-42`), and swatches (`?color=42`).
- **171 Master Color Swatches & Closest Match (CIEDE2000)**:
  - **Color Match Tool**: Pick or enter any HEX color to rank the perceptually closest Wada swatches by $\Delta E_{00}$ and jump directly to their combinations.
  - **Full Color Space Profiles**: **HEX**, **OKLCH**, **RGB**, **CMYK**, and **CIE-LAB**.
  - **Bidirectional Lookup**: Inspect every combination that uses a swatch, or click any swatch inside a palette to open its color profile and jump back.
- **Deep Inspection Studio (Modal)**:
  - **Showa Art Print**: Japanese editorial poster with vertical kanji spine (*配色総鑑*), Wada Sanzo hanko seal (*三造*), seasonal metadata, and print-ready **SVG** & **2× PNG** poster exports.
  - **Live UI Component Mockup**: Preview the palette applied to a web interface with a live **Color Role Switcher**, shuffle button, and contrast-safe badge colors.
  - **Color Science & WCAG Contrast**: Pairwise accessibility matrix displaying contrast ratios and **WCAG 2.1 AAA / AA** compliance badges.
  - **Developer Export**: One-click copy for **CSS custom properties (`:root` HEX or OKLCH)**, **Tailwind CSS v4 (`@theme`)**, **Tailwind v3 config**, and **JSON**.
  - **Keyboard Navigation**: `Escape` to close modals and `←` / `→` arrows to step through palettes.
- **Delightful Details**:
  - **Surprise Me / Randomizer**: Rolls a random palette with celebratory confetti.
  - **Three Themes**: **Washi Paper** (`#F7F4EC`), **Clean Studio** (`#FAFAFA`), and **Dark Gallery** (`#121214`).
  - **Favorites**: Star favorite combinations saved automatically to `localStorage`.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Run unit tests
npm test

# 4. Typecheck and create production build
npm run build
```

Visit `http://localhost:5173` in your browser.

---

## 🌐 Deploy to GitHub Pages (Automated)

The project includes an automated GitHub Actions deployment workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) and is published at:
[https://mahmagha.github.io/sanzo-wada-colors/](https://mahmagha.github.io/sanzo-wada-colors/)

Every push to `main` triggers a build and automatically updates the live deployment.

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vite.dev/) (relative asset resolution for 100% portability)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Typography**: Google Fonts (*Noto Serif JP*, *Cinzel*, *Plus Jakarta Sans*, *JetBrains Mono*)
- **Icons**: [Lucide React](https://lucide.dev/)
- **FX**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 📜 License

MIT License. Color research originally by Sanzo Wada (1883–1967).
