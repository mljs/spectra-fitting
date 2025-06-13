import { defineConfig, globalIgnores } from 'eslint/config';
import ts from 'eslint-config-cheminfo-typescript/base';

export default defineConfig(globalIgnores(['coverage', 'lib']), ts, {
  files: ['script/**'],
  rules: {
    'no-console': 'off',
  },
});
