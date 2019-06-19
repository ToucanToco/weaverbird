process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: [
      {
        pattern: 'tests/unit/karma-test-suite.ts',
        type: 'js',
      },
    ],
    customContextFile: './tests/context.html',
    preprocessors: {
      'tests/unit/karma-test-suite.ts': ['rollup', 'sourcemap'],
    },
    rollupPreprocessor: require('./tests/rollup.config.test'),
    plugins: [
      // Launchers
      'karma-chrome-launcher',

      // Test Libraries
      'karma-mocha',
      'karma-chai',

      // Preprocessors
      'karma-rollup-preprocessor',
      'karma-sourcemap-loader',

      // Reporters
      'karma-spec-reporter',
      'karma-coverage-istanbul-reporter',
    ],
    // required for typescript files to be loaded in karma, otherwise `.ts`
    // files might be interpreted as `mpeg2` files.
    mime: {
      'text/x-typescript': ['ts'],
    },
    reporters: ['spec', 'coverage-istanbul'],
    browsers: ['Chrome'],
    browserNoActivityTimeout: 60000,
    customLaunchers: {
      Chrome: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    },
    coverageIstanbulReporter: {
      reports: ['html', 'json', 'text-summary'],
      dir: require('path').join(__dirname, 'coverage'),
      combineBrowserReports: true,
      fixWebpackSourcePaths: true,
    },
  });
};
