module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:import/recommended', 'plugin:import/typescript', 'plugin:vue/essential', 'plugin:storybook/recommended', 'prettier'],
  settings: {
    'import/internal-regex': '^@/',
    'import/resolver': {
      typescript: {},
      alias: {
        map: [['@', './src']],
        extensions: ['.ts', '.js', '.vue', '.d.ts']
      },
      vite: {
        configPath: './vite.config.ts'
      }
    }
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': ['error', {
      allow: ['arrowFunctions']
    }],
    '@typescript-eslint/explicit-member-accessibility': ['error', {
      accessibility: 'no-public'
    }],
    '@typescript-eslint/no-non-null-assertion': 'off',
    // "@typescript-eslint/naming-convention": [
    //   "error",
    //   { "selector": "objectLiteralProperty", "format": ["camelCase"] }
    // ],
    '@typescript-eslint/prefer-interface': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_'
    }],
    'prefer-const': ['error'],
    'no-console': ['error', {
      allow: ['warn', 'error']
    }],
    'vue/html-self-closing': ['error', {
      html: {
        void: 'any',
        normal: 'always',
        component: 'always'
      },
      svg: 'always',
      math: 'always'
    }],
    'vue/return-in-computed-property': ['error', {
      treatUndefinedAsUnspecified: false
    }],
    'simple-import-sort/imports': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error'
  },
  plugins: ['simple-import-sort', '@typescript-eslint', 'vue'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    createDefaultProgram: true,
    project: ['./tsconfig.json']
  }
};
