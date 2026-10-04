import { describe, expect, it } from "vitest";
import { loginSchema } from "@/features/auth/schemas";
import { clienteSchema, EMPTY_ENDERECO } from "@/features/clientes/schemas";
import { lojaSchema, usuarioSchema } from "@/features/configuracoes/schemas";
import { ajusteSchema } from "@/features/estoque/schemas";
import { pedidoSchema } from "@/features/pedidos/schemas";
import { formaPagamentoSchema } from "@/features/pagamentos/schemas";
import { produtoSchema } from "@/features/produtos/schemas";

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe("schemas de formulário", () => {
  it("login exige e-mail válido e senha", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
    expect(firstError(loginSchema.safeParse({ email: "x", password: "x" }))).toBe("email");
  });

  it("produto normaliza o preço e valida o formato", () => {
    const ok = produtoSchema.parse({ nome: "A", sku: "A", preco: " 10,5 ", ativo: true });
    expect(ok.preco).toBe("10.5");
    expect(
      firstError(produtoSchema.safeParse({ nome: "A", sku: "A", preco: "1.234", ativo: true })),
    ).toBe("price");
  });

  it("ajuste de estoque exige inteiro diferente de zero", () => {
    expect(ajusteSchema.parse({ delta: "-3", motivo: "perda" }).delta).toBe(-3);
    expect(firstError(ajusteSchema.safeParse({ delta: "0", motivo: "x" }))).toBe("nonZero");
    expect(firstError(ajusteSchema.safeParse({ delta: "1.5", motivo: "x" }))).toBe("integer");
  });

  it("pedido exige cliente, filial, forma de pagamento e ao menos um item", () => {
    const ok = pedidoSchema.parse({
      cliente: "1",
      loja: "2",
      forma_pagamento: "3",
      itens: [{ produto: "5", quantidade: "2" }],
      observacao: "",
    });
    expect(ok).toEqual({
      cliente: 1,
      loja: 2,
      forma_pagamento: 3,
      itens: [{ produto: 5, quantidade: 2 }],
      observacao: "",
    });
    const base = { cliente: 1, loja: 1, forma_pagamento: 1, observacao: "" };
    expect(firstError(pedidoSchema.safeParse({ ...base, itens: [] }))).toBe("minItems");
    const semForma = pedidoSchema.safeParse({
      ...base,
      forma_pagamento: "",
      itens: [{ produto: 5, quantidade: 1 }],
    });
    expect(semForma.error?.issues[0]).toMatchObject({
      path: ["forma_pagamento"],
      message: "required",
    });
  });

  it("cliente converte filial vazia em null", () => {
    expect(
      clienteSchema.parse({
        nome: "A",
        email: "a@a.com",
        telefone: "",
        loja: "",
        endereco: EMPTY_ENDERECO,
      }).loja,
    ).toBeNull();
    expect(
      clienteSchema.parse({
        nome: "A",
        email: "a@a.com",
        telefone: "",
        loja: "3",
        endereco: EMPTY_ENDERECO,
      }).loja,
    ).toBe(3);
  });

  it("usuário exige senha só na criação", () => {
    const base = {
      nome: "A",
      email: "a@a.com",
      telefone: "",
      loja: "",
      role: "CAIXA",
      is_active: true,
    };
    expect(usuarioSchema("create").safeParse({ ...base, password: "123" }).success).toBe(false);
    expect(usuarioSchema("update").safeParse({ ...base, password: "" }).success).toBe(true);
    expect(
      usuarioSchema("create").safeParse({ ...base, role: "CLIENTE", password: "12345678" }).success,
    ).toBe(false);
  });

  it("filial valida horários", () => {
    const loja = {
      nome: "L",
      endereco: "R",
      telefone: "",
      horario_abertura: "08:00",
      horario_fechamento: "22:00:00",
      ativa: true,
    };
    expect(lojaSchema.safeParse(loja).success).toBe(true);
    expect(lojaSchema.safeParse({ ...loja, horario_abertura: "8h" }).success).toBe(false);
  });

  it("forma de pagamento exige nome, tipo válido e ordem não negativa", () => {
    const ok = formaPagamentoSchema.parse({
      nome: "  Pix  ",
      tipo: "PIX",
      permite_troco: false,
      ativa: true,
      ordem: "10",
    });
    expect(ok).toMatchObject({ nome: "Pix", ordem: 10 });
    const base = { nome: "X", tipo: "PIX", permite_troco: false, ativa: true, ordem: 0 };
    expect(firstError(formaPagamentoSchema.safeParse({ ...base, nome: " " }))).toBe("required");
    expect(firstError(formaPagamentoSchema.safeParse({ ...base, tipo: "BOLETO" }))).toBe(
      "required",
    );
    expect(firstError(formaPagamentoSchema.safeParse({ ...base, ordem: "-1" }))).toBe(
      "naoNegativo",
    );
  });
});
