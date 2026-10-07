import { create } from "zustand";
import type { ConnectionStatus } from "@/types/realtime";

interface RealtimeState {
  status: ConnectionStatus;
  lastEventAt: number | null;
  setStatus: (status: ConnectionStatus) => void;
  markEvent: () => void;
}

/** Do pior para o melhor: com várias conexões, o indicador mostra a que está pior. */
const SEVERIDADE: readonly ConnectionStatus[] = [
  "forbidden",
  "closed",
  "reconnecting",
  "connecting",
  "open",
];

/** Estado único para várias conexões (ADMIN vendo todas as filiais). */
export function combineStatuses(statuses: readonly ConnectionStatus[]): ConnectionStatus {
  return SEVERIDADE.find((status) => statuses.includes(status)) ?? "idle";
}

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  status: "idle",
  lastEventAt: null,
  setStatus: (status) => set({ status }),
  markEvent: () => set({ lastEventAt: Date.now() }),
}));
