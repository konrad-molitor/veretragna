import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import globals from "globals";
import path from "path";
import { fileURLToPath } from "url";
import tseslint from 'typescript-eslint';
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";

// Эмулируем __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    parser: tseslint.parser,
    plugins: ['@typescript-eslint'],
});

// Функция для очистки ключей объекта от пробелов
const trimGlobalKeys = (globalsObj) => {
  return Object.fromEntries(
    Object.entries(globalsObj).map(([key, value]) => [key.trim(), value])
  );
};

export default [
  // Базовая конфигурация JS
  js.configs.recommended,
  // Конфигурация TypeScript
  ...tseslint.configs.recommended,
  // Конфигурация Airbnb (через FlatCompat)
  ...compat.extends(
    "airbnb",
    "plugin:jsx-a11y/recommended"
  ),
  // Конфигурация React плагинов (рекомендуемый способ для Flat Config)
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      "react/jsx-filename-extension": [1, { extensions: [".jsx", ".tsx"] }],
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Общие настройки и переопределения для всего проекта frontend
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...trimGlobalKeys(globals.browser),
        ...globals.es2021,
      },
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
      "import/prefer-default-export": "off",
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true
      }
    }
  },
  // --- Добавляем блок для ТЕСТОВЫХ файлов ---
  {
      files: ['**/*.spec.{ts,tsx}', '**/*.test.{ts,tsx}'],
      languageOptions: {
          globals: {
              ...globals.jest,
          },
      },
      rules: {
          'prefer-regex-literals': 'off',
      }
  },
  // --- Добавляем блок для JS файлов ---
  {
    files: ['**/*.js', '**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off'
    }
  }
];
