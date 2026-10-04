import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { getServerSession } from "@/lib/server/session";

/** Área autenticada. O proxy já barra acessos, isto é uma segunda camada de defesa. */
export default async function PainelLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getServerSession();
  if (!user) redirect("/login");

  return (
    <AuthProvider initialUser={user}>
      <RealtimeProvider>
        <AppShell>{children}</AppShell>
      </RealtimeProvider>
    </AuthProvider>
  );
}
