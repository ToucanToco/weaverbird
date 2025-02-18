import vue from '@vitejs/plugin-vue2';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Default extensions ['.mjs', '.js', '.json', '.node']
    // We need to add the '.vue' extension because of the import of the component from v-calendar
    // which contains relative paths without extensions.
    extensions: ['.mjs', '.js', '.ts', '.json', '.node', '.vue'],
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  define: { 'process.env.NODE_ENV': '"' + process.env.NODE_ENV + '"' },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'vqb',
      // the proper extensions will be added
      fileName: 'weaverbird',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
