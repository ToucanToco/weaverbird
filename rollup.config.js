import commonjs from 'rollup-plugin-commonjs'
import css from 'rollup-plugin-css-only'
import resolve from 'rollup-plugin-node-resolve'
import scss from 'rollup-plugin-scss'
import typescript from 'rollup-plugin-typescript'
import vue from 'rollup-plugin-vue'

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
      css: false,
      style: {
        preprocessOptions: {
          scss: scss()
        }
      }
    }),
    typescript({
      module: 'es2015'
    }),
  ]
}
