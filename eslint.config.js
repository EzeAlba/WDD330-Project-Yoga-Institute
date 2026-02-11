import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["node_modules/", "dist/", ".git/"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        document: "readonly",
        window: "readonly",
        alert: "readonly",
        event: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        Promise: "readonly",
        Math: "readonly",
        Date: "readonly",
        JSON: "readonly",
        Set: "readonly",
        URLSearchParams: "readonly",
        __dirname: "readonly",
        // Application global managers
        api: "readonly",
        authManager: "readonly",
        classManager: "readonly",
        enrollmentManager: "readonly",
        paymentManager: "readonly",
        dashboardManager: "readonly",
        uiManager: "readonly",
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": [
        1,
        {
          argsIgnorePattern: "res|next|^err",
        },
      ],
      "arrow-body-style": [2, "as-needed"],
      "no-param-reassign": [
        2,
        {
          props: false,
        },
      ],
      "no-console": 1,
      quotes: ["error", "double", { allowTemplateLiterals: true }],
      "func-names": 0,
      "space-unary-ops": 2,
      "space-in-parens": "error",
      "space-infix-ops": "error",
      "comma-dangle": 0,
      "max-len": 0,
      "import/extensions": 0,
      "no-underscore-dangle": 0,
      "consistent-return": 0,
      radix: 0,
      "no-shadow": [
        2,
        {
          hoist: "all",
          allow: ["resolve", "reject", "done", "next", "err", "error"],
        },
      ],
      "no-unused-expressions": "off",
    },
  },
];
