import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    // emit .d.ts into dist/
    dts({
      entryRoot: 'src',
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'WeightedStraightSkeleton',
      fileName: (format) => `index.${format}.js`,
      formats: ['es'],
    },
  },
})