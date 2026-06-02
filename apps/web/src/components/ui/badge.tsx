import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex rounded-full bg-[#f1f2ee] px-2.5 py-1 text-xs font-semibold text-[#566174]", className)} {...props} />;
}

