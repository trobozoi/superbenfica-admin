import { describe, expect, it } from "vitest";
import { useAuthStore } from "@/store/auth-store";
import { resolveLojaId, useFilialStore } from "@/store/filial-store";
import { useRealtimeStore } from "@/store/realtime-store";
import { useUiStore } from "@/store/ui-store";
import type { SessionUser } from "@/types/auth";

const gerente: SessionUser = { id: 1, nome: "G", role: "GERENTE", lojaId: 2, exp: 0 };
const admin: SessionUser = { id: 2, nome: "A", role: "ADMIN", lojaId: null, exp: 0 };

describe("stores", () => {
  it("funcionário fica preso à própria filial", () => {
    expect(resolveLojaId(gerente, 9)).toBe(2);
  });

  it("ADMIN usa a filial escolhida ou vê todas", () => {
    expect(resolveLojaId(admin, 3)).toBe(3);
    expect(resolveLojaId(admin, null)).toBeNull();
    expect(resolveLojaId(null, 3)).toBeNull();
  });

  it("auth store guarda e limpa o usuário", () => {
    useAuthStore.getState().setUser(gerente);
    expect(useAuthStore.getState().user).toEqual(gerente);
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("filial, realtime e ui stores atualizam o estado", () => {
    useFilialStore.getState().setSelectedLojaId(4);
    expect(useFilialStore.getState().selectedLojaId).toBe(4);

    useRealtimeStore.getState().setStatus("open");
    useRealtimeStore.getState().markEvent();
    expect(useRealtimeStore.getState().status).toBe("open");
    expect(useRealtimeStore.getState().lastEventAt).not.toBeNull();

    const before = useUiStore.getState().sidebarCollapsed;
    useUiStore.getState().toggleSidebar();
    useUiStore.getState().setMobileNavOpen(true);
    expect(useUiStore.getState().sidebarCollapsed).toBe(!before);
    expect(useUiStore.getState().mobileNavOpen).toBe(true);
  });
});
