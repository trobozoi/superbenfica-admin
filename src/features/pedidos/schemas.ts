import { z } from "zod";

const idSchema = z.coerce.number({ error: "required" }).int().positive({ error: "required" });

/** Pedido criado por funcionário: cliente obrigatório, na filial do funcionário. */
export const pedidoSchema = z.object({
  cliente: idSchema,
  loja: idSchema,
  forma_pagamento: idSchema,
  itens: z
    .array(
      z.object({
        produto: idSchema,
        quantidade: z.coerce
          .number({ error: "integer" })
          .int({ error: "integer" })
          .min(1, { error: "positive" })
          .max(999),
      }),
    )
    .min(1, { error: "minItems" }),
  observacao: z.string().trim().max(500, { error: "maxLength" }),
});

export type PedidoFormInput = z.input<typeof pedidoSchema>;
export type PedidoFormValues = z.output<typeof pedidoSchema>;
