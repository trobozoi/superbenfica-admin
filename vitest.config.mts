import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      // Mesmo escopo de sonar.coverage.exclusions: lógica testável por unidade.
      // Páginas, layouts e componentes de UI são cobertos pelos testes E2E.
      include: [
        "src/config/**/*.ts",
        "src/lib/**/*.ts",
        "src/services/**/*.ts",
        "src/store/**/*.ts",
        "src/features/**/{schemas,actions,csv,summary,service,estoque,foto}.ts",
      ],
      exclude: ["src/**/*.d.ts", "src/lib/server/**"],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
