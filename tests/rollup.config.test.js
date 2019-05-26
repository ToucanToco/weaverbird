/* eslint-disable @typescript-eslint/no-var-requires */
const alias = require('rollup-plugin-alias');
const commonjs = require('rollup-plugin-commonjs');
const css = require('rollup-plugin-css-only');
const resolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript');
const vue = require('rollup-plugin-vue');
const json = require('rollup-plugin-json');
const replace = require('rollup-plugin-replace');

module.exports = {
  input: 'tests/unit/karma-test-suite.ts',
  output: {
    file: 'tests/unit/karma-test-suite.js',
    format: "iife",
    name: "vqbtests",
    sourcemap: "inline",
  },
  plugins:
    [
      json(),
      resolve(),
      typescript({ module: 'es2015' }),
      alias({
        resolve: ['.vue', '.json'],
        '@': __dirname + '/../src',
      }),
      commonjs({
        namedExports: {
          'node_modules/mathjs/index.js': ['parse'],
          'node_modules/@vue/test-utils/dist/vue-test-utils.js': ['createLocalVue', 'mount', 'shallowMount'],
          'node_modules/chai/index.js': ['expect'],
        }
      }),
      css({ output: 'dist/vue-query-builder.css' }),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production")
      }),
      vue({
        css: false,
        compileTemplate: true,
        template: {
          isProduction: true
        }
      }),
    ]
};
