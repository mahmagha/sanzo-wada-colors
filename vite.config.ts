import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Crucial for GitHub Pages: relative asset paths so it works at any subpath e.g. username.github.io/colors/
  base: './',
});
