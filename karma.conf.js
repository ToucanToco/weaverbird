process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
  config.set({
    frameworks: ['mocha'],
    files: ["tests/unit/karma-test-bundle.js"],
    preprocessors: {
      'tests/unit/*.spec.ts': ['rollup', 'sourcemap']
    },
    rollupPreprocessor: require('./tests/rollup.config.test'),
    plugins: [
      // Launchers
      'karma-chrome-launcher',

      // Test Libraries
      'karma-mocha',

      // Preprocessors
      'karma-rollup-preprocessor',
      'karma-sourcemap-loader',

      // Reporters
      'karma-spec-reporter'
    ],
    reporters: ['spec'],
    browsers: ['ChromeHeadless']
  })
}
