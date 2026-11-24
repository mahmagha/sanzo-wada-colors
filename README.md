# 和田三造 Sanzo Wada — A Dictionary of Color Combinations (Volumes 1 & 2)

An interactive, responsive digital viewer and color harmony studio for **Sanzo Wada's** (1883–1967) seminal works:
- ***Haishoku Sōkan* (配色総鑑 / *A Dictionary of Color Combinations Vol. 1*, 1933)**
- ***Haishoku Sōkan B-hen* (配色総鑑 B篇 / *A Dictionary of Color Combinations Vol. 2: Seasonal*, 1934–1935)**

Digitized archive containing:
- **420 Color Combinations** (348 Vol. 1 harmonies + 72 Vol. 2 seasonal plates across the 12 calendar months)
- **171 Master Colors** (159 Vol. 1 swatches + 12 newly introduced in Vol. 2) with English & Japanese names (*Kanji* and *Romaji*).

---

## ✨ Features

- **420 Combinations Across Both Volumes**:
  - **Volume Filter**: Switch between **All Volumes (420)**, **Vol. 1: Harmony (348)**, or **Vol. 2: Seasonal (72)**.
  - **Seasonal / Month Filtering (Vol. 2)**: Filter by season (🌸 Spring, 🌿 Summer, 🍁 Autumn, ❄️ Winter) or explore all 12 Japanese calendar months (*睦月 Mutsuki*, *如月 Kisaragi*, *弥生 Yayoi*, etc.).
  - **Color Count**: Filter by 2-color, 3-color, 4-color, and 5+ color combinations (up to 7 colors on Vol. 2 seasonal plates).
  - **Tone Filter**: *Warm*, *Cool*, *Earthy*, *Pastel*, or *Deep*.
  - **Sort Options**: By plate number, contrast ratio, or color frequency.
- **171 Master Color Swatches**:
  - Full color space profiles: **HEX**, **RGB**, **CMYK** (for print reproduction), and **CIE-LAB** (perceptual color space).
  - Japanese names (Kanji and reading) alongside Ridgway/Wada English nomenclature.
  - Reverse lookup: Inspect every combination in Vol. 1 and Vol. 2 that uses a specific swatch.
- **Deep Inspection Studio (Modal)**:
  - **Showa Art Print**: Authentic Japanese editorial poster with vertical kanji (*配色総鑑*), Wada Sanzo hanko seal (*三造*), seasonal metadata, and print-ready **SVG Card Export**.
  - **Live UI Component Mockup**: See the palette applied to a real interactive web interface (Hero, Navbar, Action Buttons, KPI metric cards, Badges) with a live **Color Role Switcher** to reassign or shuffle background, surface, and CTA accent colors.
  - **Color Science & WCAG Contrast**: Full pairwise accessibility matrix displaying contrast ratios and **WCAG 2.1 AAA / AA** compliance badges.
  - **Developer Export**: One-click copy for **CSS custom properties (`:root`)**, **Tailwind CSS config**, and **JSON**.
- **Delightful Details**:
  - **Surprise Me / Randomizer**: Rolls a random palette with celebratory confetti.
  - **Three Themes**: **Washi Paper** (textured cream background `#F7F4EC`), **Clean Studio** (gallery white), and **Dark Gallery** (obsidian `#121214`).
  - **Favorites**: Star favorite combinations saved automatically to `localStorage`.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
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
