import { BFF_ROUTES, OPEN_FOOD_FACTS } from "@/config/endpoints";
import { gtinValido, limparCodigoBarras } from "@/lib/gtin";
import { validarFoto } from "./foto";

const LOOKUP_TIMEOUT_MS = 10_000;
const NOME_MAX = 150;

/** Dados encontrados pelo código de barras. Cada um pode faltar. */
export interface ProdutoEncontrado {
  nome: string | null;
  foto: File | null;
}

export type BuscaGtinResult =
  | { status: "found"; produto: ProdutoEncontrado }
  | { status: "not_found" }
  | { status: "invalid" }
  | { status: "error" };

interface OpenFoodFactsResponse {
  status?: number;
  product?: {
    product_name?: string;
    product_name_pt?: string;
    quantity?: string;
  };
}

/** Nome em português (ou o principal) com a quantidade, ex.: "Leite Condensado 395 g". */
export function nomeOpenFoodFacts(data: OpenFoodFactsResponse): string | null {
  const produto = data.product;
  const nome = (produto?.product_name_pt || produto?.product_name || "").trim();
  if (!nome) return null;
  const quantidade = produto?.quantity?.trim() ?? "";
  const completo =
    quantidade && !nome.toLowerCase().includes(quantidade.toLowerCase())
      ? `${nome} ${quantidade}`
      : nome;
  return completo.slice(0, NOME_MAX);
}

function comTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(LOOKUP_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

/** null = produto sem nome na base; lança exceção em falha de rede ou da API. */
async function buscarNome(gtin: string, signal?: AbortSignal): Promise<string | null> {
  const response = await fetch(OPEN_FOOD_FACTS.url(gtin), {
    signal: comTimeout(signal),
    headers: { Accept: "application/json" },
  });
  // O Open Food Facts responde 404 para código que não está na base.
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Open Food Facts: HTTP ${response.status}`);
  return nomeOpenFoodFacts((await response.json()) as OpenFoodFactsResponse);
}

/** null = sem foto no Cosmos; lança exceção em falha de rede ou do servidor. */
async function buscarFoto(gtin: string, signal?: AbortSignal): Promise<File | null> {
  const response = await fetch(BFF_ROUTES.gtinFoto(gtin), { signal: comTimeout(signal) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Foto do Cosmos: HTTP ${response.status}`);
  const blob = await response.blob();
  if (validarFoto(blob)) return null;
  const extensao = blob.type.split("/")[1] ?? "img";
  // Arquivo temporário em memória: só vai para a API quando o produto for salvo.
  return new File([blob], `${gtin}.${extensao}`, { type: blob.type });
}

/**
 * Busca o nome (Open Food Facts) e a foto (Cosmos) de um produto pelo código de barras.
 * Nunca lança exceção: o formulário decide o que mostrar pelo status. Se uma das fontes
 * falhar e a outra encontrar algo, o que foi encontrado é aproveitado.
 */
export async function buscarProdutoPorGtin(
  value: string,
  signal?: AbortSignal,
): Promise<BuscaGtinResult> {
  const gtin = limparCodigoBarras(value);
  if (!gtinValido(gtin)) return { status: "invalid" };

  const [nome, foto] = await Promise.allSettled([
    buscarNome(gtin, signal),
    buscarFoto(gtin, signal),
  ]);
  const produto: ProdutoEncontrado = {
    nome: nome.status === "fulfilled" ? nome.value : null,
    foto: foto.status === "fulfilled" ? foto.value : null,
  };
  if (produto.nome || produto.foto) return { status: "found", produto };
  return nome.status === "rejected" && foto.status === "rejected"
    ? { status: "error" }
    : { status: "not_found" };
}
