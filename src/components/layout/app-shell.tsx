"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store";
import { Brand } from "./brand";
import { ConnectionStatus } from "./connection-status";
import { FilialSelector } from "./filial-selector";
import { MobileNav, Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/** Estrutura do painel: sidebar (desktop) / menu lateral (mobile) + topo + conteúdo. */
export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

  return (
    <div className="flex min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        {tc("skipToContent")}
      </a>
      <Sidebar />
      <MobileNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={t("openMenu")}
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu aria-hidden />
          </Button>
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <FilialSelector />
            <ConnectionStatus />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
