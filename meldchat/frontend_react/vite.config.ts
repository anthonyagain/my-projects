import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
        // DOESN'T WORK, WTF.
      '@': path.resolve(__dirname, './src'),
      // other aliases as needed
    },
  },

  esbuild: {
    // Configure esbuild to treat .js files as .jsx
    loader: 'tsx',
  },
  build: {
    minify: false,
  }
});
