import { decodeJwt } from "jose";
import { ROLES, type Role } from "@/types/api";
import type { SessionUser } from "@/types/auth";

/**
 * Extrai o usuário das claims do access token emitido pela API
 * (claims customizadas: nome, role, loja_id).
 *
 * IMPORTANTE: o token é apenas DECODIFICADO, não verificado. O frontend não conhece a
 * chave de assinatura; a validação real acontece na API a cada requisição. Por isso este
 * dado só serve para decidir o que a interface mostra, nunca para autorizar operações.
 */
export function sessionFromAccessToken(token: string | null | undefined): SessionUser | null {
  if (!token) return null;
  try {
    const claims = decodeJwt(token);
    const role = claims.role;
    const id = Number(claims.user_id);
    if (!isRole(role) || !Number.isInteger(id) || typeof claims.exp !== "number") return null;
    return {
      id,
      nome: typeof claims.nome === "string" ? claims.nome : "",
      role,
      lojaId: typeof claims.loja_id === "number" ? claims.loja_id : null,
      exp: claims.exp,
    };
  } catch {
    return null;
  }
}

/** Expiração (epoch em segundos) de qualquer JWT, ou null se ilegível. */
export function tokenExpiry(token: string | null | undefined): number | null {
  if (!token) return null;
  try {
    const { exp } = decodeJwt(token);
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/**
 * Considera o token expirado alguns segundos antes do prazo, para evitar que expire
 * entre a checagem e a chegada da requisição na API.
 */
export function isExpired(exp: number | null, nowMs = Date.now(), skewSeconds = 10): boolean {
  if (exp === null) return true;
  return exp - skewSeconds <= Math.floor(nowMs / 1000);
}

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
