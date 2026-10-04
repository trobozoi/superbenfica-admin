import { z } from "zod";
import { telefoneSchema } from "@/lib/telefone";
import { UFS } from "@/types/api";

const texto = (max: number) => z.string().trim().max(max, { error: "maxLength" });

/**
 * Endereço de entrega (opcional): se o usuário não preencher nada, o cliente é salvo sem
 * endereço; se preencher qualquer campo, os obrigatórios da API passam a ser exigidos.
 */
export const enderecoSchema = z
  .object({
    cep: texto(9),
    endereco: texto(255),
    numero: texto(20),
    complemento: texto(100),
    bairro: texto(100),
    cidade: texto(100),
    estado: z.union([z.literal(""), z.enum(UFS)]),
  })
  .superRefine((value, ctx) => {
    const filled = Object.values(value).some((field) => field !== "");
    if (!filled) return;
    if (!/^\d{5}-?\d{3}$/.test(value.cep)) {
      ctx.addIssue({ code: "custom", path: ["cep"], message: "cep" });
    }
    for (const field of ["endereco", "numero", "bairro", "cidade", "estado"] as const) {
      if (!value[field]) ctx.addIssue({ code: "custom", path: [field], message: "required" });
    }
  });

export const clienteSchema = z.object({
  nome: z.string().trim().min(1, { error: "required" }).max(150, { error: "maxLength" }),
  email: z.email({ error: "email" }).max(254, { error: "maxLength" }),
  telefone: telefoneSchema,
  // "" no <select> = sem filial preferida (null na API).
  loja: z.union([z.literal("").transform(() => null), z.coerce.number().int().positive()]),
  endereco: enderecoSchema,
});

export type ClienteFormInput = z.input<typeof clienteSchema>;
export type ClienteFormValues = z.output<typeof clienteSchema>;
export type EnderecoFormValues = z.output<typeof enderecoSchema>;

export const EMPTY_ENDERECO: EnderecoFormValues = {
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

export function isEnderecoEmpty(endereco: EnderecoFormValues): boolean {
  return Object.values(endereco).every((field) => field === "");
}
