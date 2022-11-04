import autoprefixer from "autoprefixer";
import postcss from 'rollup-plugin-postcss'
import postcssPresetEnv from 'postcss-preset-env';
import mainConfig from '../rollup.config'

const { plugins, ...partialMainConfig } = mainConfig

const storyBookPlugins = [
  ...plugins.filter((plugin) => plugin.name !== 'postcss'), // Avoid extra config in mainConfig
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
  }),
];

export default {
  ...partialMainConfig,
  input: '.storybook/bundle.ts',
  output: [{
    file: 'dist/storybook/components.js',
    format: 'esm'
  }],
  plugins: storyBookPlugins
}
