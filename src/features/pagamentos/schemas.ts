import { z } from "zod";
import { TIPOS_PAGAMENTO } from "@/types/api";

export const formaPagamentoSchema = z.object({
  nome: z.string().trim().min(1, { error: "required" }).max(60, { error: "maxLength" }),
  tipo: z.enum(TIPOS_PAGAMENTO, { error: "required" }),
  permite_troco: z.boolean(),
  ativa: z.boolean(),
  ordem: z.coerce
    .number({ error: "integer" })
    .int({ error: "integer" })
    .min(0, { error: "naoNegativo" })
    .max(32_767),
});

export type FormaPagamentoFormInput = z.input<typeof formaPagamentoSchema>;
export type FormaPagamentoFormValues = z.output<typeof formaPagamentoSchema>;
