import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Can } from "@/components/shared/can";
import {
  ActiveBadge,
  PedidoStatusBadge,
  SeparacaoStatusBadge,
  TipoEntregaBadge,
} from "@/components/shared/status-badge";
import { useAuthStore } from "@/store/auth-store";
import { renderWithIntl } from "../../helpers";

describe("componentes compartilhados", () => {
  afterEach(() => useAuthStore.getState().clear());

  it("Can mostra o conteúdo apenas com permissão", () => {
    useAuthStore.getState().setUser({ id: 1, nome: "C", role: "CAIXA", lojaId: 1, exp: 0 });
    renderWithIntl(
      <>
        <Can permission="pedidos:finalize">pode finalizar</Can>
        <Can permission="relatorios:view" fallback={<span>sem relatórios</span>}>
          relatórios
        </Can>
      </>,
    );
    expect(screen.getByText("pode finalizar")).toBeInTheDocument();
    expect(screen.getByText("sem relatórios")).toBeInTheDocument();
    expect(screen.queryByText("relatórios")).not.toBeInTheDocument();
  });

  it("badges exibem o status traduzido", () => {
    renderWithIntl(
      <>
        <PedidoStatusBadge status="EM_SEPARACAO" />
        <SeparacaoStatusBadge status="CONCLUIDA" />
        <ActiveBadge active={false} />
        <ActiveBadge active />
        <TipoEntregaBadge tipo="DOMICILIO" />
        <TipoEntregaBadge tipo="RETIRADA" />
      </>,
    );
    expect(screen.getByText("Em separação")).toBeInTheDocument();
    expect(screen.getByText("Concluída")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Entrega em domicílio")).toBeInTheDocument();
    expect(screen.getByText("Retirada na loja")).toBeInTheDocument();
  });
});
