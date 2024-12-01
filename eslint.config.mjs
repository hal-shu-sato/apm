import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['node_modules/**/*', 'out/**/*', '.webpack/**/*'],
  },
  pluginJs.configs.recommended,
  jsdoc.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.electron,
  importPlugin.flatConfigs.typescript,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: 2020,
      sourceType: 'commonjs',

      parserOptions: {
        project: 'tsconfig.json',
      },
    },

    settings: {
      'import/resolver': {
        typescript: {
          project: 'node_modules',
        },
      },
    },

    rules: {
      'prefer-arrow-callback': 'error',
      'valid-jsdoc': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  eslintConfigPrettier,
];
