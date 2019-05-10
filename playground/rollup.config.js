import globals from 'rollup-plugin-node-globals';
import css from 'rollup-plugin-css-only';

import mainConfig from '../rollup.config';

export default {
  ...mainConfig,
  input: 'playground/main.ts',
  output: [
    {
      file: 'playground/dist/app.js',
      format: 'iife',
      globals: {
        vue: 'Vue',
      },
    },
  ],
  // NOTE: make sure css() is included before mainConfig's plugins which also
  // include a call to `css()`: we want ours to take precedence over the main
  // one.
  plugins: [css({ output: 'playground/dist/playground.css' }), ...mainConfig.plugins, globals()],
};
