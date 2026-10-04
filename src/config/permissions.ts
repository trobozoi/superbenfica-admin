import type { Role } from "@/types/api";

/**
 * Matriz de permissões do painel, espelhando as regras da API (docs/api.md).
 * A API é a autoridade final: este mapa só decide o que a interface mostra.
 *
 * O perfil CLIENTE não acessa o painel administrativo.
 */
export const STAFF_ROLES = ["ADMIN", "GERENTE", "SEPARADOR", "CAIXA"] as const satisfies Role[];
export type StaffRole = (typeof STAFF_ROLES)[number];

const ALL_STAFF: readonly StaffRole[] = STAFF_ROLES;
const MANAGEMENT: readonly StaffRole[] = ["ADMIN", "GERENTE"];
const SALES: readonly StaffRole[] = ["ADMIN", "GERENTE", "CAIXA"];
const PICKING: readonly StaffRole[] = ["ADMIN", "GERENTE", "SEPARADOR"];

export const PERMISSIONS = {
  "dashboard:view": ALL_STAFF,
  "relatorios:view": MANAGEMENT,
  "produtos:view": ALL_STAFF,
  "produtos:write": MANAGEMENT,
  "estoque:view": ALL_STAFF,
  "estoque:write": MANAGEMENT,
  "pedidos:view": ALL_STAFF,
  "pedidos:create": SALES,
  "pedidos:finalize": SALES,
  "pedidos:cancel": ALL_STAFF,
  "separacao:view": PICKING,
  "separacao:operate": PICKING,
  /** Mexer na separação de outro separador (marcar itens, concluir). */
  "separacao:supervise": MANAGEMENT,
  "clientes:view": ALL_STAFF,
  "clientes:create": SALES,
  "clientes:write": MANAGEMENT,
  "usuarios:manage": MANAGEMENT,
  "filiais:write": ["ADMIN"],
  "filiais:switch": ["ADMIN"],
  "configuracoes:view": MANAGEMENT,
  "pagamentos:view": MANAGEMENT,
  /** A API só deixa o ADMIN cadastrar e alterar formas de pagamento. */
  "pagamentos:write": ["ADMIN"],
  "promocoes:view": MANAGEMENT,
} as const satisfies Record<string, readonly StaffRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role ?? "");
}

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!isStaffRole(role)) return false;
  return (PERMISSIONS[permission] as readonly StaffRole[]).includes(role);
}

/**
 * Permissão exigida por rota (prefixo). Usado pelo proxy (servidor) e pela sidebar.
 * Rotas sem entrada exigem apenas "dashboard:view" (qualquer funcionário).
 */
export const ROUTE_PERMISSIONS: readonly { prefix: string; permission: Permission }[] = [
  { prefix: "/produtos", permission: "produtos:view" },
  { prefix: "/estoque", permission: "estoque:view" },
  { prefix: "/pedidos", permission: "pedidos:view" },
  { prefix: "/separacao", permission: "separacao:view" },
  { prefix: "/clientes", permission: "clientes:view" },
  { prefix: "/relatorios", permission: "relatorios:view" },
  { prefix: "/promocoes", permission: "promocoes:view" },
  { prefix: "/configuracoes", permission: "configuracoes:view" },
  { prefix: "/formas-pagamento", permission: "pagamentos:view" },
];

export function permissionForPath(pathname: string): Permission {
  const match = ROUTE_PERMISSIONS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.permission ?? "dashboard:view";
}

export function canAccessPath(role: Role | null | undefined, pathname: string): boolean {
  return hasPermission(role, permissionForPath(pathname));
}
