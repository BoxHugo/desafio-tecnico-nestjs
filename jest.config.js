/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true, 
  rootDir: '.',
  silent: false,
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js','json','ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@domain/(.*)$':         '<rootDir>/src/domain/$1',
    '^@application/(.*)$':    '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@interface/(.*)$':      '<rootDir>/src/interface/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
