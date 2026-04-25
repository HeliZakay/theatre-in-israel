import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import security from "eslint-plugin-security";

const eslintConfig = defineConfig([
  ...nextVitals,
  security.configs.recommended,
  {
    rules: {
      // The eslint-plugin-security rules below are disabled because every
      // occurrence in this repo is a false positive. Re-enable case-by-case if
      // the codebase ever processes untrusted input in these sinks.
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-non-literal-regexp": "off",
      "security/detect-unsafe-regex": "off",
      "security/detect-possible-timing-attacks": "off",
    },
  },
  {
    files: ["tests/**", "e2e/**"],
    rules: {
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
