"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gtinValido, limparCodigoBarras } from "@/lib/gtin";
import { type BuscaGtinResult, buscarProdutoPorGtin, type ProdutoEncontrado } from "./busca-gtin";

/** Espera o leitor (ou a digitação) terminar antes de buscar. */
const DEBOUNCE_MS = 400;

export type BuscaGtinState =
  | { status: "idle" }
  | { status: "loading" }
  | Exclude<BuscaGtinResult, { status: "found" }>
  | { status: "found"; preencheu: boolean };

/**
 * Busca o produto pelo código de barras assim que ele fica válido (com uma pequena espera),
 * na hora quando o leitor tecla Enter, ou pelo botão "Buscar". `preencher` decide o que aproveitar do resultado
 * e devolve se preencheu algum campo.
 */
export function useBuscaGtin(preencher: (produto: ProdutoEncontrado) => boolean) {
  const [state, setState] = useState<BuscaGtinState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimo = useRef<string | null>(null);
  const preencherRef = useRef(preencher);
  useEffect(() => {
    preencherRef.current = preencher;
  }, [preencher]);

  const cancelar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    controller.current?.abort();
  }, []);

  // Cancela a busca pendente ao fechar o formulário.
  useEffect(() => cancelar, [cancelar]);

  const buscar = useCallback(async (gtin: string) => {
    controller.current?.abort();
    controller.current = new AbortController();
    const { signal } = controller.current;
    ultimo.current = gtin;
    setState({ status: "loading" });
    const result = await buscarProdutoPorGtin(gtin, signal);
    if (signal.aborted) return;
    if (result.status === "found") {
      setState({ status: "found", preencheu: preencherRef.current(result.produto) });
    } else {
      setState(result);
    }
  }, []);

  /** Chamar a cada mudança do campo; `imediato` = Enter do leitor. */
  const onCodigoChange = useCallback(
    (value: string, imediato = false) => {
      const gtin = limparCodigoBarras(value);
      if (timer.current) clearTimeout(timer.current);
      if (!gtinValido(gtin)) {
        controller.current?.abort();
        ultimo.current = null;
        setState({ status: "idle" });
        return;
      }
      if (gtin === ultimo.current) return;
      if (imediato) void buscar(gtin);
      else timer.current = setTimeout(() => void buscar(gtin), DEBOUNCE_MS);
    },
    [buscar],
  );

  /** Botão "Buscar": busca de novo mesmo que o código já tenha sido buscado. */
  const buscarAgora = useCallback(
    (value: string) => {
      const gtin = limparCodigoBarras(value);
      if (timer.current) clearTimeout(timer.current);
      if (gtinValido(gtin)) void buscar(gtin);
      else setState({ status: "invalid" });
    },
    [buscar],
  );

  const reset = useCallback(() => {
    cancelar();
    ultimo.current = null;
    setState({ status: "idle" });
  }, [cancelar]);

  return { state, onCodigoChange, buscarAgora, reset };
}
