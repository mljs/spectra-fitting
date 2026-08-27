import { defineConfig, globalIgnores } from 'eslint/config';
import ts from 'eslint-config-cheminfo-typescript';
import globals from 'globals';

export default defineConfig(
  globalIgnores(['coverage', 'dist', 'lib']),
  ts,
  {
    // Demo page, loaded by web/index.html as a module.
    files: ['web/**'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Development scripts run with node; printing their results is the point.
    files: ['script/**'],
    languageOptions: {
      globals: globals.nodeBuiltin,
    },
    rules: {
      'no-console': 'off',
    },
  },
);
