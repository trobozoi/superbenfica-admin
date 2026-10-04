import { z } from "zod";

/**
 * Ponto ÚNICO de configuração de URLs e ambiente.
 * Para apontar para produção basta alterar as variáveis no .env (ou no deploy);
 * nenhum outro arquivo contém URLs ou IPs da API.
 */

const APP_ENVS = ["development", "staging", "production"] as const;
export type AppEnv = (typeof APP_ENVS)[number];

/** Remove barras finais sem regex (evita backtracking, regra Sonar S5852). */
export function trimTrailingSlash(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end -= 1;
  return value.slice(0, end);
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_WS_URL: z.url({ protocol: /^wss?$/ }).transform(trimTrailingSlash),
  NEXT_PUBLIC_APP_ENV: z.enum(APP_ENVS).default("development"),
});

const serverEnvSchema = z.object({
  API_URL: z.url({ protocol: /^https?$/ }).transform(trimTrailingSlash),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

type EnvSource = Record<string, string | undefined>;

function parseOrThrow<T extends z.ZodType>(schema: T, source: EnvSource): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Variáveis de ambiente inválidas ou ausentes (veja .env.example). ${details}`);
  }
  return result.data;
}

export function parsePublicEnv(source: EnvSource): PublicEnv {
  return parseOrThrow(publicEnvSchema, source);
}

export function parseServerEnv(source: EnvSource): ServerEnv {
  return parseOrThrow(serverEnvSchema, source);
}

/**
 * Variáveis NEXT_PUBLIC_* precisam ser referenciadas literalmente
 * para que o Next as embuta no bundle do navegador.
 */
export const publicEnv: PublicEnv = parsePublicEnv({
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
});

export const isProduction = publicEnv.NEXT_PUBLIC_APP_ENV === "production";
