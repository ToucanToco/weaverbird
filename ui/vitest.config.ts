import { resolve } from 'path';
import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: [resolve(__dirname, './vitest.setup.ts')],
      coverage: {
        reporter: ['lcov'],
      },
    },
  }),
);
