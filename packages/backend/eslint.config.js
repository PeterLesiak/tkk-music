import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
     globalIgnores(["dist"]),
     {
          files: ["**/*.{js,ts}"],
          extends: [
               js.configs.recommended,
               tseslint.configs.recommended
          ],
          languageOptions: {
               globals: globals.browser
          },
          rules: {
               "indent": ["error", 5],
               "semi": ["error", "always"],
               "quotes": ["error", "double"],
               "comma-dangle": ["error", "never"],
               "comma-spacing": ["error", {
                    before: false,
                    after: true
               }],
               "object-curly-spacing": ["error", "always"],
               "array-bracket-spacing": ["error", "never"],
               "computed-property-spacing": ["error", "never"],
               "keyword-spacing": ["error", {
                    before: true,
                    after: true
               }],
               "space-before-blocks": ["error", "always"],
               "space-before-function-paren": ["error", {
                    anonymous: "always",
                    named: "never",
                    asyncArrow: "always"
               }],
               "brace-style": ["error", "1tbs", {
                    allowSingleLine: true
               }],
               "func-call-spacing": ["error", "never"],
               "function-paren-newline": ["error", "never"],
               "no-var": "error",
               "prefer-const": ["error", {
                    destructuring: "all"
               }],
               "one-var": ["error", "never"],
               eqeqeq: ["error", "always"],
               curly: ["error", "all"],
               "no-else-return": ["error", {
                    allowElseIf: false
               }], "no-lonely-if": "error",
               "no-multi-spaces": "error",
               "no-multiple-empty-lines": ["error", {
                    max: 1,
                    maxEOF: 0,
                    maxBOF: 0
               }],
               "no-trailing-spaces": "error",
               "no-unexpected-multiline": "error",
               "no-useless-constructor": "error",
               "no-duplicate-imports": "error"
          }
     }
]);