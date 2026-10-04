import { expect, type Page, test } from "@playwright/test";
import { credentials, SEED_USERS } from "./credentials";
import { loginAndWait } from "./fixtures";

/** Intercepta as gravações para não criar dados no banco real; devolve o que foi enviado. */
async function captureSaves(page: Page) {
  const sent: { produto?: unknown; estoques: unknown[] } = { estoques: [] };
  await page.route("**/api/proxy/produtos", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sent.produto = route.request().postDataJSON();
    return route.fulfill({
      status: 201,
      json: { id: 999, data_criacao: "", data_atualizacao: "", ...(sent.produto as object) },
    });
  });
  await page.route("**/api/proxy/estoques", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const body = route.request().postDataJSON() as object;
    sent.estoques.push(body);
    return route.fulfill({ status: 201, json: { id: 1, ...body } });
  });
  return sent;
}

async function openNovoProduto(page: Page) {
  await page.goto("/produtos");
  await page.getByRole("button", { name: "Novo produto" }).click();
  const dialog = page.getByRole("dialog", { name: "Novo produto" });
  await dialog.getByLabel("Nome").fill("Produto E2E");
  await dialog.getByLabel("SKU").fill("E2E-001");
  await dialog.getByLabel("Preço").fill("9,90");
  return dialog;
}

test.describe("Cadastro de produto com estoque mínimo por filial", () => {
  test("GERENTE informa estoque inicial e mínimo só da própria filial", async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.gerente));
    const dialog = await openNovoProduto(page);

    const centro = dialog.getByRole("group", { name: "Super Benfica Centro" });
    await expect(centro).toBeVisible();
    await expect(dialog.getByRole("group", { name: "Super Benfica Aldeota" })).toHaveCount(0);
    await centro.getByLabel("Estoque inicial").fill("120");
    await centro.getByLabel("Quantidade mínima").fill("20");

    const sent = await captureSaves(page);
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog).toBeHidden();
    expect(sent.produto).toMatchObject({ nome: "Produto E2E", sku: "E2E-001", preco: "9.90" });
    expect(sent.estoques).toEqual([
      { produto: 999, loja: 1, quantidade: 120, quantidade_minima: 20 },
    ]);
  });

  test("ADMIN vê todas as filiais e mínimo negativo é recusado", async ({ page }) => {
    await loginAndWait(page, credentials.admin());
    const dialog = await openNovoProduto(page);
    await expect(dialog.getByRole("group")).toHaveCount(3);

    const aldeota = dialog.getByRole("group", { name: "Super Benfica Aldeota" });
    await aldeota.getByLabel("Quantidade mínima").fill("-5");
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(aldeota.getByText("Informe um valor igual ou maior que zero.")).toBeVisible();
  });

  test("código de barras: valida o dígito verificador e o Enter do leitor não envia", async ({
    page,
  }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.gerente));
    const dialog = await openNovoProduto(page);
    const sent = await captureSaves(page);
    const codigo = dialog.getByLabel("Código de barras");

    // O leitor "digita" e tecla Enter: o formulário continua aberto.
    await codigo.fill("7891000315508");
    await codigo.press("Enter");
    await expect(dialog).toBeVisible();
    expect(sent.produto).toBeUndefined();

    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog.getByText(/Código de barras inválido/)).toBeVisible();
    expect(sent.produto).toBeUndefined();

    await codigo.fill("7891000315507");
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog).toBeHidden();
    expect(sent.produto).toMatchObject({ sku: "E2E-001", codigo_barras: "7891000315507" });
  });

  test("na edição mostra o saldo atual e permite mudar só o mínimo", async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.gerente));
    await page.goto("/produtos");
    await page
      .getByRole("button", { name: /^Editar/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: "Editar produto" });
    const centro = dialog.getByRole("group", { name: "Super Benfica Centro" });
    await expect(centro.getByText("Saldo atual")).toBeVisible();
    await expect(centro.getByLabel("Estoque inicial")).toHaveCount(0);
    await expect(centro.getByLabel("Quantidade mínima")).not.toHaveValue("");
  });

  test("foto: envio real para a API, miniatura na lista e remoção", async ({ page }) => {
    await loginAndWait(page, credentials.seed(SEED_USERS.gerente));
    const headers = { "X-Requested-With": "XMLHttpRequest" };
    const lista = await page.request.get("/api/proxy/produtos?ordering=nome", { headers });
    const { results } = (await lista.json()) as {
      results: { id: number; nome: string; foto: string | null }[];
    };
    const alvo = results.find((item) => !item.foto);
    // Usa um produto sem foto para não sobrescrever fotos reais.
    if (!alvo) throw new Error("A carga inicial precisa de ao menos um produto sem foto.");

    try {
      await page.goto(`/produtos`);
      await page.getByRole("button", { name: `Editar ${alvo.nome}` }).click();
      const dialog = page.getByRole("dialog", { name: "Editar produto" });

      // Arquivo inválido é barrado no navegador.
      await dialog.getByLabel("Foto").setInputFiles({
        name: "doc.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4"),
      });
      await expect(dialog.getByRole("alert")).toHaveText(
        "Formato não aceito. Use JPEG, PNG ou WebP.",
      );

      await dialog
        .getByLabel("Foto")
        .setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: PNG });
      await expect(dialog.getByRole("img", { name: "Foto do produto" })).toBeVisible();
      await dialog.getByRole("button", { name: "Salvar" }).click();
      await expect(dialog).toBeHidden();

      // A miniatura vem de /api/media (mesma origem) e a imagem realmente carrega.
      const row = page.getByRole("row", { name: new RegExp(alvo.nome) });
      const thumb = row.getByRole("img", { name: alvo.nome });
      await expect(thumb).toHaveAttribute("src", /^\/api\/media\/produtos\/[0-9a-f]+\.webp$/);
      await expect
        .poll(() => thumb.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);

      // Remove pela interface.
      await page.getByRole("button", { name: `Editar ${alvo.nome}` }).click();
      await dialog.getByRole("button", { name: "Remover" }).click();
      await dialog.getByRole("button", { name: "Salvar" }).click();
      await expect(dialog).toBeHidden();
      await expect(row.getByRole("img", { name: alvo.nome })).toHaveCount(0);
    } finally {
      // Garante o estado original mesmo se o teste falhar no meio.
      await page.request.delete(`/api/proxy/produtos/${alvo.id}/foto`, { headers });
    }
  });
});

/** PNG 8x8 válido (gerado com Pillow), gerado em memória (sem depender de arquivo no repositório). */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGM8ISfHgA0wYRUdtBIA0MoBFD5jqJkAAAAASUVORK5CYII=",
  "base64",
);
