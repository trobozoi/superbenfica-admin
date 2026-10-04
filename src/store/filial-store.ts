import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SessionUser } from "@/types/auth";

interface FilialState {
  /** Filial escolhida pelo ADMIN no seletor do topo. */
  selectedLojaId: number | null;
  setSelectedLojaId: (id: number | null) => void;
}

export const useFilialStore = create<FilialState>()(
  persist(
    (set) => ({
      selectedLojaId: null,
      setSelectedLojaId: (selectedLojaId) => set({ selectedLojaId }),
    }),
    { name: "sb-filial", storage: createJSONStorage(() => localStorage) },
  ),
);

/**
 * Filial efetiva do usuário: funcionários ficam presos à própria filial (a API impõe isso);
 * o ADMIN usa a selecionada no topo ou, sem seleção, vê todas (null).
 */
export function resolveLojaId(user: SessionUser | null, selected: number | null): number | null {
  if (!user) return null;
  if (user.role === "ADMIN") return selected ?? user.lojaId;
  return user.lojaId;
}
