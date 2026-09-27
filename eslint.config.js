import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import sonarjs from 'eslint-plugin-sonarjs';

const eslintConfig = defineConfig([
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  sonarjs.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'max-lines-per-function': ['error', 50],
      'max-lines': ['error', 300],
      'max-params': ['error', 4],
      'max-depth': ['error', 3],
      complexity: ['error', 10],
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  globalIgnores([
    'dist/**',
    'coverage/**',
    '.gate-logs/**',
    // Config files not covered by tsconfig.json's `include`.
    'eslint.config.js',
    '.dependency-cruiser.mjs',
  ]),
]);

export default eslintConfig;
