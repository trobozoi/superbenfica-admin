/** Tamanhos aceitos: EAN-8, UPC-A (12), EAN-13 e GTIN-14. */
const TAMANHOS_GTIN = new Set([8, 12, 13, 14]);
const SOMENTE_DIGITOS = /^\d+$/;

/**
 * Valida um código de barras GTIN pelo dígito verificador (mesma regra da API em
 * superbenfica-api/apps/produtos/validators.py).
 */
export function gtinValido(valor: string): boolean {
  if (!TAMANHOS_GTIN.has(valor.length) || !SOMENTE_DIGITOS.test(valor)) return false;
  const digitos = [...valor].map(Number);
  const verificador = digitos.pop();
  // Da direita para a esquerda (sem o verificador), os pesos alternam 3, 1, 3, 1...
  const soma = digitos
    .reverse()
    .reduce((total, digito, indice) => total + digito * (indice % 2 === 0 ? 3 : 1), 0);
  return (10 - (soma % 10)) % 10 === verificador;
}

/** Remove espaços e qualquer caractere que não seja dígito (leitores às vezes enviam sufixos). */
export function limparCodigoBarras(valor: string): string {
  return valor.replaceAll(/\D/g, "");
}
