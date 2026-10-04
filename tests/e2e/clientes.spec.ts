import { expect, test } from "@playwright/test";
import { credentials, SEED_USERS } from "./credentials";
import { loginAndWait } from "./fixtures";

test.describe("Cadastro de clientes com endereço pelo CEP", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.caixa));
    await page.goto("/clientes");
    await page.getByRole("button", { name: "Novo cliente" }).click();
  });

  test("preenche o endereço pelo ViaCEP e envia cliente + endereço", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome").fill("Cliente E2E");
    await dialog.getByLabel("E-mail").fill("cliente.e2e@exemplo.com");
    await dialog.getByLabel("Telefone").pressSequentially("85999998888");
    await expect(dialog.getByLabel("Telefone")).toHaveValue("(85) 99999-8888");

    // Digitado sem hífen: a máscara formata e a busca dispara com 8 dígitos (ViaCEP real).
    await dialog.getByLabel("CEP").pressSequentially("60020181");
    await expect(dialog.getByLabel("CEP")).toHaveValue("60020-181");
    await expect(dialog.getByLabel("Logradouro")).toHaveValue("Avenida da Universidade");
    await expect(dialog.getByLabel("Bairro")).toHaveValue("Benfica");
    await expect(dialog.getByLabel("Cidade")).toHaveValue("Fortaleza");
    await expect(dialog.getByRole("combobox", { name: "UF" })).toHaveText("CE");
    await expect(dialog.getByLabel("Número")).toBeFocused();
    // A faixa do CEP vira dica; o campo Complemento continua livre para o imóvel.
    await expect(dialog.getByText(/Faixa deste CEP/)).toBeVisible();
    await expect(dialog.getByLabel("Complemento")).toHaveValue("");

    await dialog.getByLabel("Número").fill("2850");

    // Intercepta a gravação para não criar dados de teste no banco real.
    const payloads: Record<string, unknown> = {};
    await page.route("**/api/proxy/clientes", async (route) => {
      payloads.cliente = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        json: {
          id: 999,
          usuario: null,
          data_cadastro: "2026-10-02T00:00:00Z",
          enderecos: [],
          ...(payloads.cliente as object),
        },
      });
    });
    await page.route("**/api/proxy/enderecos", async (route) => {
      payloads.endereco = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: { id: 1, ...(payloads.endereco as object) } });
    });
    await dialog.getByRole("button", { name: "Salvar" }).click();

    await expect(dialog).toBeHidden();
    expect(payloads.cliente).toMatchObject({
      telefone: "(85) 99999-8888",
      nome: "Cliente E2E",
      email: "cliente.e2e@exemplo.com",
    });
    expect(payloads.endereco).toEqual({
      cep: "60020-181",
      endereco: "Avenida da Universidade",
      numero: "2850",
      complemento: "",
      bairro: "Benfica",
      cidade: "Fortaleza",
      estado: "CE",
      cliente: 999,
      principal: true,
    });
  });

  test("UF pode ser buscada pelo nome do estado", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox", { name: "UF" }).click();
    await page.getByPlaceholder("Buscar estado").fill("ceará");
    await page.getByRole("option", { name: /Ceará/ }).click();
    await expect(dialog.getByRole("combobox", { name: "UF" })).toHaveText("CE");
  });

  test("telefone incompleto é recusado", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome").fill("Cliente E2E");
    await dialog.getByLabel("E-mail").fill("cliente.e2e@exemplo.com");
    await dialog.getByLabel("Telefone").fill("8532");
    await expect(dialog.getByLabel("Telefone")).toHaveValue("(85) 32");
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog.getByText(/Informe o telefone com DDD/)).toBeVisible();
  });

  test("CEP inexistente avisa e deixa preencher manualmente", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("CEP").pressSequentially("99999999");
    await expect(
      dialog.getByText("CEP não encontrado. Preencha o endereço manualmente."),
    ).toBeVisible();
    await expect(dialog.getByLabel("Logradouro")).toBeEditable();
  });

  test("endereço incompleto é barrado antes de chamar a API", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome").fill("Cliente E2E");
    await dialog.getByLabel("E-mail").fill("cliente.e2e@exemplo.com");
    await dialog.getByLabel("Logradouro").fill("Rua Sem CEP");
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog.getByText("Informe um CEP válido (00000-000).")).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});
