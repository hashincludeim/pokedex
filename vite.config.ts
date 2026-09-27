import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths let the same build work on the custom domain and on
  // the fallback github.io/<repo>/ URL. Routing is hash-based, so the page is
  // always served from index.html and relative paths never break.
  base: './',
  plugins: [react()],
});
