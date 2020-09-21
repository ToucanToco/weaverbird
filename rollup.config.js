import fs from 'fs';
import path from 'path';

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-only';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
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
    resolve(),
    alias({
      resolve: ['.vue', '.json'],
      '@': path.join(packageDir(), '/src'),
    }),
    commonjs({ namedExports: { 'node_modules/mathjs/index.js': ['parse'] } }),
    css({ output: 'dist/weaverbird.css' }),
    replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
    vue({ css: false }),
    json(),
    production && terser(),
  ],
};
