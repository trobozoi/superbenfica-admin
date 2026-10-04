/**
 * "Salvar senha": a senha vai para o gerenciador de senhas do navegador (criptografado
 * por ele), nunca para o localStorage. O painel só lembra o e-mail, para preencher o campo.
 */

const EMAIL_KEY = "sb_login_email";

type PasswordCredentialCtor = new (data: { id: string; password: string }) => Credential;

/** API de credenciais (Chrome/Edge). Nos demais navegadores, o próprio navegador oferece salvar. */
function passwordCredential(): PasswordCredentialCtor | undefined {
  if (typeof window === "undefined" || !("credentials" in navigator)) return undefined;
  return (window as unknown as { PasswordCredential?: PasswordCredentialCtor }).PasswordCredential;
}

/** E-mail salvo no último login com "Salvar senha" marcado (ou null). */
export function emailLembrado(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null; // janela anônima ou armazenamento bloqueado
  }
}

/** Chamado só depois de um login bem-sucedido. */
export async function lembrarLogin(email: string, password: string, lembrar: boolean) {
  try {
    if (lembrar) localStorage.setItem(EMAIL_KEY, email);
    else localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Sem armazenamento: só não preenche o e-mail na próxima vez.
  }
  const Credencial = passwordCredential();
  if (!lembrar || !Credencial) return;
  try {
    // Abre o "Salvar senha?" do navegador; o usuário confirma lá.
    await navigator.credentials.store(new Credencial({ id: email, password }));
  } catch {
    // Gerenciador de senhas desativado ou recusado: o login segue normalmente.
  }
}
