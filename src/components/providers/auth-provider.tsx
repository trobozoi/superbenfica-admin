"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { setSessionExpiredHandler } from "@/services/http/client";
import { useAuthStore } from "@/store/auth-store";
import type { SessionUser } from "@/types/auth";

interface AuthProviderProps {
  /** Sessão lida no servidor (cookie), evita um carregamento extra no cliente. */
  initialUser: SessionUser;
  children: ReactNode;
}

export function AuthProvider({ initialUser, children }: Readonly<AuthProviderProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Hidrata o store antes da primeira renderização dos filhos (inicializador roda uma vez).
  useState(() => {
    useAuthStore.setState({ user: initialUser });
    return true;
  });

  useEffect(() => {
    useAuthStore.getState().setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      useAuthStore.getState().clear();
      queryClient.clear();
      router.replace("/login?expired=1");
    });
  }, [queryClient, router]);

  return children;
}
