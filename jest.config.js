module.exports = {
  moduleFileExtensions: ['js', 'json', 'vue', 'ts', 'd.ts'],
  testEnvironment: 'jsdom',
  testURL: 'http://localhost/',
  testMatch: ['<rootDir>/tests/unit/**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.(css|scss)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.ts$': process.env.VQB_QUICKTEST ? 'babel-jest' : 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!v-calendar)', 'tests/*.js', 'playground/*'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{vue,ts,js}'],
  coveragePathIgnorePatterns: ['/node_modules/', 'playground/', 'tests/', 'src/typings/', 'src/main.ts'],
  coverageDirectory: 'coverage',
};
