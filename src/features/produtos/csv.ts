import Papa from "papaparse";
import { CATEGORIAS, type Categoria } from "@/types/api";
import { produtoSchema, type ProdutoDados } from "./schemas";

export const CSV_COLUMNS = [
  "nome",
  "sku",
  "codigo_barras",
  "preco",
  "categoria",
  "descricao",
  "ativo",
] as const;
export const MAX_IMPORT_ROWS = 1000;

export interface CsvRowError {
  /** Linha no arquivo (1 = cabeçalho). */
  line: number;
  message: string;
}

export interface CsvParseResult {
  valid: ProdutoDados[];
  errors: CsvRowError[];
}

const TRUE_VALUES = new Set(["", "1", "true", "sim", "s", "yes", "ativo"]);

function normalizeCategoria(value: string | undefined): Categoria | undefined {
  const upper = value?.trim().toUpperCase();
  if (!upper) return undefined;
  return (CATEGORIAS as readonly string[]).includes(upper) ? (upper as Categoria) : undefined;
}

function rowToInput(row: Record<string, string | undefined>) {
  return {
    nome: row.nome ?? "",
    sku: row.sku ?? "",
    codigo_barras: row.codigo_barras ?? "",
    preco: row.preco ?? "",
    categoria: normalizeCategoria(row.categoria),
    descricao: row.descricao ?? "",
    ativo: TRUE_VALUES.has((row.ativo ?? "").trim().toLowerCase()),
  };
}

/**
 * Lê um CSV de produtos (separador detectado automaticamente: "," ou ";") e valida
 * cada linha com o mesmo schema do formulário. Nada é enviado à API aqui.
 */
export function parseProdutosCsv(text: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const result: CsvParseResult = { valid: [], errors: [] };
  const missing = ["nome", "sku", "preco"].filter((col) => !parsed.meta.fields?.includes(col));
  if (missing.length > 0) {
    result.errors.push({
      line: 1,
      message: `Colunas obrigatórias ausentes: ${missing.join(", ")}`,
    });
    return result;
  }
  if (parsed.data.length > MAX_IMPORT_ROWS) {
    result.errors.push({ line: 1, message: `Máximo de ${MAX_IMPORT_ROWS} linhas por arquivo.` });
    return result;
  }

  parsed.data.forEach((row, index) => {
    const line = index + 2;
    const validation = produtoSchema.safeParse(rowToInput(row));
    if (validation.success) {
      result.valid.push(validation.data);
    } else {
      const issue = validation.error.issues[0];
      result.errors.push({ line, message: `${issue?.path.join(".")}: ${issue?.message}` });
    }
  });
  return result;
}

export const CSV_TEMPLATE = `${CSV_COLUMNS.join(";")}\nArroz Tipo 1 5kg;ARZ-005;7891000315507;27,90;MERCEARIA;Pacote 5kg;sim\n`;
