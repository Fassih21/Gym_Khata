import type { ReactNode } from "react";

export function MarketingPageHero({
  page = "00",
  eyebrow,
  title,
  copy,
  actions,
  children,
}: {
  page?: string;
  eyebrow: string;
  title: string;
  copy: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mk-page-hero">
      <div className="mk-content mk-page-hero-grid">
        <p className="mk-page-marker">
          <span>{page}</span>
          {eyebrow}
        </p>
        <div className="mk-page-copy-block">
          <p className="mk-kicker">{eyebrow}</p>
          <h1 className="mk-page-title">{title}</h1>
          <p className="mk-page-copy">{copy}</p>
          {actions ? <div className="mk-page-actions">{actions}</div> : null}
        </div>
        {children ? <div className="mk-page-visual">{children}</div> : null}
      </div>
    </header>
  );
}
