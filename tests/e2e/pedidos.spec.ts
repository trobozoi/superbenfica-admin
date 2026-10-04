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
