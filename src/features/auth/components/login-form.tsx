"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";
import { emailLembrado, lembrarLogin } from "../lembrar-login";
import { type LoginFormValues, loginFormSchema } from "../schemas";

type LoginErrorKey = "invalidCredentials" | "roleNotAllowed" | "apiUnavailable" | "tooManyAttempts";

function loginErrorKey(error: unknown): LoginErrorKey {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status === 401 || status === 400) return "invalidCredentials";
  if (status === 403) return "roleNotAllowed";
  if (status === 429) return "tooManyAttempts";
  return "apiUnavailable";
}

interface LoginFormProps {
  nextPath: string;
  sessionExpired?: boolean;
}

export function LoginForm({ nextPath, sessionExpired = false }: Readonly<LoginFormProps>) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<LoginErrorKey | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "", lembrar: false },
  });

  // O localStorage só existe no navegador: preenche depois de montar.
  useEffect(() => {
    const email = emailLembrado();
    if (!email) return;
    reset({ email, password: "", lembrar: true });
    // Depois que o reset for aplicado à tela, o cursor já vai para a senha.
    const frame = requestAnimationFrame(() => setFocus("password"));
    return () => cancelAnimationFrame(frame);
  }, [reset, setFocus]);

  const onSubmit = handleSubmit(async ({ lembrar, ...credenciais }) => {
    setErrorKey(null);
    try {
      const user = await authService.login(credenciais);
      await lembrarLogin(credenciais.email, credenciais.password, lembrar);
      useAuthStore.getState().setUser(user);
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setErrorKey(loginErrorKey(error));
    }
  });

  const alertKey = errorKey ?? (sessionExpired ? "sessionExpired" : null);
  const alert = alertKey ? t(alertKey) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          {alert && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {alert}
            </p>
          )}
          <FormField label={t("email")} error={errors.email?.message}>
            <Input type="email" autoComplete="username" inputMode="email" {...register("email")} />
          </FormField>
          <FormField label={t("password")} error={errors.password?.message}>
            <Input type="password" autoComplete="current-password" {...register("password")} />
          </FormField>
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="login-lembrar"
                aria-describedby="login-lembrar-dica"
                {...register("lembrar")}
              />
              <Label htmlFor="login-lembrar">{t("lembrar")}</Label>
            </div>
            <p id="login-lembrar-dica" className="text-xs text-muted-foreground">
              {t("lembrarDica")}
            </p>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
