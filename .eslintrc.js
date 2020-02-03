module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
    "plugin:vue/essential",
    "eslint:recommended",
    "@vue/typescript",
    "import",
  ],
  settings: {
    "import/internal-regex": "^@/",
    "import/resolver": {
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
    "@typescript-eslint/indent": [
      "error",
      2,
      {
        // cf. https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/typescript-estree/src/ts-estree/ts-estree.ts
        // for available types
        "ignoredNodes": [
          // cf. https://github.com/typescript-eslint/typescript-eslint/issues/455
          "TSTypeParameterInstantiation",
          "TSUnionType"
        ],
        "SwitchCase": 1
      }
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

  plugins: ['import', 'simple-import-sort', 'vue'],
  parserOptions: {
    parser: "@typescript-eslint/parser",
    project: 'tsconfig.json',
    extraFileExtensions: ['.vue'],
  }
};
