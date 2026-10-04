"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

/** Sidebar fixa no desktop (recolhível). */
export function Sidebar() {
  const t = useTranslations("nav");
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggle = useUiStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn("flex h-14 items-center border-b px-4", collapsed && "justify-center px-2")}
      >
        <Brand compact={collapsed} />
      </div>
      <nav aria-label="Principal" className="flex-1 overflow-y-auto p-2">
        <NavLinks collapsed={collapsed} />
      </nav>
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn(!collapsed && "w-full justify-start")}
          onClick={toggle}
          aria-label={collapsed ? t("expand") : t("collapse")}
        >
          {collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
          {!collapsed && t("collapse")}
        </Button>
      </div>
    </aside>
  );
}

/** Menu em painel lateral para tablet e celular. */
export function MobileNav() {
  const t = useTranslations();
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent variant="side" closeLabel={t("common.close")} className="bg-sidebar">
        <DialogTitle className="sr-only">{t("nav.openMenu")}</DialogTitle>
        <DialogDescription className="sr-only">{t("app.subtitle")}</DialogDescription>
        <div className="flex h-14 items-center border-b px-4">
          <Brand />
        </div>
        <nav aria-label="Principal" className="overflow-y-auto p-2">
          <NavLinks onNavigate={() => setOpen(false)} />
        </nav>
      </DialogContent>
    </Dialog>
  );
}
