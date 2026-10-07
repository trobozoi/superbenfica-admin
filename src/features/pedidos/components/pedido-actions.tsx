"use client";

import { Ban, CheckCheck, PackageCheck, PlayCircle, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import type { Pedido } from "@/types/api";
import { availableActions, concluirBloqueado, type PedidoAction } from "../actions";
import { usePedidoAction } from "../hooks";

const ACTION_UI = {
  iniciarSeparacao: { icon: PlayCircle, labelKey: "pedidos.iniciarSeparacao", variant: "default" },
  concluirSeparacao: { icon: PackageCheck, labelKey: "separacao.concluir", variant: "default" },
  despachar: { icon: Truck, labelKey: "pedidos.despachar", variant: "default" },
  finalizar: { icon: CheckCheck, labelKey: "pedidos.finalizar", variant: "default" },
  cancelar: { icon: Ban, labelKey: "pedidos.cancelar", variant: "outline" },
} as const;

interface PedidoActionsProps {
  pedido: Pedido;
  size?: "sm" | "default";
  onDone?: () => void;
}

/** Botões de transição permitidos para o perfil e o status atual. Cancelar pede confirmação. */
export function PedidoActions({ pedido, size = "sm", onDone }: Readonly<PedidoActionsProps>) {
  const t = useTranslations();
  const role = useAuthStore((state) => state.user?.role);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const mutation = usePedidoAction(() => {
    setConfirmCancel(false);
    onDone?.();
  });
  const actions = availableActions(pedido, role);
  const bloqueada = (action: PedidoAction) =>
    action === "concluirSeparacao" && concluirBloqueado(pedido);

  if (actions.length === 0) return null;

  const run = (action: PedidoAction) => mutation.mutate({ action, pedido });

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const { icon: Icon, labelKey, variant } = ACTION_UI[action];
        return (
          <Button
            key={action}
            size={size}
            variant={variant}
            disabled={mutation.isPending || bloqueada(action)}
            title={bloqueada(action) ? t("separacao.faltamItens") : undefined}
            onClick={() => (action === "cancelar" ? setConfirmCancel(true) : run(action))}
          >
            <Icon aria-hidden /> {t(labelKey)}
          </Button>
        );
      })}
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={t("pedidos.confirmCancel", { codigo: pedido.codigo })}
        confirmLabel={t("pedidos.cancelar")}
        isPending={mutation.isPending}
        onConfirm={() => run("cancelar")}
      />
    </div>
  );
}
