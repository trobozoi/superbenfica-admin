import { afterEach, describe, expect, it, vi } from "vitest";
import { buildEstoqueRows, ProdutoParcialError, salvarProduto } from "@/features/produtos/estoque";
import { produtoFormSchema } from "@/features/produtos/schemas";
import { estoquesApi, produtosApi } from "@/services/api";
import type { EstoqueLocal, Loja, Produto } from "@/types/api";

const loja = (id: number, nome: string): Loja => ({
  id,
  nome,
  endereco: "",
  horario_abertura: "07:00:00",
  horario_fechamento: "22:00:00",
  data_criacao: "",
  data_atualizacao: "",
});
const LOJAS = [loja(1, "Centro"), loja(2, "Aldeota")];

const estoqueCentro: EstoqueLocal = {
  id: 50,
  produto: 9,
  produto_nome: "Arroz",
  produto_sku: "ARZ",
  loja: 1,
  loja_nome: "Centro",
  quantidade: 30,
  quantidade_minima: 10,
  abaixo_do_minimo: false,
  data_atualizacao: "",
};

const produto: Produto = {
  id: 9,
  nome: "Arroz",
  sku: "ARZ",
  preco: "27.90",
  data_criacao: "",
  data_atualizacao: "",
};

const dados = { nome: "Arroz", sku: "ARZ", preco: "27,90", descricao: "", ativo: true };

describe("features/produtos/estoque", () => {
  afterEach(() => vi.restoreAllMocks());

  it("ADMIN recebe uma linha por filial, com o estoque existente quando houver", () => {
    expect(buildEstoqueRows(LOJAS, [estoqueCentro], null)).toEqual([
      {
        loja: 1,
        lojaNome: "Centro",
        estoqueId: 50,
        quantidade: 30,
        quantidade_minima: 10,
        minimoAtual: 10,
      },
      {
        loja: 2,
        lojaNome: "Aldeota",
        estoqueId: null,
        quantidade: 0,
        quantidade_minima: 0,
        minimoAtual: null,
      },
    ]);
  });

  it("gerente só vê a própria filial", () => {
    expect(buildEstoqueRows(LOJAS, [], 2).map((row) => row.lojaNome)).toEqual(["Aldeota"]);
  });

  it("na criação grava o produto e cria o estoque de cada filial", async () => {
    vi.spyOn(produtosApi, "create").mockResolvedValue(produto);
    const create = vi.spyOn(estoquesApi, "create").mockResolvedValue(estoqueCentro);
    const values = produtoFormSchema.parse({
      ...dados,
      estoques: buildEstoqueRows(LOJAS, [], null).map((row) => ({
        ...row,
        quantidade: "100",
        quantidade_minima: "15",
      })),
    });

    await expect(salvarProduto(undefined, values)).resolves.toEqual(produto);
    expect(create.mock.calls.map(([input]) => input)).toEqual([
      { produto: 9, loja: 1, quantidade: 100, quantidade_minima: 15 },
      { produto: 9, loja: 2, quantidade: 100, quantidade_minima: 15 },
    ]);
  });

  it("na edição só altera o mínimo que mudou e nunca o saldo", async () => {
    vi.spyOn(produtosApi, "update").mockResolvedValue(produto);
    const update = vi.spyOn(estoquesApi, "update").mockResolvedValue(estoqueCentro);
    const create = vi.spyOn(estoquesApi, "create").mockResolvedValue(estoqueCentro);
    const [centro, aldeota] = buildEstoqueRows(LOJAS, [estoqueCentro], null);

    await salvarProduto(9, produtoFormSchema.parse({ ...dados, estoques: [centro, aldeota] }));
    expect(update).not.toHaveBeenCalled(); // mínimo do Centro não mudou

    await salvarProduto(
      9,
      produtoFormSchema.parse({ ...dados, estoques: [{ ...centro, quantidade_minima: 20 }] }),
    );
    expect(update).toHaveBeenCalledWith(50, { quantidade_minima: 20 });
    expect(create).toHaveBeenCalledTimes(1); // só a Aldeota, na primeira gravação
  });

  it("recusa quantidades negativas ou fracionadas", () => {
    const [row] = buildEstoqueRows(LOJAS, [], 1);
    const negativo = produtoFormSchema.safeParse({
      ...dados,
      estoques: [{ ...row, quantidade_minima: "-1" }],
    });
    expect(negativo.error?.issues[0]?.message).toBe("naoNegativo");
    const fracao = produtoFormSchema.safeParse({
      ...dados,
      estoques: [{ ...row, quantidade: "1.5" }],
    });
    expect(fracao.error?.issues[0]?.message).toBe("integer");
  });

  it("falha do estoque preserva o produto já criado", async () => {
    vi.spyOn(produtosApi, "create").mockResolvedValue(produto);
    const apiError = new Error("403");
    vi.spyOn(estoquesApi, "create").mockRejectedValue(apiError);
    const values = produtoFormSchema.parse({
      ...dados,
      estoques: buildEstoqueRows(LOJAS, [], 1),
    });

    const error = await salvarProduto(undefined, values).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ProdutoParcialError);
    expect(error).toMatchObject({ produto, original: apiError, etapa: "estoque" });
  });
});

describe("features/produtos: foto", () => {
  afterEach(() => vi.restoreAllMocks());
  const values = () => produtoFormSchema.parse({ ...dados, estoques: [] });

  it("envia a foto nova depois de salvar o produto", async () => {
    vi.spyOn(produtosApi, "update").mockResolvedValue(produto);
    const comFoto = { ...produto, foto: "http://api/media/produtos/a.webp" };
    const enviar = vi.spyOn(produtosApi, "enviarFoto").mockResolvedValue(comFoto);
    const arquivo = new File(["x"], "foto.png", { type: "image/png" });

    await expect(salvarProduto(9, values(), arquivo)).resolves.toEqual(comFoto);
    expect(enviar).toHaveBeenCalledWith(9, arquivo);
  });

  it("remove a foto só quando o produto tinha uma", async () => {
    const remover = vi.spyOn(produtosApi, "removerFoto").mockResolvedValue();
    vi.spyOn(produtosApi, "update").mockResolvedValueOnce({
      ...produto,
      foto: "http://api/media/x.webp",
    });
    await expect(salvarProduto(9, values(), null)).resolves.toMatchObject({ foto: null });
    expect(remover).toHaveBeenCalledWith(9);

    vi.spyOn(produtosApi, "update").mockResolvedValue(produto); // agora sem foto
    await salvarProduto(9, values(), null);
    await salvarProduto(9, values(), undefined);
    expect(remover).toHaveBeenCalledTimes(1);
  });

  it("falha da foto preserva o produto salvo", async () => {
    vi.spyOn(produtosApi, "create").mockResolvedValue(produto);
    vi.spyOn(produtosApi, "enviarFoto").mockRejectedValue(new Error("400"));
    const error = await salvarProduto(undefined, values(), new File(["x"], "a.png")).catch(
      (caught: unknown) => caught,
    );
    expect(error).toMatchObject({ produto, etapa: "foto" });
  });
});
