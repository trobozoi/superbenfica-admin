import { z } from "zod";

/** Usado no formulário (cliente) e na rota /api/auth/login (servidor). */
export const loginSchema = z.object({
  email: z.email({ error: "email" }).max(254),
  password: z.string().min(1, { error: "required" }).max(128),
});

/** Formulário da tela de login: credenciais + "Salvar senha" (não vai para a API). */
export const loginFormSchema = loginSchema.extend({ lembrar: z.boolean() });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
