module.exports = {
  "root": true,
  "env": {
    "node": true
  },
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/essential",
    "eslint:recommended",
    "@vue/typescript"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "allow",
    "@typescript-eslint/no-explicit-any": "allow",
    "@typescript-eslint/explicit-member-accessibility": "no-public",
    "@typescript-eslint/indent": [
      "error",
      2
    ],
    "@typescript-eslint/camelcase": [
      "error",
      {
        "properties": "never"
      }
    ],
    "@typescript-eslint/prefer-interface": [
      "allow"
    ],
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
    ]
  },
  "parserOptions": {
    "parser": "@typescript-eslint/parser"
  }
}
