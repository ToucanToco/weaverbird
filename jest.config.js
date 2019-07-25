module.exports = {
  moduleFileExtensions: ['js', 'json', 'vue', 'ts'],
  testEnvironment: 'jsdom',
  testURL: 'http://localhost/',
  testMatch: ['<rootDir>/tests/unit/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/', 'tests/*.js', 'playground/*'],
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', 'playground/', 'tests/', 'src/typings/'],
  coverageDirectory: 'coverage',
};
