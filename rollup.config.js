import fs from 'fs';
import path from 'path';

import alias from 'rollup-plugin-alias';
import autoprefixer from "autoprefixer";
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import postcss from 'rollup-plugin-postcss'
import postcssPresetEnv from 'postcss-preset-env';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import vue from 'rollup-plugin-vue';
import { terser } from 'rollup-plugin-terser';

const production = process.env.NODE_ENV === 'production' || !process.env.ROLLUP_WATCH;
/**
 * small helper to get package root dir since we can't
 * rely on __dirname within the rollup bundling package
 * (it is fixed to the entrypoint's dir name)
 */
function packageDir() {
  let currentDir = __dirname;
  while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
    currentDir = path.dirname(currentDir);
    if (currentDir === '/') {
      throw new Error('could not find package rootdir');
    }
  }
  return currentDir;
}

export default {
  input: 'src/main.ts',
  output: [
    { file: 'dist/weaverbird.common.js', format: 'cjs' },
    { file: 'dist/weaverbird.esm.js', format: 'esm' },
    { file: 'dist/weaverbird.browser.js', format: 'umd', name: 'vqb' },
  ],
  external: ['vue', 'vuex'],
  plugins: [
    typescript({ module: 'es2015' }),
    resolve({
      // Default extensions ['.mjs', '.js', '.json', '.node']
      // We need to add the '.vue' extension because of the import of the component from v-calendar
      // which contains relative paths without extensions.
      extensions: ['.mjs', '.js', '.ts', '.json', '.node', '.vue']
    }),
    alias({
      resolve: ['.vue', '.json'],
      '@': path.join(packageDir(), '/src'),
    }),
    // date-fns comes from v-calendar
    commonjs({ namedExports: { 'node_modules/mathjs/index.js': ['parse'], 'node_modules/date-fns/index.js': ['addDays'] } }),
    // since we are using a v-calendar component directly we need to use postcss and apply the same config
    postcss({
      plugins: [
        postcssPresetEnv({
          stage: 2,
          features: {
            'nesting-rules': true,
          },
        }),
        autoprefixer()
      ],
      // extract option break CSS live reload in Storybook, comment it to get it back
      extract: true,
      extract: 'weaverbird.css'
    }),
    replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
    vue({ css: false }),
    json(),
    production && terser(),
  ],
};
