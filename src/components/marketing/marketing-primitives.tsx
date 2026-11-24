import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MarketingRoute = "/" | "/features" | "/pricing" | "/faq" | "/about" | "/contact" | "/login";

export function IronSection({
  index,
  label,
  id,
  tone = "base",
  className,
  children,
}: {
  index: string;
  label: string;
  id?: string;
  tone?: "base" | "panel" | "solid";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mk-section",
        tone === "panel" && "mk-section-panel",
        tone === "solid" && "mk-section-solid",
        className,
      )}
    >
      <div className="mk-content mk-section-grid">
        <p className="mk-section-index">
          <span>{index}</span>
          {label}
        </p>
        <div className="mk-section-body">{children}</div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  id,
  className,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("mk-section-heading", className)}>
      <p className="mk-kicker">{eyebrow}</p>
      <h2 id={id} className="mk-section-title">
        {title}
      </h2>
      {copy ? <p className="mk-section-copy">{copy}</p> : null}
    </div>
  );
}

export function MarketingButton({
  to,
  children,
  secondary = false,
  className,
}: {
  to: MarketingRoute;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <Link to={to} className={cn("mk-button", secondary && "mk-button-secondary", className)}>
      {children}
    </Link>
  );
}

export function DemoLabel({ children = "Sample data" }: { children?: ReactNode }) {
  return <span className="mk-demo-label">{children}</span>;
}

export function FactLine({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="mk-fact-line">
      <span className="mk-fact-number" aria-hidden="true">
        {number}
      </span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </article>
  );
}
