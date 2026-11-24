import type { ReactNode } from "react";

import { DemoLabel } from "./marketing-primitives";

function ProductCrop({
  title,
  subtitle,
  label,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="img" aria-label={label} className={`mk-product-crop ${className ?? ""}`}>
      <div className="mk-product-topbar">
        <div>
          <span className="mk-product-brand">GK</span>
          <span className="mk-product-name">GymKhata</span>
        </div>
        <DemoLabel />
      </div>
      <div className="mk-product-canvas">
        <div className="mk-product-heading">
          <div>
            <p>{title}</p>
            <span>{subtitle}</span>
          </div>
          <span className="mk-product-action">November 2026</span>
        </div>
        {children}
      </div>
      <div className="mk-product-foot">Current app crop · Pakistani sample data</div>
    </div>
  );
}

function Status({ tone, children }: { tone: "paid" | "due" | "muted"; children: ReactNode }) {
  return <span className={`mk-product-status mk-product-status-${tone}`}>{children}</span>;
}

export function DashboardPreview({ compact = false }: { compact?: boolean }) {
  const stats = [
    ["Fees collected", "PKR 284,000"],
    ["Expenses", "PKR 91,200"],
    ["Active members", "186"],
    ["Fees unpaid", "14"],
  ] as const;
  const bars = [38, 54, 47, 66, 58, 76, 63, 88, 71, 94];

  return (
    <ProductCrop
      title="Dashboard"
      subtitle="Is mahine ka khulasa"
      label="Current GymKhata dashboard crop with sample Pakistani gym data"
      className={compact ? "mk-product-compact" : undefined}
    >
      <div className="mk-product-stats">
        {stats.map(([label, value], index) => (
          <div
            className={index === 0 ? "mk-product-stat mk-product-stat-primary" : "mk-product-stat"}
            key={label}
          >
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {!compact ? (
        <div className="mk-dashboard-crop-grid">
          <div className="mk-product-panel">
            <div className="mk-product-panel-head">
              <strong>6 mahine: Revenue vs Expenses</strong>
              <span>PKR</span>
            </div>
            <div className="mk-product-bars" aria-hidden="true">
              {bars.map((height, index) => (
                <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <div className="mk-product-panel">
            <div className="mk-product-panel-head">
              <strong>Fees status</strong>
              <span>186 members</span>
            </div>
            <div className="mk-fee-split">
              <div>
                <strong>172</strong>
                <span>paid</span>
              </div>
              <div>
                <strong>14</strong>
                <span>unpaid</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ProductCrop>
  );
}

export function MembersPreview({ compact = false }: { compact?: boolean }) {
  const rows = [
    ["Ahsan Malik", "0301 482 7710", "Monthly", "Active", "paid"],
    ["Hira Nadeem", "0322 610 4471", "Quarterly", "Active", "muted"],
    ["Usman Tariq", "0334 905 2218", "Monthly", "Overdue", "due"],
    ["Bilal Raza", "0315 778 4092", "Yearly", "Active", "paid"],
  ] as const;

  return (
    <ProductCrop
      title="Members"
      subtitle="186 active members"
      label="Current GymKhata members list crop with sample Pakistani member data"
      className={compact ? "mk-product-compact" : undefined}
    >
      <div className="mk-product-search">Naam ya phone search karein</div>
      <div className="mk-product-table">
        {rows.slice(0, compact ? 3 : rows.length).map(([name, phone, plan, status, tone]) => (
          <div className="mk-product-row" key={phone}>
            <div className="mk-product-person">
              <strong>{name}</strong>
              <span>{phone}</span>
            </div>
            <span className="mk-product-plan">{plan}</span>
            <Status tone={tone}>{status}</Status>
          </div>
        ))}
      </div>
    </ProductCrop>
  );
}

export function FeesPreview({ compact = false }: { compact?: boolean }) {
  const rows = [
    ["Ahsan Malik", "Monthly · PKR 4,500", "Paid", "paid"],
    ["Hira Nadeem", "Quarterly · covered", "Covered", "muted"],
    ["Usman Tariq", "Monthly · 6 din late", "PKR 4,500 due", "due"],
    ["Sana Iqbal", "Monthly · due 28 Nov", "Pending", "due"],
  ] as const;

  return (
    <ProductCrop
      title="Is mahine ki fees"
      subtitle="14 members ki fees baqi hai"
      label="Current GymKhata fees screen crop with sample Pakistani member dues"
      className={compact ? "mk-product-compact" : undefined}
    >
      <div className="mk-product-tabs">
        <span className="is-active">Pending 14</span>
        <span>Paid 172</span>
        <span>All 186</span>
      </div>
      <div className="mk-product-table">
        {rows.slice(0, compact ? 3 : rows.length).map(([name, detail, status, tone]) => (
          <div className="mk-product-row mk-fee-row" key={name}>
            <div className="mk-product-person">
              <strong>{name}</strong>
              <span>{detail}</span>
            </div>
            <Status tone={tone}>{status}</Status>
          </div>
        ))}
      </div>
    </ProductCrop>
  );
}

export function AttendancePreview() {
  const rows = [
    ["Ahsan Malik", "7:12 pm", "Present"],
    ["Hira Nadeem", "7:46 pm", "Present"],
    ["Usman Tariq", "—", "Absent"],
  ] as const;

  return (
    <ProductCrop
      title="Member Attendance"
      subtitle="24 November 2026"
      label="Current GymKhata attendance crop with sample check-in records"
    >
      <div className="mk-attendance-summary">
        <strong>41</strong>
        <span>check-ins today</span>
        <strong>22%</strong>
        <span>of active members</span>
      </div>
      <div className="mk-product-table">
        {rows.map(([name, time, status]) => (
          <div className="mk-product-row" key={name}>
            <div className="mk-product-person">
              <strong>{name}</strong>
              <span>{time}</span>
            </div>
            <Status tone={status === "Present" ? "paid" : "muted"}>{status}</Status>
          </div>
        ))}
      </div>
    </ProductCrop>
  );
}

export function ExpensesPreview() {
  const rows = [
    ["Gym rent", "Rent", "PKR 65,000"],
    ["LESCO bill", "Utilities", "PKR 18,400"],
    ["Cable machine service", "Equipment", "PKR 7,800"],
  ] as const;

  return (
    <ProductCrop
      title="Expenses"
      subtitle="Is mahine ka total: PKR 91,200"
      label="Current GymKhata expenses crop with sample Pakistani gym costs"
    >
      <div className="mk-product-table">
        {rows.map(([name, category, amount]) => (
          <div className="mk-product-row mk-expense-row" key={name}>
            <div className="mk-product-person">
              <strong>{name}</strong>
              <span>{category}</span>
            </div>
            <strong className="mk-product-amount">{amount}</strong>
          </div>
        ))}
      </div>
      <div className="mk-expense-total">
        <span>Net after recorded expenses</span>
        <strong>PKR 192,800</strong>
      </div>
    </ProductCrop>
  );
}
