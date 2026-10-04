import { describe, expect, it } from "vitest";
import { formatTelefone, telefoneDigits, telefoneSchema } from "@/lib/telefone";

describe("lib/telefone", () => {
  it("formata enquanto o usuário digita", () => {
    expect(formatTelefone("")).toBe("");
    expect(formatTelefone("8")).toBe("(8");
    expect(formatTelefone("85")).toBe("(85");
    expect(formatTelefone("853")).toBe("(85) 3");
    expect(formatTelefone("853200")).toBe("(85) 3200");
    expect(formatTelefone("8532001")).toBe("(85) 3200-1");
  });

  it("fixo com 10 dígitos e celular com 11", () => {
    expect(formatTelefone("8532001000")).toBe("(85) 3200-1000");
    expect(formatTelefone("85999998888")).toBe("(85) 99999-8888");
  });

  it("ignora caracteres não numéricos e excesso de dígitos", () => {
    expect(formatTelefone("(85) 99999-88881234")).toBe("(85) 99999-8888");
    expect(telefoneDigits("+55 (85) 3200-1000")).toBe("8532001000");
    expect(formatTelefone("+55 85 99999-8888")).toBe("(85) 99999-8888");
  });

  it("aceita vazio, fixo ou celular e recusa número incompleto", () => {
    expect(telefoneSchema.safeParse("").success).toBe(true);
    expect(telefoneSchema.safeParse("(85) 3200-1000").success).toBe(true);
    expect(telefoneSchema.safeParse("(85) 99999-8888").success).toBe(true);
    expect(telefoneSchema.safeParse("(85) 3200").error?.issues[0]?.message).toBe("telefone");
  });
});
