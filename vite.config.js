import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages base path - change 'SEABuilder' to your repo name
  base: process.env.GITHUB_PAGES ? '/SEABuilder/' : '/',
  
  // Enable JSON imports
  json: {
    stringify: false
  },
  // Build options
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  // Dev server options
  server: {
    port: 3000,
    open: true
  }
});
