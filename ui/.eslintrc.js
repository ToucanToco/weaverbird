module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
    "plugin:vue/essential",
    "@vue/eslint-config-prettier",
  ],
  settings: {
    "import/internal-regex": "^@/",
    "import/resolver": {
      "typescript": {},
      "alias": {
        "map": [
          [
            "@",
            "./src"
          ]
        ],
        "extensions": [
          ".ts",
          ".js",
          ".vue",
          ".d.ts"
        ]
      },
      vite: {
        configPath: "./vite.config.ts"
      }
    }
  },
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-function": [
      "error",
      {
        "allow": [
          "arrowFunctions"
        ]
      }
    ],
    "@typescript-eslint/explicit-member-accessibility": [
      "error", { "accessibility": "no-public" }
    ],
    "@typescript-eslint/camelcase": [
      "error",
      {
        "properties": "never"
      }
    ],
    "@typescript-eslint/prefer-interface": "off",
    "no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-unused-vars-experimental": [
      "error",
      {
        "ignoredNamesRegex": "^_"
      }
    ],
    "space-before-function-paren": [
      "error",
      {
        "anonymous": "never",
        "named": "never",
        "asyncArrow": "always"
      }
    ],
    "prefer-const": [
      "error"
    ],
    "no-console": [
      "error",
      {
        "allow": [
          "warn",
          "error"
        ]
      }
    ],
    "vue/html-self-closing": [
      "error",
      {
        "html": {
          "void": "always",
          "normal": "always",
          "component": "always"
        },
        "svg": "always",
        "math": "always"
      }
    ],
    "vue/return-in-computed-property": ["error", { treatUndefinedAsUnspecified: false }],
    "simple-import-sort/sort": "error",
  },

  plugins: ['import', 'simple-import-sort', '@typescript-eslint', 'vue'],
  parser: "vue-eslint-parser",
  parserOptions: {
    ecmaVersion: 'latest',
    parser: "@typescript-eslint/parser",
    sourceType: 'module',
    createDefaultProgram: true,
    project: ['./tsconfig.json'],
  }
};
