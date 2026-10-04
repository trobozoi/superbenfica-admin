"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { LojaField } from "@/components/shared/loja-field";
import { PhoneInput } from "@/components/shared/phone-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox, Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isStaffRole, STAFF_ROLES } from "@/config/permissions";
import { applyFieldErrors, useSaveResource } from "@/hooks/use-resource";
import { formatTelefone } from "@/lib/telefone";
import { usuariosApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import type { Usuario } from "@/types/api";
import { type UsuarioFormInput, type UsuarioFormValues, usuarioSchema } from "../schemas";

interface UsuarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario | null;
}

function toFormValues(
  usuario: Usuario | null | undefined,
  lojaPadrao: number | null,
): UsuarioFormInput {
  return {
    nome: usuario?.nome ?? "",
    email: usuario?.email ?? "",
    telefone: formatTelefone(usuario?.telefone ?? ""),
    loja: usuario?.loja ?? lojaPadrao ?? "",
    role: usuario && isStaffRole(usuario.role) ? usuario.role : "CAIXA",
    is_active: usuario?.is_active ?? true,
    password: "",
  };
}

export function UsuarioFormDialog({
  open,
  onOpenChange,
  usuario,
}: Readonly<UsuarioFormDialogProps>) {
  const t = useTranslations();
  const me = useAuthStore((state) => state.user);
  const isAdmin = me?.role === "ADMIN";
  // Gerente só gerencia a própria filial e não cria administradores (regra da API).
  const roles = isAdmin ? STAFF_ROLES : STAFF_ROLES.filter((role) => role !== "ADMIN");

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UsuarioFormInput, unknown, UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema(usuario ? "update" : "create")),
    defaultValues: toFormValues(usuario, me?.lojaId ?? null),
  });

  useEffect(() => {
    if (open) reset(toFormValues(usuario, me?.lojaId ?? null));
  }, [open, usuario, me?.lojaId, reset]);

  const save = useSaveResource(usuariosApi, {
    onSuccess: () => onOpenChange(false),
    onError: (error) => applyFieldErrors(setError, error),
  });

  const onSubmit = handleSubmit(({ password, ...values }) =>
    save.mutate({ id: usuario?.id, input: usuario ? values : { ...values, password } }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>
            {usuario ? t("configuracoes.editUsuario") : t("configuracoes.newUsuario")}
          </DialogTitle>
        </DialogHeader>
        <form noValidate className="grid gap-4" onSubmit={onSubmit}>
          <FormField label={t("configuracoes.nome")} error={errors.nome?.message}>
            <Input autoComplete="off" {...register("nome")} />
          </FormField>
          <FormField label={t("configuracoes.email")} error={errors.email?.message}>
            <Input type="email" autoComplete="off" {...register("email")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("configuracoes.perfil")} error={errors.role?.message}>
              <NativeSelect {...register("role")}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <LojaField
              control={control}
              name="loja"
              label={t("common.filial")}
              error={errors.loja?.message}
              disabled={!isAdmin}
            />
          </div>
          <FormField label={t("configuracoes.telefone")} error={errors.telefone?.message}>
            <PhoneInput {...register("telefone")} />
          </FormField>
          {!usuario && (
            <FormField label={t("configuracoes.senha")} error={errors.password?.message}>
              <Input type="password" autoComplete="new-password" {...register("password")} />
            </FormField>
          )}
          <div className="flex items-center gap-2">
            <Checkbox id="usuario-ativo" {...register("is_active")} />
            <Label htmlFor="usuario-ativo">{t("common.active")}</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
