import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Drawer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <aside className={cn("border-l bg-white p-5 shadow-lg", className)} {...props} />;
}

