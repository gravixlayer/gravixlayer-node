import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
  },
  // CLI build
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: false,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);