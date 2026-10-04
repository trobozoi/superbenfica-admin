import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LoginForm } from "@/features/auth/components/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("title") };
}

interface LoginPageProps {
  searchParams: Promise<{ next?: string; expired?: string }>;
}

/** Aceita apenas caminhos internos em ?next= (evita open redirect). */
function safeNextPath(next: string | undefined): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default async function LoginPage({ searchParams }: Readonly<LoginPageProps>) {
  const { next, expired } = await searchParams;
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Brand />
        </div>
        <LoginForm nextPath={safeNextPath(next)} sessionExpired={expired === "1"} />
      </div>
    </div>
  );
}
