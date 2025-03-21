import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./index.ts', './tool.ts', './toolkit.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Disable dts due to cross-package reference issues
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js'
    };
  }
});