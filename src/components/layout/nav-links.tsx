"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { NAV_ITEMS } from "@/config/navigation";
import { hasPermission } from "@/config/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

interface NavLinksProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** Itens do menu filtrados pelo perfil do usuário. */
export function NavLinks({ collapsed = false, onNavigate }: Readonly<NavLinksProps>) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  const items = NAV_ITEMS.filter((item) => hasPermission(role, item.permission));

  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ href, labelKey, icon: Icon }) => {
        const active = isActive(pathname, href);
        const label = t(labelKey);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className={cn(collapsed && "sr-only")}>{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
