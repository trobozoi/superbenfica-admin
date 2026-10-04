import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  backoffDelay,
  parseRealtimeMessage,
  RealtimeClient,
  WS_CLOSE_CODES,
} from "@/lib/realtime/realtime-client";
import type { ConnectionStatus } from "@/types/realtime";

/** WebSocket falso: os testes disparam open/message/close manualmente. */
class FakeSocket {
  static readonly OPEN = 1;
  readyState = 0;
  sent: string[] = [];
  closedWith: number | null = null;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;

  constructor(public url: string) {}

  send(data: string) {
    this.sent.push(data);
  }
  close(code: number) {
    this.closedWith = code;
  }
  open() {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }
}

function setup(getToken = vi.fn<() => Promise<string | null>>(async () => "tok en")) {
  const sockets: FakeSocket[] = [];
  const statuses: ConnectionStatus[] = [];
  const onMessage = vi.fn();
  const client = new RealtimeClient({
    url: "ws://api/ws/lojas/1/",
    getToken,
    onMessage,
    onStatusChange: (status) => statuses.push(status),
    createSocket: (url) => {
      const socket = new FakeSocket(url);
      sockets.push(socket);
      return socket as unknown as WebSocket;
    },
    heartbeatMs: 1000,
    baseDelayMs: 100,
    maxDelayMs: 400,
  });
  return { client, sockets, statuses, onMessage, getToken };
}

describe("lib/realtime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeSocket);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("backoff exponencial limitado", () => {
    expect([0, 1, 2, 3, 10].map((n) => backoffDelay(n, 100, 400))).toEqual([
      100, 200, 400, 400, 400,
    ]);
  });

  it("ignora mensagens inválidas ou desconhecidas", () => {
    expect(parseRealtimeMessage("{")).toBeNull();
    expect(parseRealtimeMessage(42)).toBeNull();
    expect(parseRealtimeMessage("null")).toBeNull();
    expect(parseRealtimeMessage(JSON.stringify({ evento: "outro" }))).toBeNull();
    expect(parseRealtimeMessage(JSON.stringify({ evento: "pedido.criado", dados: {} }))).toEqual({
      evento: "pedido.criado",
      dados: {},
    });
  });

  it("conecta com o token na URL, envia ping e repassa eventos", async () => {
    const { client, sockets, statuses, onMessage } = setup();
    await client.connect();
    const socket = sockets[0];
    expect(socket?.url).toBe("ws://api/ws/lojas/1/?token=tok%20en");

    socket?.open();
    expect(statuses).toEqual(["connecting", "open"]);

    vi.advanceTimersByTime(1000);
    expect(socket?.sent).toEqual([JSON.stringify({ acao: "ping" })]);

    socket?.onmessage?.({ data: JSON.stringify({ evento: "pong", dados: {} }) });
    socket?.onmessage?.({
      data: JSON.stringify({ evento: "pedido.atualizado", dados: { pedido_id: 1 } }),
    });
    expect(onMessage).toHaveBeenCalledTimes(1);
    client.disconnect();
  });

  it("reconecta após queda inesperada (inclusive 4401)", async () => {
    const { client, sockets, statuses, getToken } = setup();
    await client.connect();
    sockets[0]?.open();
    sockets[0]?.onclose?.({ code: WS_CLOSE_CODES.unauthenticated });
    expect(statuses.at(-1)).toBe("reconnecting");

    await vi.advanceTimersByTimeAsync(100);
    expect(getToken).toHaveBeenCalledTimes(2);
    expect(sockets).toHaveLength(2);
    client.disconnect();
  });

  it("não reconecta quando a filial é proibida (4403)", async () => {
    const { client, sockets, statuses } = setup();
    await client.connect();
    sockets[0]?.onclose?.({ code: WS_CLOSE_CODES.forbidden });
    await vi.advanceTimersByTimeAsync(1000);
    expect(statuses.at(-1)).toBe("forbidden");
    expect(sockets).toHaveLength(1);
    client.disconnect();
  });

  it("fica fechado sem token e encerra a conexão no disconnect", async () => {
    const semToken = setup(vi.fn(async () => null));
    await semToken.client.connect();
    expect(semToken.sockets).toHaveLength(0);
    expect(semToken.statuses.at(-1)).toBe("closed");

    const { client, sockets } = setup();
    await client.connect();
    client.disconnect();
    expect(sockets[0]?.closedWith).toBe(WS_CLOSE_CODES.normal);
  });

  it("fechamento normal não agenda reconexão", async () => {
    const { client, sockets, statuses } = setup();
    await client.connect();
    sockets[0]?.onclose?.({ code: WS_CLOSE_CODES.normal });
    expect(statuses.at(-1)).toBe("closed");
    client.disconnect();
  });
});
