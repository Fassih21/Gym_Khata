import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Download } from "lucide-react";
import type { ReactNode } from "react";

import {
  AttendancePreview,
  DashboardPreview,
  ExpensesPreview,
  FeesPreview,
  MembersPreview,
} from "@/components/marketing/dashboard-preview";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import {
  IronSection,
  MarketingButton,
  SectionHeading,
} from "@/components/marketing/marketing-primitives";
import { marketingMeta } from "@/lib/marketing-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_marketing/features")({
  head: () =>
    marketingMeta(
      "Features",
      "GymKhata ke verified members, fees, attendance, expenses, employees, plans aur reporting tools dekhein.",
    ),
  component: FeaturesPage,
});

const sectionLinks = [
  { label: "Members", href: "#members" },
  { label: "Fees", href: "#fees" },
  { label: "Attendance", href: "#attendance" },
  { label: "Operations", href: "#operations" },
  { label: "Reports", href: "#reports" },
  { label: "Export", href: "#settings" },
] as const;

function FeaturesPage() {
  return (
    <>
      <MarketingPageHero
        page="02"
        eyebrow="Verified in the current app"
        title="Har screen ka ek floor job."
        copy="Members se month-end report tak — yahan sirf woh capabilities hain jo current GymKhata app mein maujood hain. Automatic sending, payment gateway ya native app ka claim nahi."
        actions={
          <>
            <MarketingButton to="/contact">
              Trial request <ArrowRight aria-hidden="true" />
            </MarketingButton>
            <MarketingButton to="/pricing" secondary>
              Pricing dekhein
            </MarketingButton>
          </>
        }
      >
        <MembersPreview compact />
      </MarketingPageHero>

      <nav className="mk-anchor-nav" aria-label="Feature sections">
        <div className="mk-content">
          {sectionLinks.map((item, index) => (
            <a key={item.href} href={item.href}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <IronSection index="01" label="Members" id="members">
        <FeatureBand
          eyebrow="Member directory"
          title="Naam ya phone likhein. Record foran."
          copy="Current aur inactive member history ek searchable, page-wise list mein rehti hai."
          points={[
            "Naam, phone, address aur join date",
            "Membership plan aur expiry date",
            "Active/inactive status without deleting history",
            "Current month ka paid, due, overdue, expired ya covered state",
          ]}
          preview={<MembersPreview />}
        />
      </IronSection>

      <IronSection index="02" label="Fees" id="fees" tone="panel">
        <FeatureBand
          reverse
          eyebrow="Fees & pending dues"
          title="Kis ne diya. Kis ki baqi. Kis month ki."
          copy="Fees screen selected month ke mutabiq status nikalti hai aur overdue member ke liye prefilled WhatsApp chat kholti hai."
          points={[
            "Paid, pending, overdue, expired aur covered states",
            "Payment amount, method, month aur note",
            "Expired membership ke saath renewal flow",
            "Owner-reviewed WhatsApp reminder; automatic send nahi",
          ]}
          preview={<FeesPreview />}
        />
      </IronSection>

      <IronSection index="03" label="Attendance" id="attendance">
        <FeatureBand
          eyebrow="Daily hazri"
          title="Check-in ka din aur month dono nazar mein."
          copy="Members ki date-wise check-in history aur employees ki present, absent, leave attendance alag workflows mein."
          points={[
            "Member daily check-in",
            "Monthly visit count",
            "Employee Present, Absent aur Leave",
            "Selected month ki employee summary",
          ]}
          preview={<AttendancePreview />}
        />
      </IronSection>

      <IronSection index="04" label="Operations" id="operations" tone="panel">
        <FeatureBand
          reverse
          eyebrow="Expenses & team"
          title="Rent se trainer salary tak, month ke andar."
          copy="Gym ke operating costs aur employees ka salary record dashboard ke selected month ke saath jura rehta hai."
          points={[
            "Expense category, amount, date aur note",
            "Employee role, phone aur monthly salary",
            "Paid/pending salary state",
            "Expense totals mein salaries ka clear treatment",
          ]}
          preview={<ExpensesPreview />}
        />
      </IronSection>

      <IronSection index="05" label="Reports" id="reports" tone="solid">
        <FeatureBand
          eyebrow="Dashboard & reports"
          title="Month select karein. Khulasa ek jagah."
          copy="Fees, expenses, active members, unpaid dues, membership expiry aur salary progress selected month ke context mein."
          points={[
            "Fees collected aur recorded expenses",
            "Active, unpaid aur overdue member counts",
            "Revenue vs expense trend",
            "Dues, payments aur expenses CSV",
          ]}
          preview={<DashboardPreview />}
        />
      </IronSection>

      <IronSection index="06" label="Plans & export" id="settings">
        <div className="mk-export-grid">
          <div>
            <SectionHeading
              eyebrow="Owner controls"
              title="Membership plans aapke. Data export bhi."
              copy="Gym owner custom duration aur PKR price ke plans manage kar sakta hai, aur Settings se account data ZIP download kar sakta hai."
            />
            <ul className="mk-check-list">
              <li>
                <Check aria-hidden="true" /> Monthly, quarterly, yearly ya custom month duration
              </li>
              <li>
                <Check aria-hidden="true" /> Plan active/inactive state without losing old records
              </li>
              <li>
                <Check aria-hidden="true" /> Members, plans, fees, expenses, employees aur
                attendance export
              </li>
            </ul>
            <MarketingButton to="/contact">
              Apna workflow discuss karein <ArrowRight aria-hidden="true" />
            </MarketingButton>
          </div>
          <div
            className="mk-export-board"
            role="img"
            aria-label="Current GymKhata data export panel"
          >
            <div className="mk-export-head">
              <div>
                <p>Full account export</p>
                <span>Settings / Data</span>
              </div>
              <Download aria-hidden="true" />
            </div>
            {[
              ["members.csv", "186 rows"],
              ["payments.csv", "1,042 rows"],
              ["expenses.csv", "94 rows"],
              ["attendance.csv", "3,816 rows"],
            ].map(([name, rows]) => (
              <div className="mk-export-row" key={name}>
                <span>{name}</span>
                <strong>{rows}</strong>
              </div>
            ))}
            <div className="mk-export-file">gymkhata-iron-fitness-export.zip</div>
          </div>
        </div>
      </IronSection>
    </>
  );
}

function FeatureBand({
  eyebrow,
  title,
  copy,
  points,
  preview,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  points: string[];
  preview: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={cn("mk-feature-band", reverse && "mk-feature-band-reverse")}>
      <div className="mk-feature-copy">
        <SectionHeading eyebrow={eyebrow} title={title} copy={copy} />
        <ul className="mk-point-list">
          {points.map((point) => (
            <li key={point}>
              <span aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className="mk-feature-preview">{preview}</div>
    </div>
  );
}
