import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    // emit .d.ts into dist/
    dts({
      entryRoot: 'src',
      tsconfigPath: './tsconfig.json'
    })
  ],
  build: {
    outDir: 'dist',
    minify: false,
    lib: {
      entry: 'src/index.ts',
      name: 'WeightedStraightSkeleton',
      fileName: (format) => `index.${format}.js`,
      formats: ['es']
    },
    rollupOptions: {
      // mark peerDependencies & built-ins as externals
      external: [], // "react"
      output: {
        // global variable names in UMD build
        globals: {
        }
      }
    }
  }
});