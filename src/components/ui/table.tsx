import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: Readonly<ComponentProps<"table">>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: Readonly<ComponentProps<"thead">>) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }: Readonly<ComponentProps<"tbody">>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: Readonly<ComponentProps<"tr">>) {
  return (
    <tr className={cn("border-b transition-colors hover:bg-muted/50", className)} {...props} />
  );
}

export function TableHead({ className, ...props }: Readonly<ComponentProps<"th">>) {
  return (
    <th
      className={cn(
        "h-10 px-3 text-left align-middle font-medium whitespace-nowrap text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: Readonly<ComponentProps<"td">>) {
  return <td className={cn("px-3 py-2.5 align-middle", className)} {...props} />;
}
