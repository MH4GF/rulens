import { defineConfig } from 'tsup'

// biome-ignore lint/style/noDefaultExport: tsup expects default export
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  bundle: true,
  minify: false,
  treeshake: true,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  outDir: 'dist',
})
