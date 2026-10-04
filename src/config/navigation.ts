import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  type LucideIcon,
  PackageSearch,
  Settings,
  ShoppingCart,
  TicketPercent,
  Users,
} from "lucide-react";
import type messages from "@/messages/pt-BR.json";
import type { Permission } from "./permissions";

export interface NavItem {
  href: string;
  /** Chave em src/messages/pt-BR.json, dentro de "nav". */
  labelKey: keyof (typeof messages)["nav"];
  icon: LucideIcon;
  permission: Permission;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
  { href: "/pedidos", labelKey: "pedidos", icon: ShoppingCart, permission: "pedidos:view" },
  { href: "/separacao", labelKey: "separacao", icon: ClipboardList, permission: "separacao:view" },
  { href: "/produtos", labelKey: "produtos", icon: PackageSearch, permission: "produtos:view" },
  { href: "/estoque", labelKey: "estoque", icon: Boxes, permission: "estoque:view" },
  { href: "/clientes", labelKey: "clientes", icon: Users, permission: "clientes:view" },
  { href: "/relatorios", labelKey: "relatorios", icon: BarChart3, permission: "relatorios:view" },
  {
    href: "/formas-pagamento",
    labelKey: "formasPagamento",
    icon: CreditCard,
    permission: "pagamentos:view",
  },
  { href: "/promocoes", labelKey: "promocoes", icon: TicketPercent, permission: "promocoes:view" },
  {
    href: "/configuracoes",
    labelKey: "configuracoes",
    icon: Settings,
    permission: "configuracoes:view",
  },
];
