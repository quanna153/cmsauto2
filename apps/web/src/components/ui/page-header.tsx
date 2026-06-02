export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return <header className="mb-6 flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end"><div>{eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#a88412]">{eyebrow}</p> : null}<h1 className="text-2xl font-bold text-[#172033]">{title}</h1>{description ? <p className="mt-1 max-w-2xl text-sm text-[#687386]">{description}</p> : null}</div>{actions}</header>;
}

