import { pathsToModuleNameMapper } from 'ts-jest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { compilerOptions } = require('./tsconfig.json');

const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/'
  }),
  roots: ['<rootDir>'],
  // roots: ['<rootDir>/src/tests'],
  // demo-runner/ is a standalone Node package with its own `node --test`/ESM toolchain
  // (its *.test.ts import `./foo.js` ESM-style and use node:test, neither of which this
  // ts-jest config resolves). It is built, type-checked, and tested by its own package
  // scripts — not by Agora's jest. Excluding it here keeps `<rootDir>` discovery while
  // not reaching across the package boundary. (Re-list the default node_modules ignore,
  // since setting testPathIgnorePatterns overrides jest's built-in default.)
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/demo-runner/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  // Allow per-file test environment override via docblock
  testEnvironmentOptions: {},
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

export default config;