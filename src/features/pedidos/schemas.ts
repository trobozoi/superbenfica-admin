import { z } from "zod";
import { TIPOS_ENTREGA } from "@/types/api";

const idSchema = z.coerce.number({ error: "required" }).int().positive({ error: "required" });

/**
 * Pedido criado por funcionário: cliente obrigatório, na filial do funcionário. Na entrega em
 * domicílio, o endereço é um dos cadastrados do cliente (a API copia o texto para o pedido).
 */
export const pedidoSchema = z
  .object({
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
    tipo_entrega: z.enum(TIPOS_ENTREGA),
    endereco: z.union([z.literal(""), idSchema]),
  })
  .superRefine((values, ctx) => {
    if (values.tipo_entrega === "DOMICILIO" && values.endereco === "") {
      ctx.addIssue({ code: "custom", path: ["endereco"], message: "required" });
    }
  })
  .transform(({ endereco, ...values }) =>
    // Na retirada o endereço não vai para a API.
    values.tipo_entrega === "DOMICILIO" && endereco !== "" ? { ...values, endereco } : values,
  );

export type PedidoFormInput = z.input<typeof pedidoSchema>;
export type PedidoFormValues = z.output<typeof pedidoSchema>;
