import { z } from "zod";
import { STAFF_ROLES } from "@/config/permissions";
import { telefoneSchema } from "@/lib/telefone";

const optionalLoja = z.union([
  z.literal("").transform(() => null),
  z.coerce.number().int().positive(),
]);

/**
 * Na criação a senha é obrigatória (a API ainda aplica as regras de senha do Django).
 * Na edição ela é ignorada: este endpoint não altera senha.
 */
export function usuarioSchema(mode: "create" | "update") {
  return z.object({
    nome: z.string().trim().min(1, { error: "required" }).max(150, { error: "maxLength" }),
    email: z.email({ error: "email" }).max(254, { error: "maxLength" }),
    telefone: telefoneSchema,
    loja: optionalLoja,
    role: z.enum(STAFF_ROLES, { error: "required" }),
    is_active: z.boolean(),
    password:
      mode === "create" ? z.string().min(8, { error: "password" }).max(128) : z.string().max(128),
  });
}

export type UsuarioFormInput = z.input<ReturnType<typeof usuarioSchema>>;
export type UsuarioFormValues = z.output<ReturnType<typeof usuarioSchema>>;

const horario = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, { error: "required" });

export const lojaSchema = z.object({
  nome: z.string().trim().min(1, { error: "required" }).max(120, { error: "maxLength" }),
  endereco: z.string().trim().min(1, { error: "required" }).max(255, { error: "maxLength" }),
  telefone: telefoneSchema,
  horario_abertura: horario,
  horario_fechamento: horario,
  ativa: z.boolean(),
});

export type LojaFormValues = z.infer<typeof lojaSchema>;
