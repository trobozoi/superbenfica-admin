import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: Readonly<ComponentProps<"div">>) {
  return (
    <div
      className={cn("rounded-xl border bg-card text-card-foreground shadow-xs", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: Readonly<ComponentProps<"div">>) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: Readonly<ComponentProps<"h3">>) {
  return (
    <h3 className={cn("leading-none font-semibold", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, ...props }: Readonly<ComponentProps<"p">>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: Readonly<ComponentProps<"div">>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
