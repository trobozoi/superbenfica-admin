import { VIACEP } from "@/config/endpoints";
import { UFS, type Uf } from "@/types/api";

const CEP_LENGTH = 8;
const LOOKUP_TIMEOUT_MS = 8_000;

/** Endereço encontrado pelo CEP, já nos nomes de campo da API Django. */
export interface CepAddress {
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: Uf | "";
  /**
   * O "complemento" do ViaCEP é a faixa de numeração do logradouro (ex.: "lado ímpar"),
   * não o complemento do imóvel. Serve só como dica para o usuário.
   */
  faixa: string;
}

export type CepLookupResult =
  | { status: "found"; address: CepAddress }
  | { status: "not_found" }
  | { status: "invalid" }
  | { status: "error" };

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

export function cepDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, CEP_LENGTH);
}

/** Máscara 00000-000 aplicada enquanto o usuário digita. */
export function formatCep(value: string): string {
  const digits = cepDigits(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function isCompleteCep(value: string): boolean {
  return cepDigits(value).length === CEP_LENGTH;
}

function toUf(value: string | undefined): Uf | "" {
  const upper = (value ?? "").toUpperCase();
  return (UFS as readonly string[]).includes(upper) ? (upper as Uf) : "";
}

export function mapViaCep(data: ViaCepResponse): CepAddress {
  return {
    cep: formatCep(data.cep ?? ""),
    endereco: data.logradouro ?? "",
    bairro: data.bairro ?? "",
    cidade: data.localidade ?? "",
    estado: toUf(data.uf),
    faixa: data.complemento ?? "",
  };
}

/**
 * Consulta o ViaCEP. Nunca lança exceção: o formulário decide o que mostrar pelo status.
 * O ViaCEP responde 200 com {"erro": true} para CEP inexistente e 400 para formato inválido.
 */
export async function lookupCep(value: string, signal?: AbortSignal): Promise<CepLookupResult> {
  if (!isCompleteCep(value)) return { status: "invalid" };
  try {
    const timeout = AbortSignal.timeout(LOOKUP_TIMEOUT_MS);
    const response = await fetch(VIACEP.url(cepDigits(value)), {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: { Accept: "application/json" },
    });
    if (response.status === 400) return { status: "invalid" };
    if (!response.ok) return { status: "error" };
    const data = (await response.json()) as ViaCepResponse;
    if (data.erro) return { status: "not_found" };
    return { status: "found", address: mapViaCep(data) };
  } catch {
    return { status: "error" };
  }
}
