import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/**
 * Regras alinhadas ao perfil "Sonar way" do SonarQube:
 * - eslint-plugin-sonarjs: mesmas regras do analisador JS/TS do Sonar
 * - typescript-eslint strict: sem any, sem non-null assertion etc.
 * - jsx-a11y: acessibilidade
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.strict,
  sonarjs.configs.recommended,
  {
    // O eslint-config-next já registra o plugin jsx-a11y; aqui só ativamos as regras recomendadas.
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  {
    rules: {
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-duplicate-string": ["warn", { threshold: 4 }],
      "sonarjs/todo-tag": "warn",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "react/no-array-index-key": "error",
      "react/no-danger": "error",
      eqeqeq: ["error", "always"],
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/no-hardcoded-passwords": "off",
      "sonarjs/no-clear-text-protocols": "off",
      "sonarjs/no-hardcoded-ip": "off",
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
