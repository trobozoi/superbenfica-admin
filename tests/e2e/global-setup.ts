/**
 * Antes dos testes E2E: confere se a API real está no ar e se as credenciais existem,
 * para falhar com uma mensagem clara em vez de timeouts confusos.
 */
export default async function globalSetup(): Promise<void> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) throw new Error("Defina API_URL em .env.local (veja .env.example).");

  for (const name of ["E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD", "E2E_SEED_PASSWORD"]) {
    if (!process.env[name]) {
      throw new Error(`Defina ${name} em .env.test.local (veja .env.test.example).`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/schema/`, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error(
      `A API não respondeu em ${apiUrl}. Suba o backend (python manage.py runserver) antes do E2E.`,
    );
  }
  if (response.status >= 500) {
    throw new Error(
      `A API em ${apiUrl} respondeu ${response.status}. Verifique os logs do backend.`,
    );
  }
}
