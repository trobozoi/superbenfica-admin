"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Lista filtrável com navegação por teclado (cmdk), no padrão shadcn/ui. */
export function Command({
  className,
  ...props
}: Readonly<ComponentProps<typeof CommandPrimitive>>) {
  return (
    <CommandPrimitive
      className={cn("flex h-full w-full flex-col overflow-hidden rounded-md", className)}
      {...props}
    />
  );
}

export function CommandInput({
  className,
  ...props
}: Readonly<ComponentProps<typeof CommandPrimitive.Input>>) {
  return (
    <div className="flex items-center gap-2 border-b px-3">
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <CommandPrimitive.Input
        className={cn(
          "flex h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({
  className,
  ...props
}: Readonly<ComponentProps<typeof CommandPrimitive.List>>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-64 overflow-x-hidden overflow-y-auto overscroll-contain p-1", className)}
      {...props}
    />
  );
}

export function CommandEmpty({
  className,
  ...props
}: Readonly<ComponentProps<typeof CommandPrimitive.Empty>>) {
  return (
    <CommandPrimitive.Empty
      className={cn("py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CommandItem({
  className,
  ...props
}: Readonly<ComponentProps<typeof CommandPrimitive.Item>>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export const CommandLoading = CommandPrimitive.Loading;
