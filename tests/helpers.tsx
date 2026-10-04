import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import messages from "@/messages/pt-BR.json";
import type { Role } from "@/types/api";

export function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages} timeZone="America/Sao_Paulo">
      {ui}
    </NextIntlClientProvider>,
  );
}

interface TokenClaims {
  role?: Role | string;
  nome?: string;
  loja_id?: number | null;
  user_id?: number | string;
  /** Segundos a partir de agora (negativo = já expirado). */
  expiresIn?: number;
}

const base64Url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

/**
 * Gera um JWT no formato da API (claims nome, role, loja_id). A assinatura é fictícia:
 * o painel só decodifica o token; quem verifica a assinatura é a API.
 */
export function makeToken({
  role = "GERENTE",
  nome = "Gerente Centro",
  loja_id = 1,
  user_id = 7,
  expiresIn = 900,
}: TokenClaims = {}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url({ alg: "HS256", typ: "JWT" });
  const payload = base64Url({
    role,
    nome,
    loja_id,
    user_id: String(user_id),
    token_type: "access",
    iat: now,
    exp: now + expiresIn,
  });
  return `${header}.${payload}.assinatura-de-teste`;
}
