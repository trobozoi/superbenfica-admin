import { describe, expect, it } from "vitest";
import { gtinValido, limparCodigoBarras } from "@/lib/gtin";

describe("lib/gtin", () => {
  it.each(["7891000315507", "96385074", "036000291452", "17891000315504"])(
    "aceita o GTIN %s",
    (codigo) => {
      expect(gtinValido(codigo)).toBe(true);
    },
  );

  it.each(["7891000315508", "789100031550", "12345", "78910003155O7", "", "７".repeat(13)])(
    "recusa %j",
    (codigo) => {
      expect(gtinValido(codigo)).toBe(false);
    },
  );

  it("limpa espaços e caracteres que o leitor envia junto", () => {
    expect(limparCodigoBarras(" 789 1000 315507\r")).toBe("7891000315507");
  });
});
