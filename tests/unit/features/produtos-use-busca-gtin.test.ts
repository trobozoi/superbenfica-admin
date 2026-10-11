import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BuscaGtinResult, ProdutoEncontrado } from "@/features/produtos/busca-gtin";
import { useBuscaGtin } from "@/features/produtos/use-busca-gtin";

const buscarProdutoPorGtin =
  vi.fn<(value: string, signal?: AbortSignal) => Promise<BuscaGtinResult>>();

vi.mock("@/features/produtos/busca-gtin", () => ({
  buscarProdutoPorGtin: (value: string, signal?: AbortSignal) =>
    buscarProdutoPorGtin(value, signal),
}));

const GTIN = "7891000100103";
const OUTRO_GTIN = "7894900011517";
const PRODUTO: ProdutoEncontrado = { nome: "Leite Condensado 395 g", foto: null };

function setup(preencher = vi.fn(() => true)) {
  const hook = renderHook(() => useBuscaGtin(preencher));
  return { ...hook, preencher };
}

/** Deixa as promessas pendentes (a busca mockada) terminarem dentro do act. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  buscarProdutoPorGtin.mockResolvedValue({ status: "found", produto: PRODUTO });
});

afterEach(() => {
  vi.useRealTimers();
  buscarProdutoPorGtin.mockReset();
});

describe("useBuscaGtin", () => {
  it("começa parado", () => {
    const { result } = setup();
    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("busca depois da espera quando o código fica válido e preenche o formulário", async () => {
    const { result, preencher } = setup();

    act(() => result.current.onCodigoChange(GTIN));
    expect(buscarProdutoPorGtin).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(buscarProdutoPorGtin).toHaveBeenCalledWith(GTIN, expect.any(AbortSignal));
    expect(preencher).toHaveBeenCalledWith(PRODUTO);
    expect(result.current.state).toEqual({ status: "found", preencheu: true });
  });

  it("informa quando o produto foi encontrado mas nada foi preenchido", async () => {
    const { result } = setup(vi.fn(() => false));

    act(() => result.current.onCodigoChange(GTIN, true));
    await flush();

    expect(result.current.state).toEqual({ status: "found", preencheu: false });
  });

  it("busca na hora quando o leitor tecla Enter", async () => {
    const { result } = setup();

    act(() => result.current.onCodigoChange(GTIN, true));
    expect(result.current.state).toEqual({ status: "loading" });
    await flush();

    expect(buscarProdutoPorGtin).toHaveBeenCalledTimes(1);
  });

  it("repassa os status sem produto", async () => {
    buscarProdutoPorGtin.mockResolvedValue({ status: "not_found" });
    const { result, preencher } = setup();

    act(() => result.current.onCodigoChange(GTIN, true));
    await flush();

    expect(result.current.state).toEqual({ status: "not_found" });
    expect(preencher).not.toHaveBeenCalled();
  });

  it("não busca de novo o mesmo código", async () => {
    const { result } = setup();

    act(() => result.current.onCodigoChange(GTIN, true));
    await flush();
    act(() => result.current.onCodigoChange(GTIN, true));
    await flush();

    expect(buscarProdutoPorGtin).toHaveBeenCalledTimes(1);
  });

  it("volta a parado e cancela a busca quando o código deixa de ser válido", async () => {
    let signal: AbortSignal | undefined;
    buscarProdutoPorGtin.mockImplementation((_value, s) => {
      signal = s;
      return new Promise(() => {});
    });
    const { result } = setup();

    act(() => result.current.onCodigoChange(GTIN, true));
    act(() => result.current.onCodigoChange("789"));

    expect(signal?.aborted).toBe(true);
    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("cancela a espera quando o código muda antes de buscar", async () => {
    const { result } = setup();

    act(() => result.current.onCodigoChange(GTIN));
    act(() => result.current.onCodigoChange(OUTRO_GTIN));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(buscarProdutoPorGtin).toHaveBeenCalledTimes(1);
    expect(buscarProdutoPorGtin).toHaveBeenCalledWith(OUTRO_GTIN, expect.any(AbortSignal));
  });

  it("ignora o resultado de uma busca substituída por outra", async () => {
    let resolverPrimeira: (r: BuscaGtinResult) => void = () => {};
    buscarProdutoPorGtin
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolverPrimeira = resolve;
          }),
      )
      .mockResolvedValueOnce({ status: "not_found" });
    const { result, preencher } = setup();

    act(() => result.current.onCodigoChange(GTIN, true));
    act(() => result.current.onCodigoChange(OUTRO_GTIN, true));
    await flush();
    await act(async () => {
      resolverPrimeira({ status: "found", produto: PRODUTO });
      await Promise.resolve();
    });

    expect(preencher).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({ status: "not_found" });
  });

  it("botão Buscar busca de novo o mesmo código", async () => {
    const { result } = setup();

    act(() => result.current.onCodigoChange(GTIN, true));
    await flush();
    act(() => result.current.buscarAgora(GTIN));
    await flush();

    expect(buscarProdutoPorGtin).toHaveBeenCalledTimes(2);
  });

  it("botão Buscar com código inválido avisa sem buscar", () => {
    const { result } = setup();

    act(() => result.current.buscarAgora("123"));

    expect(buscarProdutoPorGtin).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({ status: "invalid" });
  });

  it("reset cancela a espera e volta a parado", async () => {
    const { result } = setup();

    act(() => result.current.onCodigoChange(GTIN));
    act(() => result.current.reset());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(buscarProdutoPorGtin).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("depois do reset o mesmo código pode ser buscado de novo", async () => {
    const { result } = setup();

    act(() => result.current.onCodigoChange(GTIN, true));
    await flush();
    act(() => result.current.reset());
    act(() => result.current.onCodigoChange(GTIN, true));
    await flush();

    expect(buscarProdutoPorGtin).toHaveBeenCalledTimes(2);
  });

  it("cancela a busca pendente ao desmontar", () => {
    let signal: AbortSignal | undefined;
    buscarProdutoPorGtin.mockImplementation((_value, s) => {
      signal = s;
      return new Promise(() => {});
    });
    const { result, unmount } = setup();

    act(() => result.current.onCodigoChange(GTIN, true));
    unmount();

    expect(signal?.aborted).toBe(true);
  });
});
