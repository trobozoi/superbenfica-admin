"use client";

import type { ReactNode } from "react";
import type { Permission } from "@/config/permissions";
import { usePermission } from "@/hooks/use-permission";

interface CanProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renderiza o conteúdo só se o perfil do usuário tiver a permissão. */
export function Can({ permission, children, fallback = null }: Readonly<CanProps>) {
  return usePermission(permission) ? children : fallback;
}
