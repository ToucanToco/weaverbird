import fs from 'fs';
import path from 'path';

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-only';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
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

export default [{
  input: 'src/main.ts',
  output: [
    { file: 'dist/weaverbird.common.js', format: 'cjs' },
    { file: 'dist/weaverbird.esm.js', format: 'esm', sourcemap: true },
    { file: 'dist/weaverbird.browser.js', format: 'umd', name: 'vqb', sourcemap: true },
  ],
  external: ['vue', 'vuex'],
  plugins: [
    alias({
      entries: [
        { find: '@', replacement: path.join(packageDir(), '/src') }
      ]
    }),
    resolve(),
    json(),
    commonjs({ namedExports: { 'node_modules/mathjs/index.js': ['parse'] } }),
    css({ output: 'dist/weaverbird.css' }),
    vue({ css: false }),
    // FIXME upgrading to rollup-plugin-typescript2: many errors appeared! I disabled the check for now, to be able to build the lib
    typescript({ module: 'es2015', abortOnError: true, check: false, useTsconfigDeclarationDir: true }),
    replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
    production && terser(),
  ],
}];
