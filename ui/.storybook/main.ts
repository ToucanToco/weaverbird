const { mergeConfig } = require('vite');

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
      // Use the same "resolve" configuration as your app
      // @ts-ignore
      resolve: (await require('../vite.config.ts')).resolve,
    });
  },
};
