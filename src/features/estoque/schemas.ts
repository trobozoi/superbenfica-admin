import { z } from "zod";

/** Ajuste manual: positivo = entrada, negativo = saída (POST /estoques/{id}/ajustar/). */
export const ajusteSchema = z.object({
  delta: z.coerce
    .number({ error: "integer" })
    .int({ error: "integer" })
    .refine((value) => value !== 0, { error: "nonZero" }),
  motivo: z.string().trim().min(1, { error: "required" }).max(255, { error: "maxLength" }),
});

export type AjusteFormInput = z.input<typeof ajusteSchema>;
export type AjusteFormValues = z.output<typeof ajusteSchema>;
