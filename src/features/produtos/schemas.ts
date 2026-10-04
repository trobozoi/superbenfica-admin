import { z } from "zod";
import { gtinValido, limparCodigoBarras } from "@/lib/gtin";
import { CATEGORIAS } from "@/types/api";

/** Preço no formato da API (decimal com ponto, até 2 casas). Aceita vírgula na digitação. */
export const precoSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(",", "."))
  .pipe(z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, { error: "price" }));

/** Código de barras opcional: vazio ou GTIN com dígito verificador correto. */
export const codigoBarrasSchema = z
  .string()
  .optional()
  .transform((value) => limparCodigoBarras(value ?? ""))
  .refine((value) => value === "" || gtinValido(value), { error: "codigoBarras" });

export const produtoSchema = z.object({
  nome: z.string().trim().min(1, { error: "required" }).max(150, { error: "maxLength" }),
  sku: z.string().trim().min(1, { error: "required" }).max(30, { error: "maxLength" }),
  codigo_barras: codigoBarrasSchema,
  preco: precoSchema,
  categoria: z.enum(CATEGORIAS).optional(),
  descricao: z.string().trim().optional(),
  ativo: z.boolean(),
});

/** Dados do produto em si (também usados na importação por CSV). */
export type ProdutoDados = z.output<typeof produtoSchema>;

const quantidade = z.coerce
  .number({ error: "integer" })
  .int({ error: "integer" })
  .min(0, { error: "naoNegativo" })
  .max(9_999_999);

/** Estoque de uma filial no formulário (veja features/produtos/estoque.ts). */
export const estoqueRowSchema = z.object({
  loja: z.number().int().positive(),
  lojaNome: z.string(),
  estoqueId: z.number().int().positive().nullable(),
  quantidade,
  quantidade_minima: quantidade,
  minimoAtual: z.number().int().nullable(),
});

/** Formulário completo: produto + estoque inicial e quantidade mínima por filial. */
export const produtoFormSchema = produtoSchema.extend({
  estoques: z.array(estoqueRowSchema),
});

export type ProdutoFormInput = z.input<typeof produtoFormSchema>;
export type ProdutoFormValues = z.output<typeof produtoFormSchema>;
