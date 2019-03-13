import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript'
import vue from 'rollup-plugin-vue'
import css from 'rollup-plugin-css-only'

export default {
  input: 'src/main.ts',
  output: [
    {
      file: 'dist/vue-query-builder.common.js',
      format: 'cjs'
    },
    {
      file: 'dist/vue-query-builder.esm.js',
      format: 'esm'
    }
  ],
  external: [
    'vue'
  ],
  plugins: [
    resolve(),
    commonjs(),
    css({
      output: 'dist/vue-query-builder.css'
    }),
    vue({
      css: false
    }),
    typescript({
      module: 'es2015'
    }),
  ]
}
