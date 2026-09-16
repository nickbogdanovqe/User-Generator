import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="animate-fade-up flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="display text-[2rem] font-bold leading-[1.05] md:text-[2.4rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-xl text-[0.95rem] leading-relaxed text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
