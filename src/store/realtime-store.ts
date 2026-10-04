import { create } from "zustand";
import type { ConnectionStatus } from "@/types/realtime";

interface RealtimeState {
  status: ConnectionStatus;
  lastEventAt: number | null;
  setStatus: (status: ConnectionStatus) => void;
  markEvent: () => void;
}

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  status: "idle",
  lastEventAt: null,
  setStatus: (status) => set({ status }),
  markEvent: () => set({ lastEventAt: Date.now() }),
}));
