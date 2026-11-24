# 和田三造 Sanzo Wada — A Dictionary of Color Combinations (1933)

An interactive, responsive digital viewer and color harmony studio for **Sanzo Wada's** (1883–1967) seminal 1930s work, ***Haishoku Sōkan* (配色総鑑 / *A Dictionary of Color Combinations*)**.

Digitized from the canonical archive of **159 master colors** and **348 harmony palettes** (2-color, 3-color, and 4-color combinations).

---

## ✨ Features

- **348 Color Combinations**:
  - Filter by palette size: **2-Color (160)**, **3-Color (114)**, or **4-Color (74)** combinations.
  - Filter by tone: *Warm*, *Cool*, *Earthy*, *Pastel*, or *Deep*.
  - Sort by original plate number (#1 to #348), contrast ratio, or color frequency.
- **159 Master Color Swatches**:
  - Browse all 159 original swatches with full color values: **HEX**, **RGB**, **CMYK** (for print), and **CIE-LAB** (perceptual color space).
  - Inspect which combinations each color belongs to.
- **Deep Inspection Studio (Modal)**:
  - **Showa Art Print**: Authentic 1930s Japanese editorial poster with vertical kanji typography (*配色総鑑*), Wada Sanzo seal (*三造*), and SVG card export.
  - **Live UI Component Mockup**: See the palette applied to a real interactive web interface (Hero, Navbar, Stat cards, Badges) with a live **Color Role Switcher** (shuffle or re-assign background, surface, and CTA accent colors).
  - **Color Science & WCAG Contrast**: Full pairwise accessibility matrix with **AAA**, **AA**, and **Large Text** readability badges.
  - **Developer Export**: One-click copy for **CSS custom properties (`:root`)**, **Tailwind CSS config**, and **JSON**.
- **Delightful Details**:
  - **Surprise Me / Randomizer**: Rolls a random palette with celebratory confetti.
  - **Theme Switcher**: Switch between **Washi Paper** (textured cream background), **Clean Studio** (gallery white), and **Dark Gallery** (obsidian museum mode).
  - **Favorites**: Star favorite combinations saved automatically to `localStorage`.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Visit the local URL shown in your terminal (usually `http://localhost:5173`).

---

## 🌐 Deploy to GitHub Pages (Automated & Painless)

This project is configured with `base: './'` in `vite.config.ts` and includes a ready-to-use GitHub Actions workflow.

### Option 1: Automated Deployment via GitHub Actions (Recommended)

1. Create a repository on GitHub (e.g. `colors` or `sanzo-wada-colors`).
2. Push your project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial Sanzo Wada interactive color dictionary"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. GitHub Actions will automatically run the included [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) workflow and publish your site at:
   `https://<your-username>.github.io/<your-repo-name>/`

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vite.dev/) (relative asset resolution for 100% portability)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Typography**: Google Fonts (*Noto Serif JP*, *Cinzel*, *Plus Jakarta Sans*, *JetBrains Mono*)
- **Icons**: [Lucide React](https://lucide.dev/)
- **FX**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Dataset**: Sourced and verified from Wada Sanzō's *A Dictionary of Color Combinations* (Japan Standard Color Association, 1933).

---

## 📜 License

MIT License. Color combinations and research originally by Sanzo Wada (1883–1967).
