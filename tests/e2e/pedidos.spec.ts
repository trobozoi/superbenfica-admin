import { expect, test } from "@playwright/test";
import { credentials, SEED_USERS } from "./credentials";
import { loginAndWait } from "./fixtures";

test.describe("Novo pedido com busca dentro da lista", () => {
  test("busca cliente e produto dentro do combobox e envia o pedido", async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.caixa));
    await page.goto("/pedidos");
    await page.getByRole("button", { name: "Novo pedido" }).click();
    const dialog = page.getByRole("dialog", { name: "Novo pedido" });

    // Cliente: abre a lista, digita na busca interna (API real, ?search=) e escolhe.
    await dialog.getByRole("combobox", { name: "Cliente" }).click();
    const busca = page.getByPlaceholder("Buscar cliente por nome ou e-mail");
    await expect(busca).toBeFocused();
    await busca.fill("beatriz");
    await page.getByRole("option", { name: /Beatriz Gomes/ }).click();
    await expect(dialog.getByRole("combobox", { name: "Cliente" })).toHaveText("Beatriz Gomes");

    // Produto: navegação só pelo teclado (digitar + Enter).
    await dialog.getByRole("combobox", { name: "Produto" }).click();
    await page.getByPlaceholder("Buscar produto por nome ou SKU").fill("leite");
    await expect(page.getByRole("option", { name: /Leite integral UHT/ })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(dialog.getByRole("combobox", { name: "Produto" })).toHaveText(
      /Leite integral UHT/,
    );

    // Busca sem resultado mostra o aviso dentro da lista.
    await dialog.getByRole("combobox", { name: "Cliente" }).click();
    await page.getByPlaceholder("Buscar cliente por nome ou e-mail").fill("zzzz-inexistente");
    await expect(page.getByText("Nenhum cliente encontrado.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog.getByRole("combobox", { name: "Cliente" })).toHaveText("Beatriz Gomes");

    // Forma de pagamento é obrigatória: sem ela o pedido não é enviado.
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog.getByLabel("Forma de pagamento")).toHaveAttribute("aria-invalid", "true");
    const forma = dialog.getByLabel("Forma de pagamento");
    await expect(forma.getByRole("option", { name: "Pix" })).toBeAttached();
    await forma.selectOption({ label: "Dinheiro" });
    await expect(
      dialog.getByText("Precisa de troco? Informe o valor na observação."),
    ).toBeVisible();

    // Intercepta a gravação para não criar pedidos (nem baixar estoque) no banco real.
    let payload: unknown;
    await page.route("**/api/proxy/pedidos", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      payload = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { id: 1 } });
    });
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog).toBeHidden();
    expect(payload).toMatchObject({
      cliente: expect.any(Number),
      loja: 1,
      forma_pagamento: expect.any(Number),
      itens: [{ produto: expect.any(Number), quantidade: 1 }],
    });
  });
});

test.describe("Forma de entrega do pedido", () => {
  const ENDERECO = "Rua São José, 100 (Apto 2) - Centro, Fortaleza/CE - CEP 60060-170";
  const pedidoEntrega = {
    id: 9001,
    codigo: "PED-E2EENTRG",
    cliente: 1,
    cliente_nome: "Cliente Entrega",
    loja: 1,
    loja_nome: "Super Benfica Centro",
    status: "PENDENTE",
    forma_pagamento: 1,
    forma_pagamento_nome: "Pix",
    tipo_entrega: "DOMICILIO",
    endereco_entrega: ENDERECO,
    observacao: "",
    itens: [
      {
        id: 1,
        produto: 1,
        produto_nome: "Leite integral UHT 1L",
        produto_sku: "LAT-0001",
        produto_codigo_barras: "",
        quantidade: 2,
        preco_unitario: "5.49",
        subtotal: "10.98",
        separado: false,
      },
    ],
    total: "10.98",
    separacoes: [],
    data_criacao: "2026-10-06T10:00:00-03:00",
    data_atualizacao: "2026-10-06T10:00:00-03:00",
  };

  test("lista, filtra e detalha um pedido com entrega em domicílio", async ({ page }) => {
    // Pedido simulado: não depende de existir um pedido de entrega no banco real.
    const filtros: (string | null)[] = [];
    await page.route("**/api/proxy/pedidos?*", async (route) => {
      filtros.push(new URL(route.request().url()).searchParams.get("tipo_entrega"));
      return route.fulfill({
        json: { count: 1, next: null, previous: null, results: [pedidoEntrega] },
      });
    });
    await page.route("**/api/proxy/pedidos/9001", (route) =>
      route.fulfill({ json: pedidoEntrega }),
    );

    await loginAndWait(page, credentials.seed(SEED_USERS.gerente));
    await page.goto("/pedidos");
    const linha = page.getByRole("row", { name: /PED-E2EENTRG/ });
    await expect(linha.getByText("Entrega em domicílio")).toBeVisible();

    await page
      .getByLabel("Entrega", { exact: true })
      .selectOption({ label: "Entrega em domicílio" });
    await expect.poll(() => filtros.at(-1)).toBe("DOMICILIO");

    await linha.getByRole("button", { name: "Detalhes PED-E2EENTRG" }).click();
    const dialog = page.getByRole("dialog", { name: "PED-E2EENTRG" });
    await expect(dialog.getByText("Entrega em domicílio")).toBeVisible();
    await expect(dialog.getByText(ENDERECO)).toBeVisible();
  });
});
