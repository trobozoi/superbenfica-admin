"use client";

import { hasPermission, type Permission } from "@/config/permissions";
import { useAuthStore } from "@/store/auth-store";

export function usePermission(permission: Permission): boolean {
  const role = useAuthStore((state) => state.user?.role);
  return hasPermission(role, permission);
}
