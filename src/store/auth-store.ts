import { create } from "zustand";
import type { SessionUser } from "@/types/auth";

interface AuthState {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  clear: () => void;
}

/**
 * Usuário logado (somente dados de exibição). Os tokens NÃO ficam aqui:
 * estão em cookies httpOnly gerenciados pelo servidor.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
