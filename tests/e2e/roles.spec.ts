import { expect, test } from "@playwright/test";
import { credentials, SEED_USERS } from "./credentials";
import { loginAndWait } from "./fixtures";

test.describe("Visões por perfil", () => {
  test("ADMIN vê KPIs, gráficos e todo o menu", async ({ page }) => {
    await loginAndWait(page, credentials.admin());
    await expect(page.getByRole("heading", { name: "Pedidos por status" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Faturamento por filial" })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Principal" }).first();
    await expect(nav.getByRole("link", { name: "Configurações" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Filial" })).toBeVisible();
  });

  test("SEPARADOR vê a visão operacional e não acessa configurações", async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.separador));
    await expect(page.getByText("Aguardando separação")).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Principal" }).first();
    await expect(nav.getByRole("link", { name: "Fila de separação" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Configurações" })).toHaveCount(0);

    await page.goto("/configuracoes");
    await expect(page).toHaveURL(/\/acesso-negado/);
    await expect(page.getByRole("heading", { name: "Acesso negado" })).toBeVisible();
  });

  test("CAIXA não acessa relatórios", async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.caixa));
    await page.goto("/relatorios");
    await expect(page).toHaveURL(/\/acesso-negado/);
  });

  test("GERENTE: formulários já vêm com a filial dele selecionada", async ({ page }) => {
    // Regressão: o select não controlado ficava vazio quando as filiais chegavam depois.
    await loginAndWait(page, credentials.seed(SEED_USERS.gerente));
    await page.goto("/configuracoes");
    await page.getByRole("button", { name: "Novo usuário" }).click();
    const filial = page.getByRole("dialog").getByLabel("Filial");
    await expect(filial.locator("option:checked")).toHaveText("Super Benfica Centro");
    await expect(filial).toBeDisabled();
  });

  test("GERENTE lista produtos vindos da API", async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.gerente));
    await page.goto("/produtos");
    await expect(page.getByRole("heading", { name: "Produtos" })).toBeVisible();
    await expect(page.getByRole("row").nth(1)).toBeVisible();
    await expect(page.getByRole("button", { name: "Novo produto" })).toBeVisible();
  });
});
