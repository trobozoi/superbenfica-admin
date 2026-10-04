import { describe, expect, it } from "vitest";
import { CSV_TEMPLATE, MAX_IMPORT_ROWS, parseProdutosCsv } from "@/features/produtos/csv";

describe("features/produtos/csv", () => {
  it("lê o modelo com ponto e vírgula e preço com vírgula", () => {
    const result = parseProdutosCsv(CSV_TEMPLATE);
    expect(result.errors).toEqual([]);
    expect(result.valid).toEqual([
      {
        nome: "Arroz Tipo 1 5kg",
        sku: "ARZ-005",
        codigo_barras: "7891000315507",
        preco: "27.90",
        categoria: "MERCEARIA",
        descricao: "Pacote 5kg",
        ativo: true,
      },
    ]);
  });

  it("aceita vírgula, BOM, cabeçalho em maiúsculas e categoria desconhecida", () => {
    const csv = "﻿NOME,SKU,PRECO,CATEGORIA,ATIVO\nLeite,LT-1,4.5,laticinios,nao\nPão,PA-1,1,xyz,\n";
    const result = parseProdutosCsv(csv);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]).toMatchObject({ categoria: "LATICINIOS", ativo: false, preco: "4.5" });
    expect(result.valid[1]).toMatchObject({ categoria: undefined, ativo: true });
  });

  it("código de barras é opcional, mas precisa ser um GTIN válido", () => {
    const csv = "nome;sku;preco;codigo_barras\nA;A-1;1;\nB;B-1;1;7891000315508\n";
    const result = parseProdutosCsv(csv);
    expect(result.valid).toEqual([expect.objectContaining({ sku: "A-1", codigo_barras: "" })]);
    expect(result.errors).toEqual([{ line: 3, message: "codigo_barras: codigoBarras" }]);
  });

  it("aponta a linha de cada erro", () => {
    const result = parseProdutosCsv("nome;sku;preco\nOk;OK-1;10\n;SEM-NOME;10\nX;X-1;abc\n");
    expect(result.valid).toHaveLength(1);
    expect(result.errors.map((error) => error.line)).toEqual([3, 4]);
  });

  it("exige as colunas obrigatórias e limita o tamanho", () => {
    expect(parseProdutosCsv("nome;descricao\nA;B").errors[0]?.message).toMatch(/sku, preco/);
    const big = `nome;sku;preco\n${"A;B;1\n".repeat(MAX_IMPORT_ROWS + 1)}`;
    expect(parseProdutosCsv(big).errors[0]?.message).toMatch(/Máximo/);
  });
});
