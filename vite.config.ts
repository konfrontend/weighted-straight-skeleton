import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: {
      entry: 'src/index.ts',
      name: 'WeightedStraightSkeleton',
      fileName: (fmt: string) => `index.${fmt}.js`,
      formats: ['es', 'umd'],
    },
  },
});