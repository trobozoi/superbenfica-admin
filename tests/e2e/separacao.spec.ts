import { expect, type Page, test } from "@playwright/test";
import { credentials, SEED_USERS } from "./credentials";
import { loginAndWait } from "./fixtures";

const HEADERS = { "X-Requested-With": "XMLHttpRequest" };

/**
 * Simula a API de pedidos com um pedido em separação pelo usuário logado. O estado
 * dos itens fica no mock, então nada é gravado no banco real.
 */
async function mockPedidoEmSeparacao(page: Page, outroResponsavel = false) {
  const me = (await (
    await page.request.get("/api/proxy/usuarios/me", { headers: HEADERS })
  ).json()) as {
    id: number;
    nome: string;
  };
  const itens = [
    {
      id: 101,
      produto: 1,
      produto_nome: "Leite integral UHT 1L",
      produto_sku: "LEI-001",
      produto_codigo_barras: "7891000315507",
      quantidade: 6,
      preco_unitario: "5.49",
      subtotal: "32.94",
      separado: false,
    },
    {
      id: 102,
      produto: 2,
      produto_nome: "Pão francês",
      produto_sku: "PAO-001",
      produto_codigo_barras: "",
      quantidade: 10,
      preco_unitario: "0.80",
      subtotal: "8.00",
      separado: false,
    },
  ];
  const pedido = {
    id: 900,
    codigo: "PED-E2E00001",
    cliente: 1,
    cliente_nome: "Cliente E2E",
    loja: 1,
    loja_nome: "Super Benfica Centro",
    status: "EM_SEPARACAO",
    forma_pagamento: 1,
    forma_pagamento_nome: "Pix",
    observacao: "",
    itens,
    total: "40.94",
    separacoes: [
      {
        id: 77,
        pedido: 900,
        pedido_codigo: "PED-E2E00001",
        usuario: outroResponsavel ? me.id + 1000 : me.id,
        usuario_nome: me.nome,
        status: "EM_ANDAMENTO",
        data_inicio: "2026-10-03T10:00:00Z",
        data_conclusao: null,
      },
    ],
    data_criacao: "2026-10-03T09:55:00Z",
    data_atualizacao: "2026-10-03T10:00:00Z",
  };

  const marcacoes: unknown[] = [];
  let concluiu = false;
  await page.route(
    (url) => url.pathname === "/api/proxy/pedidos",
    (route) => {
      const emSeparacao =
        new URL(route.request().url()).searchParams.get("status") === "EM_SEPARACAO";
      const results = emSeparacao ? [pedido] : [];
      return route.fulfill({
        json: { count: results.length, next: null, previous: null, results },
      });
    },
  );
  await page.route("**/api/proxy/separacoes/77/marcar-item", (route) => {
    const body = route.request().postDataJSON() as { item: number; separado: boolean };
    marcacoes.push(body);
    const item = itens.find((candidato) => candidato.id === body.item);
    if (!item)
      return route.fulfill({ status: 400, json: { item: ["Este item não pertence ao pedido."] } });
    item.separado = body.separado;
    return route.fulfill({ json: item });
  });
  await page.route("**/api/proxy/separacoes/77/concluir", (route) => {
    concluiu = true;
    return route.fulfill({ json: { ...pedido.separacoes[0], status: "CONCLUIDA" } });
  });
  return { marcacoes, concluiu: () => concluiu };
}

test.describe("Checklist da separação", () => {
  test("separador marca itens pela caixa e pelo leitor; só conclui com tudo marcado", async ({
    page,
  }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.separador));
    const api = await mockPedidoEmSeparacao(page);
    await page.goto("/separacao");

    const coluna = page.getByRole("region", { name: "Em separação" });
    await expect(coluna.getByText("PED-E2E00001", { exact: true })).toBeVisible();
    await expect(coluna.getByText("0 de 2 separados")).toBeVisible();
    await expect(coluna.getByText("7891000315507")).toBeVisible();
    await expect(coluna.getByText("sem código de barras")).toBeVisible();

    const concluir = coluna.getByRole("button", { name: "Concluir separação" });
    await expect(concluir).toBeDisabled();
    await expect(
      coluna.getByText("Marque todos os itens para concluir a separação."),
    ).toBeVisible();

    // Leitor de código de barras: "digita" o código e tecla Enter.
    const leitor = coluna.getByRole("textbox", { name: "Bipar código de barras" });
    await leitor.fill("7891000315507");
    await leitor.press("Enter");
    const leite = coluna.getByRole("checkbox", { name: /Leite integral UHT 1L/ });
    await expect(leite).toBeChecked();
    await expect(leitor).toHaveValue("");
    await expect(coluna.getByText("1 de 2 separados")).toBeVisible();

    // Código que não está no pedido só avisa.
    await leitor.fill("7890000000000");
    await leitor.press("Enter");
    await expect(
      page.getByText("Nenhum item deste pedido tem o código 7890000000000."),
    ).toBeVisible();

    // Produto sem código: marca pela caixa de seleção.
    await coluna.getByRole("checkbox", { name: /Pão francês/ }).check();
    await expect(coluna.getByText("2 de 2 separados")).toBeVisible();
    await expect(concluir).toBeEnabled();

    // Desmarcar volta a bloquear a conclusão.
    await leite.uncheck();
    await expect(concluir).toBeDisabled();
    await leite.check();
    await expect(concluir).toBeEnabled();

    expect(api.marcacoes).toEqual([
      { item: 101, separado: true },
      { item: 102, separado: true },
      { item: 101, separado: false },
      { item: 101, separado: true },
    ]);
    await concluir.click();
    await expect.poll(api.concluiu).toBe(true);
  });

  test("outro separador vê o checklist, mas não marca", async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.separador));
    await mockPedidoEmSeparacao(page, true);
    await page.goto("/separacao");

    const coluna = page.getByRole("region", { name: "Em separação" });
    await expect(coluna.getByRole("checkbox", { name: /Leite integral UHT 1L/ })).toBeDisabled();
    await expect(coluna.getByRole("textbox", { name: "Bipar código de barras" })).toHaveCount(0);
  });
});
