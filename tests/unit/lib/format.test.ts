import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  toIsoDate,
  toNumber,
} from "@/lib/format";
import { cn } from "@/lib/utils";

// Intl usa espaço não separável entre "R$" e o valor.
const normalize = (value: string) => value.replace(/\s/g, " ");

describe("lib/format", () => {
  it("converte decimais da API (string) em número", () => {
    expect(toNumber("12.90")).toBeCloseTo(12.9);
    expect(toNumber(3)).toBe(3);
    expect(toNumber("abc")).toBe(0);
    expect(toNumber(null)).toBe(0);
  });

  it("formata moeda e números em pt-BR", () => {
    expect(normalize(formatCurrency("1234.5"))).toBe("R$ 1.234,50");
    expect(formatNumber(1500)).toBe("1.500");
  });

  it("formata datas e trata valores vazios ou inválidos", () => {
    expect(formatDate("2026-10-02T12:00:00Z")).toMatch(/02\/10\/2026/);
    expect(formatDateTime("2026-10-02T12:00:00Z")).toMatch(/02\/10\/2026/);
    expect(formatDate(null)).toBe("-");
    expect(formatDateTime("invalida")).toBe("-");
  });

  it("gera AAAA-MM-DD na data local", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("cn resolve conflitos de classes Tailwind", () => {
    expect(cn("px-2", "px-4", undefined, null)).toBe("px-4");
    expect(cn("text-sm", { hidden: false, block: true })).toBe("text-sm block");
  });
});
