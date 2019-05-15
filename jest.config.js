module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json', 'vue', 'd.ts', 'ts', 'tsx'],

  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,vue}', '!**/node_modules/**'],
  coverageReporters: ['html', 'lcov', 'json'],

  transform: {
    '^.+\\.vue$': 'vue-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  snapshotSerializers: ['jest-serializer-vue'],

  testMatch: ['**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'],

  testURL: 'http://localhost/',

  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
};
