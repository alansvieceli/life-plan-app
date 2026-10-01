module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*Fixtures.ts',
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
