import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  root: 'demo',                          // serves demo/index.html
  publicDir: false,                      // optional, disable /public
  plugins: [
    vue(),
  ],
  resolve: {
    // During development the playground imports from source:
    //   import { … } from 'weighted-straight-skeleton'
    alias: {
      'weighted-straight-skeleton': '/src',
      '@': '/src',
    },
  },
  build: {
    outDir: '../dist/demo', // put the demo next to the library
    emptyOutDir: false, // keep the lib bundle
  },
});