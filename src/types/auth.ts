import type { Role } from "./api";

/** Usuário autenticado, extraído das claims do access token. */
export interface SessionUser {
  id: number;
  nome: string;
  role: Role;
  lojaId: number | null;
  /** Expiração do access token (epoch em segundos). */
  exp: number;
}

export interface LoginInput {
  email: string;
  password: string;
}
