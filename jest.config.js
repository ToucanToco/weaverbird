module.exports = {
  moduleFileExtensions: ['js', 'json', 'vue', 'ts', 'd.ts'],
  testEnvironment: 'jsdom',
  testURL: 'http://localhost/',
  testMatch: ['<rootDir>/tests/unit/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.ts$': process.env.VQB_QUICKTEST ? 'babel-jest' : 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/', 'tests/*.js', 'playground/*'],
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', 'playground/', 'tests/', 'src/typings/'],
  coverageDirectory: 'coverage',
};
