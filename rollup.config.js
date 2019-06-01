import alias from 'rollup-plugin-alias';
import commonjs from 'rollup-plugin-commonjs';
import css from 'rollup-plugin-css-only';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import vue from 'rollup-plugin-vue';

export default {
  input: 'src/main.ts',
  output: [{
    file: 'dist/vue-query-builder.common.js',
    format: 'cjs',
  },
  {
    file: 'dist/vue-query-builder.esm.js',
    format: 'esm',
  },
  {
    file: 'dist/vue-query-builder.browser.js',
    format: 'umd',
    name: 'vqb',
  }
  ],
  external: ['vue', 'vuex'],
  plugins: [
    resolve(),
    typescript({
      module: 'es2015'
    }),
    alias({
      resolve: ['.vue', '.json'],
      '@': __dirname + '/src',
    }),
    commonjs({
      namedExports: {
        'node_modules/mathjs/index.js': ['parse']
      }
    }),
    css({
      output: 'dist/vue-query-builder.css',
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    vue({
      css: false,
    }),
    json()
  ]
}
