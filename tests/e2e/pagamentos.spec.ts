import { expect, test } from "@playwright/test";
import { credentials, SEED_USERS } from "./credentials";
import { loginAndWait } from "./fixtures";

test.describe("Cadastro de formas de pagamento", () => {
  test("ADMIN lista, cadastra, edita e desativa (gravações interceptadas)", async ({ page }) => {
    await loginAndWait(page, credentials.admin());
    await page.getByRole("link", { name: "Formas de pagamento" }).click();
    await expect(page.getByRole("heading", { name: "Formas de pagamento" })).toBeVisible();

    // Formas da carga inicial, vindas da API real, na ordem de exibição.
    await expect(page.getByRole("row", { name: /Pix/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Dinheiro/ })).toBeVisible();

    // Intercepta as gravações para não alterar o banco real.
    const enviados: { method: string; url: string; body: unknown }[] = [];
    await page.route("**/api/proxy/formas-pagamento**", async (route) => {
      const request = route.request();
      if (request.method() === "GET") return route.continue();
      const body = request.method() === "DELETE" ? null : request.postDataJSON();
      enviados.push({ method: request.method(), url: request.url(), body });
      if (request.method() === "DELETE") return route.fulfill({ status: 204 });
      return route.fulfill({ status: 201, json: { id: 999, tipo_display: "", ...body } });
    });

    // Nova forma: validação e sugestão de troco ao escolher Dinheiro.
    await page.getByRole("button", { name: "Nova forma de pagamento" }).click();
    const dialog = page.getByRole("dialog", { name: "Nova forma de pagamento" });
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog.getByText("Campo obrigatório.")).toBeVisible();
    await dialog.getByLabel("Nome").fill("Dinheiro (troco até R$ 100)");
    await dialog.getByLabel("Tipo").selectOption("DINHEIRO");
    await expect(dialog.getByLabel("Permite troco")).toBeChecked();
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog).toBeHidden();
    expect(enviados[0]).toMatchObject({
      method: "POST",
      body: {
        nome: "Dinheiro (troco até R$ 100)",
        tipo: "DINHEIRO",
        permite_troco: true,
        ativa: true,
      },
    });
    expect((enviados[0]?.body as { ordem: number }).ordem).toBeGreaterThan(0);

    // Edição.
    await page.getByRole("button", { name: "Editar Pix" }).click();
    const edicao = page.getByRole("dialog", { name: "Editar forma de pagamento" });
    await expect(edicao.getByLabel("Nome")).toHaveValue("Pix");
    await edicao.getByLabel("Nome").fill("Pix (QR Code)");
    await edicao.getByRole("button", { name: "Salvar" }).click();
    await expect(edicao).toBeHidden();
    expect(enviados[1]).toMatchObject({ body: { nome: "Pix (QR Code)", tipo: "PIX" } });
    expect(enviados[1]?.url).toMatch(/formas-pagamento\/\d+$/);

    // Desativar pede confirmação.
    await page.getByRole("button", { name: "Desativar Pix" }).click();
    const confirmar = page.getByRole("dialog", { name: "Desativar Pix?" });
    await confirmar.getByRole("button", { name: "Desativar" }).click();
    await expect(page.getByText("Forma de pagamento desativada.")).toBeVisible();
    expect(enviados[2]?.method).toBe("DELETE");
  });

  test("GERENTE só consulta", async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.gerente));
    await page.goto("/formas-pagamento");
    await expect(page.getByRole("row", { name: /Pix/ })).toBeVisible();
    await expect(page.getByText("Somente o administrador cadastra")).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova forma de pagamento" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Editar Pix" })).toHaveCount(0);
  });

  test("CAIXA não acessa a tela", async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.caixa));
    await expect(page.getByRole("link", { name: "Formas de pagamento" })).toHaveCount(0);
    await page.goto("/formas-pagamento");
    await expect(page).toHaveURL(/acesso-negado/);
  });
});
