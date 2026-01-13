import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages base path
  base: process.env.GITHUB_PAGES ? '/swgear/' : '/',
  
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
