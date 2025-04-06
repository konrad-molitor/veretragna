import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "path";
import { fileURLToPath } from "url";
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    parser: tseslint.parser,
    plugins: ['@typescript-eslint'],
});

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends("airbnb-base"),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { node: true, es2021: true },
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': ["error", { "devDependencies": true }],
      "no-console": "warn",
      "import/prefer-default-export": "off",
    },
    settings: {
        'import/resolver': {
          typescript: true,
          node: true
        }
      }
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off'
    }
  }
];
