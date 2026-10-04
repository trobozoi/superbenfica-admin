import { expect, test } from "@playwright/test";
import { credentials, SEED_USERS } from "./credentials";
import { login, loginAndWait } from "./fixtures";

test.describe("Autenticação contra a API real", () => {
  test("redireciona para o login quem não está autenticado", async ({ page }) => {
    await page.goto("/produtos");
    await expect(page).toHaveURL(/\/login\?next=%2Fprodutos/);
  });

  test("login inválido mostra erro e não cria sessão", async ({ page }) => {
    await login(page, { email: "ninguem@superbenfica.com.br", password: "senha-errada" });
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("validação do formulário antes de chamar a API", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(page.getByText("Campo obrigatório.")).toBeVisible();
  });

  test("login válido carrega o dashboard e guarda tokens só em cookies httpOnly", async ({
    page,
    context,
  }) => {
    await loginAndWait(page, credentials.admin());
    const cookies = await context.cookies();
    const access = cookies.find((cookie) => cookie.name === "sb_access");
    expect(access?.httpOnly).toBe(true);
    expect(access?.sameSite).toBe("Lax");
    const storage = await page.evaluate(() => JSON.stringify(localStorage));
    expect(storage).not.toMatch(/eyJ/); // nenhum JWT no localStorage
  });

  test("salvar senha: lembra só o e-mail no painel e preenche no próximo acesso", async ({
    page,
  }) => {
    const user = credentials.admin();
    await page.goto("/login");
    const lembrar = page.getByRole("checkbox", { name: "Salvar senha neste navegador" });
    await expect(lembrar).not.toBeChecked();
    await page.getByLabel("E-mail").fill(user.email);
    await page.getByLabel("Senha", { exact: true }).fill(user.password);
    await lembrar.check();
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/");

    // A senha nunca fica no armazenamento da página (ela vai para o gerenciador do navegador).
    const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    expect(storage).toContain(user.email);
    expect(storage).not.toContain(user.password);

    await page.context().clearCookies();
    await page.goto("/login");
    await expect(page.getByLabel("E-mail")).toHaveValue(user.email);
    await expect(lembrar).toBeChecked();
    await expect(page.getByLabel("Senha", { exact: true })).toBeFocused();

    // Desmarcar e entrar faz o painel esquecer o e-mail.
    await page.getByLabel("Senha", { exact: true }).fill(user.password);
    await lembrar.uncheck();
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/");
    expect(await page.evaluate(() => localStorage.getItem("sb_login_email"))).toBeNull();
  });

  test("refresh renova o access token usando o cookie", async ({ page, context }) => {
    await loginAndWait(page, credentials.admin());
    const before = (await context.cookies()).find((c) => c.name === "sb_access")?.value;
    const response = await page.request.post("/api/auth/refresh", {
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    expect(response.status()).toBe(200);
    const after = (await context.cookies()).find((c) => c.name === "sb_access")?.value;
    expect(after).toBeTruthy();
    expect(after).not.toBe(before);
  });

  test("refresh sem o cabeçalho anti-CSRF é recusado", async ({ page }) => {
    await loginAndWait(page, credentials.admin());
    const response = await page.request.post("/api/auth/refresh");
    expect(response.status()).toBe(403);
  });

  test("logout invalida a sessão", async ({ page }) => {
    await loginAndWait(page, credentials.admin());
    await page.getByTestId("user-menu").click();
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("perfil CLIENTE não entra no painel", async ({ page }) => {
    await login(page, credentials.seed(SEED_USERS.cliente));
    await expect(page.getByText(/não tem acesso ao painel/)).toBeVisible();
  });
});
