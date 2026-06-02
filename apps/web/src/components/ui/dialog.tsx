import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Dialog({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border bg-white p-5 shadow-xl", className)} role="dialog" {...props} />;
}

