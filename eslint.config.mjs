import prettierConfig from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".venv/**",
      "coverage/**",
      "node_modules/**",
      "playwright-report/**",
      "project-input/**",
      "test-results/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  prettierConfig,
];

export default eslintConfig;
