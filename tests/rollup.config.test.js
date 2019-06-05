/* eslint-disable @typescript-eslint/no-var-requires */
const alias = require('rollup-plugin-alias');
const commonjs = require('rollup-plugin-commonjs');
const css = require('rollup-plugin-css-only');
const resolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript');
const vue = require('rollup-plugin-vue');
const json = require('rollup-plugin-json');
const replace = require('rollup-plugin-replace');
const istanbul = require('rollup-plugin-istanbul');

const baseConfig = {
  input: 'tests/unit/karma-test-suite.ts',
  output: {
    file: 'tests/unit/karma-test-suite.js',
    format: 'iife',
    name: 'vqbtests',
    sourcemap: 'inline',
  },
  plugins: [
    json(),
    resolve(),
    typescript({ module: 'es2015' }),
    alias({
      resolve: ['.vue', '.json'],
      '@': __dirname + '/../src',
    }),
    commonjs({
      namedExports: {
        mathjs: ['parse'],
        '@vue/test-utils': ['createLocalVue', 'mount', 'shallowMount'],
        chai: ['expect'],
      },
    }),
    // css({ output: 'dist/vue-query-builder.css' }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    vue({
      compileTemplate: true,
      template: {
        isProduction: true,
      },
    }),
    istanbul({
      exclude: ['test/**/*.ts', 'node_modules/**/*'],
    }),
  ],
};

baseConfig.onwarn = warning => {
  if (warning.code === 'THIS_IS_UNDEFINED') {
    // This error happens frequently due to TypeScript emitting `this` at the
    // top-level of a module. In this case its fine if it gets rewritten to
    // undefined, so ignore this error.
    return;
  } else if (
    warning.code === 'CIRCULAR_DEPENDENCY' &&
    warning.message.indexOf('node_modules/chai/lib/chai.js') !== -1
  ) {
    // ignore chai circular dependency error
    return;
  }

  console.error(`(!) ${warning.message}`);
};

module.exports = baseConfig;
