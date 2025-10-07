import js from "@eslint/js";

export default [
  {
    ...js.configs.recommended,
    files: ["**/*.js", "**/*.jsx"],
    ignores: ["node_modules/**", "dist/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];
