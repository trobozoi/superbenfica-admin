import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// src/config/env.ts valida as variáveis no import; os testes usam valores fixos.
process.env.NEXT_PUBLIC_WS_URL = "ws://localhost:8000";
process.env.NEXT_PUBLIC_APP_ENV = "development";

afterEach(() => {
  cleanup();
});
