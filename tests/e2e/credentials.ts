/**
 * Credenciais da carga inicial da API (python manage.py carga_inicial), lidas de
 * .env.test.local. Nada aqui é versionado com valores reais.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Defina ${name} em .env.test.local (veja .env.test.example).`);
  }
  return value;
}

export const credentials = {
  admin: () => ({ email: required("E2E_ADMIN_EMAIL"), password: required("E2E_ADMIN_PASSWORD") }),
  /** Usuários de exemplo criados pela carga inicial, todos com SEED_DEFAULT_PASSWORD. */
  seed: (email: string) => ({ email, password: required("E2E_SEED_PASSWORD") }),
};

export const SEED_USERS = {
  gerente: "gerente.centro@superbenfica.com.br",
  separador: "separador.centro@superbenfica.com.br",
  caixa: "caixa.centro@superbenfica.com.br",
  cliente: "cliente.demo@superbenfica.com.br",
} as const;
