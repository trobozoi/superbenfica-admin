import { isAxiosError } from "axios";

/** Erro normalizado da API, independente do formato que o DRF devolveu. */
export interface ApiError {
  status: number;
  /** Mensagem geral (detail / non_field_errors / primeira mensagem de campo). */
  message: string;
  /** Erros por campo, prontos para o react-hook-form (setError). */
  fieldErrors: Record<string, string>;
}

export const NETWORK_ERROR_STATUS = 0;
const GENERIC_MESSAGE = "Não foi possível concluir a operação.";

function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstMessage(value[0]);
  if (value && typeof value === "object") return firstMessage(Object.values(value)[0]);
  return null;
}

/**
 * Converte as respostas de erro do DRF:
 * - {"detail": "..."}                       -> message
 * - {"non_field_errors": ["..."]}           -> message
 * - {"campo": ["..."], "outro": ["..."]}    -> fieldErrors
 */
export function parseDrfErrorBody(status: number, data: unknown): ApiError {
  const fieldErrors: Record<string, string> = {};
  let message: string | null = null;

  if (typeof data === "string" && data.trim() && !data.trimStart().startsWith("<")) {
    message = data;
  } else if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const text = firstMessage(value);
      if (!text) continue;
      if (key === "detail" || key === "non_field_errors") message ??= text;
      else if (key !== "code") fieldErrors[key] = text;
    }
  } else if (Array.isArray(data)) {
    message = firstMessage(data);
  }

  return {
    status,
    message: message ?? Object.values(fieldErrors)[0] ?? GENERIC_MESSAGE,
    fieldErrors,
  };
}

export function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    if (!error.response) {
      return {
        status: NETWORK_ERROR_STATUS,
        message: "Sem conexão com o servidor. Verifique sua rede.",
        fieldErrors: {},
      };
    }
    return parseDrfErrorBody(error.response.status, error.response.data);
  }
  return {
    status: NETWORK_ERROR_STATUS,
    message: error instanceof Error ? error.message : GENERIC_MESSAGE,
    fieldErrors: {},
  };
}
