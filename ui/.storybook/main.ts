const { resolve } = require('path');
const { mergeConfig } = require('vite');

// We can't use ES imports until storybook 7.
// In the meantime, just keep here a copy of part of the vite config (instead of an import)
const originalViteConfigResolve = {
  extensions: ['.mjs', '.js', '.ts', '.json', '.node', '.vue'],
  alias: [
    {
      find: '@',
      replacement: resolve(__dirname, '../src'),
    },
  ],
};

module.exports = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  features: {
    storyStoreV7: true,
  },
  // framework: {
  //   name: '@storybook/vue-vite',
  //   options: {},
  // },
  core: {
    builder: '@storybook/builder-vite',
    disableTelemetry: true,
  },
  async viteFinal(config) {
    // Merge custom configuration into the default config
    return mergeConfig(config, {
      resolve: originalViteConfigResolve,
    });
  },
};
