import { describe, expect, it } from "vitest";
import { pedidosEmAberto, resumirVendas, statusChartData } from "@/features/dashboard/summary";

describe("features/dashboard/summary", () => {
  it("soma vendas das filiais e calcula o ticket médio da rede", () => {
    expect(
      resumirVendas([
        { loja_id: 1, loja: "A", pedidos: 2, faturamento: "100.00", ticket_medio: "50.00" },
        { loja_id: 2, loja: "B", pedidos: 3, faturamento: "50.00", ticket_medio: "16.67" },
      ]),
    ).toEqual({ faturamento: 150, pedidos: 5, ticketMedio: 30 });
    expect(resumirVendas(undefined)).toEqual({ faturamento: 0, pedidos: 0, ticketMedio: 0 });
  });

  const porStatus = {
    PENDENTE: 2,
    EM_SEPARACAO: 1,
    SEPARADO: 3,
    SAIU_PARA_ENTREGA: 2,
    FINALIZADO: 9,
    CANCELADO: 1,
  };

  it("conta pedidos em aberto", () => {
    expect(pedidosEmAberto(porStatus)).toBe(8);
    expect(pedidosEmAberto(undefined)).toBe(0);
  });

  it("monta o gráfico na ordem do fluxo", () => {
    expect(statusChartData(porStatus, (s) => s.toLowerCase())?.map((d) => d.label)).toEqual([
      "pendente",
      "em_separacao",
      "separado",
      "saiu_para_entrega",
      "finalizado",
      "cancelado",
    ]);
    expect(statusChartData(undefined, String)).toBeUndefined();
  });
});
