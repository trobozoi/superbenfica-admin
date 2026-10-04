import { REALTIME_EVENTS, type ConnectionStatus, type RealtimeMessage } from "@/types/realtime";

/** Códigos de fechamento usados pela API (apps/core/consumers.py). */
export const WS_CLOSE_CODES = {
  normal: 1000,
  unauthenticated: 4401,
  forbidden: 4403,
} as const;

export interface RealtimeClientOptions {
  /** URL completa do canal, sem o token. Ex.: ws://host/ws/lojas/1/ */
  url: string;
  /** Busca um access token válido (renovando se preciso). null = sem sessão. */
  getToken: () => Promise<string | null>;
  onMessage: (message: RealtimeMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  /** Permite injetar um WebSocket falso nos testes. */
  createSocket?: (url: string) => WebSocket;
  heartbeatMs?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/** Atraso exponencial limitado: base, 2x base, 4x base... até o máximo. */
export function backoffDelay(attempt: number, baseMs: number, maxMs: number): number {
  return Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt));
}

export function parseRealtimeMessage(raw: unknown): RealtimeMessage | null {
  if (typeof raw !== "string") return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { evento } = data as { evento?: unknown };
    const known = (REALTIME_EVENTS as readonly unknown[]).includes(evento);
    return known ? (data as RealtimeMessage) : null;
  } catch {
    return null;
  }
}

/**
 * Cliente WebSocket nativo para o Django Channels (o protocolo NÃO é Socket.io).
 * - autentica via ?token=<access>, como exige a API;
 * - envia {"acao":"ping"} periodicamente para manter a conexão viva;
 * - reconecta com backoff exponencial, exceto em fechamento intencional ou 4403.
 */
export class RealtimeClient {
  private socket: WebSocket | null = null;
  private attempt = 0;
  private stopped = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly options: Required<
    Pick<RealtimeClientOptions, "heartbeatMs" | "baseDelayMs" | "maxDelayMs" | "createSocket">
  > &
    RealtimeClientOptions;

  constructor(options: RealtimeClientOptions) {
    this.options = {
      heartbeatMs: 25_000,
      baseDelayMs: 1_000,
      maxDelayMs: 30_000,
      createSocket: (url) => new WebSocket(url),
      ...options,
    };
  }

  async connect(): Promise<void> {
    this.stopped = false;
    this.setStatus(this.attempt === 0 ? "connecting" : "reconnecting");
    const token = await this.options.getToken();
    if (this.stopped) return;
    if (!token) {
      this.setStatus("closed");
      return;
    }
    const url = `${this.options.url}?token=${encodeURIComponent(token)}`;
    const socket = this.options.createSocket(url);
    this.socket = socket;
    socket.onopen = () => this.handleOpen();
    socket.onmessage = (event: MessageEvent) => this.handleMessage(event.data);
    socket.onclose = (event: CloseEvent) => this.handleClose(event.code);
  }

  disconnect(): void {
    this.stopped = true;
    this.clearTimers();
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close(WS_CLOSE_CODES.normal);
      this.socket = null;
    }
    this.setStatus("closed");
  }

  private handleOpen(): void {
    this.attempt = 0;
    this.setStatus("open");
    this.heartbeatTimer = setInterval(() => this.send({ acao: "ping" }), this.options.heartbeatMs);
  }

  private handleMessage(raw: unknown): void {
    const message = parseRealtimeMessage(raw);
    if (message && message.evento !== "pong") this.options.onMessage(message);
  }

  private handleClose(code: number): void {
    this.clearTimers();
    this.socket = null;
    if (this.stopped || code === WS_CLOSE_CODES.normal) {
      this.setStatus("closed");
      return;
    }
    if (code === WS_CLOSE_CODES.forbidden) {
      this.stopped = true;
      this.setStatus("forbidden");
      return;
    }
    // 4401 (token expirado) também reconecta: getToken() renova a sessão.
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    const delay = backoffDelay(this.attempt, this.options.baseDelayMs, this.options.maxDelayMs);
    this.attempt += 1;
    this.setStatus("reconnecting");
    this.reconnectTimer = setTimeout(() => {
      void this.connect();
    }, delay);
  }

  private send(payload: Record<string, unknown>): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(payload));
  }

  private clearTimers(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }

  private setStatus(status: ConnectionStatus): void {
    this.options.onStatusChange?.(status);
  }
}
