/**
 * Garante que chamadas simultâneas compartilhem a mesma Promise em andamento.
 *
 * Usado no refresh de token: a API rotaciona o refresh token e coloca o antigo na
 * blacklist, então dois refreshes paralelos fariam o segundo falhar e deslogar o usuário.
 */
export function singleFlight<T>(task: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null;
  return () => {
    inFlight ??= task().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
