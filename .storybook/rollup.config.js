import mainConfig from '../rollup.config'

export default {
  ...mainConfig,
  input: '.storybook/bundle.ts',
  output: [{
    file: 'dist/storybook/components.js',
    format: 'esm'
  }],
}
