import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, htmlFor, ...props }: Readonly<ComponentProps<"label">>) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-sm leading-none font-medium select-none", className)}
      {...props}
    />
  );
}
