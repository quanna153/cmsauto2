import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-2", className)} {...props} />;
}

