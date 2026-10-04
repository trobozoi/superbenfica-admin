"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts.at(-1)] : parts;
  return letters.map((part) => part?.[0]?.toUpperCase() ?? "").join("") || "?";
}

export function UserMenu() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const handleLogout = async () => {
    // Para as consultas antes de sair: limpar o cache com a tela ainda montada fazia
    // as consultas ativas buscarem de novo, já sem sessão (401 + refresh inútil).
    await queryClient.cancelQueries();
    await authService.logout();
    // Navegação completa: descarta a tela, o cache, o WebSocket e o estado em memória
    // de uma vez, sem um novo render com dados de quem saiu.
    window.location.replace("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 px-2"
          aria-label={user.nome}
          data-testid="user-menu"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(user.nome)}
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-medium">{user.nome}</span>
            <span className="block text-xs text-muted-foreground">{t(`roles.${user.role}`)}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block">{user.nome}</span>
          <span className="block text-xs font-normal text-muted-foreground">
            {t(`roles.${user.role}`)}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleLogout()} data-testid="logout">
          <LogOut aria-hidden /> {t("auth.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
