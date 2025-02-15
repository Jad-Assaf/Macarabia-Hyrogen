// vite.config.js
import { defineConfig } from 'vite';
import { hydrogen } from '@shopify/hydrogen/vite';
import { oxygen } from '@shopify/mini-oxygen/vite';
import { vitePlugin as remix } from '@remix-run/dev';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss({
      theme: {
        fontFamily: {
          sans: [
            'Montserrat',
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'Helvetica Neue',
            'Arial',
            'Noto Sans',
            'sans-serif',
          ],
        },
      },
    }),
    hydrogen(),
    oxygen(),
    remix({
      presets: [hydrogen.preset()],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
    },
  },
  build: {
    assetsInlineLimit: 0,
    // Remove crypto from here:
    // rollupOptions: { external: ['crypto'] },
  },
  ssr: {
    external: ['crypto'],  // This tells Vite to treat Node's "crypto" as external during SSR
    noExternal: [], // Ensure crypto is not listed here
    optimizeDeps: {
      include: [
        'react-lazy-load-image-component',
        'prop-types',
        'matchmediaquery',
      ],
    },
  },
});
