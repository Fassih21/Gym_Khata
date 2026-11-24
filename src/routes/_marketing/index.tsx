import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Download, MessageCircle } from "lucide-react";

import {
  DashboardPreview,
  FeesPreview,
  MembersPreview,
} from "@/components/marketing/dashboard-preview";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import {
  FactLine,
  IronSection,
  MarketingButton,
  SectionHeading,
} from "@/components/marketing/marketing-primitives";
import { MARKETING_CONFIG, marketingMeta } from "@/lib/marketing-config";

export const Route = createFileRoute("/_marketing/")({
  head: () =>
    marketingMeta(
      "Gym ka hisaab, floor se clear",
      "Pakistani gym owners ke liye members, fees, attendance, salaries aur expenses ka simple record.",
    ),
  component: HomePage,
});

const workRows = [
  {
    number: "01",
    title: "Member record",
    copy: "Naam, phone, plan, join date aur membership expiry ek searchable list mein.",
  },
  {
    number: "02",
    title: "Fees & dues",
    copy: "Month-wise paid, pending, overdue aur covered status — saath one-tap WhatsApp reminder.",
  },
  {
    number: "03",
    title: "Attendance",
    copy: "Members ke daily check-ins aur employees ki present, absent, leave hazri.",
  },
  {
    number: "04",
    title: "Expenses & salary",
    copy: "Rent, bijli, equipment, staff salary aur month ka net result.",
  },
  {
    number: "05",
    title: "Reports & export",
    copy: "Dues, payments aur expenses CSV; full account data ZIP export.",
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Details bhejein",
    copy: "Contact form aapki gym details ke saath WhatsApp chat kholta hai. Message aap khud send karte hain.",
  },
  {
    number: "02",
    title: "Account setup",
    copy: "Team owner login set karti hai. Public self-signup current app ka hissa nahi.",
  },
  {
    number: "03",
    title: "Roz ka record",
    copy: "Members, fees, hazri aur kharcha update karein; dashboard month ka khulasa dikhata hai.",
  },
] as const;

const teaserFaqs = [
  {
    question: "Kya phone par chalta hai?",
    answer: "Haan. Current interface mobile aur desktop browser dono ke liye responsive hai.",
  },
  {
    question: "WhatsApp reminder automatic jata hai?",
    answer:
      "Nahi. Prefilled chat khulti hai; final message owner khud review karke send karta hai.",
  },
  {
    question: "Kya app payment collect karta hai?",
    answer: "Nahi. GymKhata received fees ka record rakhta hai; online payment gateway nahi.",
  },
] as const;

function HomePage() {
  const featuredPlan =
    MARKETING_CONFIG.pricing.plans.find((plan) => plan.highlighted) ??
    MARKETING_CONFIG.pricing.plans[0];

  return (
    <>
      <MarketingPageHero
        page="01"
        eyebrow={MARKETING_CONFIG.brand.eyebrow}
        title="Gym ka hisaab. Floor se clear."
        copy="Members, fees, attendance, salaries aur expenses — ek aisi screen par jo gym owner ko register palatne ke bajaye seedha jawab de."
        actions={
          <>
            <MarketingButton to="/contact">
              Trial ka poochhein <ArrowRight aria-hidden="true" />
            </MarketingButton>
            <MarketingButton to="/features" secondary>
              App ke kaam dekhein
            </MarketingButton>
          </>
        }
      >
        <FeesPreview compact />
      </MarketingPageHero>

      <IronSection index="02" label="Daily load" id="daily-load">
        <div className="mk-split">
          <SectionHeading
            eyebrow="Roz ka friction"
            title="Sawaal chhota. Record bikhra ho to jawab slow."
            copy="Fee kis ki baqi hai, membership kab khatam hogi, aur is month kitna kharcha hua — ye floor ke beech guess nahi hona chahiye."
          />
          <div>
            <FactLine number="01" title="Register search">
              Purana page aur fee entry dhoondhne mein counter ka waqt jata hai.
            </FactLine>
            <FactLine number="02" title="WhatsApp scroll">
              Payment message milta hai, magar month aur member record alag reh jata hai.
            </FactLine>
            <FactLine number="03" title="Month-end total">
              Salary, rent aur fees alag jagah hon to net result dobara jorna parta hai.
            </FactLine>
          </div>
        </div>
      </IronSection>

      <IronSection index="03" label="Core work" tone="panel">
        <div className="mk-showcase-grid">
          <div>
            <SectionHeading
              eyebrow="Current product"
              title="Jo kaam roz hota hai, wohi front par."
              copy="No imaginary automation. Neeche wohi workflows hain jo current GymKhata app mein maujood hain."
            />
            <div className="mk-feature-list">
              {workRows.map((item) => (
                <article className="mk-feature-row" key={item.number}>
                  <span>{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </article>
              ))}
            </div>
            <MarketingButton to="/features" secondary>
              Saare workflows <ArrowRight aria-hidden="true" />
            </MarketingButton>
          </div>
          <MembersPreview />
        </div>
      </IronSection>

      <IronSection index="04" label="Setup line">
        <SectionHeading
          eyebrow="Human setup"
          title="Teen moves. Phir roz ka record."
          copy="Public signup aur automatic checkout ka claim nahi. Current access flow seedha support-led setup hai."
        />
        <ol className="mk-process-line">
          {steps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </IronSection>

      <IronSection index="05" label="Product crop" tone="solid">
        <div className="mk-product-proof-grid">
          <div>
            <SectionHeading
              eyebrow="Selected month"
              title="Numbers jama nahi. Samajh aane chahiye."
              copy="Fees collected, recorded expenses, active members aur unpaid fees ek month view mein. Preview par sample data saaf label kiya gaya hai."
            />
            <ul className="mk-check-list">
              <li>
                <Check aria-hidden="true" /> Har gym apne scoped login se apna record dekhta hai.
              </li>
              <li>
                <Download aria-hidden="true" /> Dues, payments aur expenses CSV download hote hain.
              </li>
              <li>
                <MessageCircle aria-hidden="true" /> Reminder chat owner ke review ke baad send hoti
                hai.
              </li>
            </ul>
          </div>
          <DashboardPreview />
        </div>
      </IronSection>

      <IronSection index="06" label="Access price" tone="panel">
        <div className="mk-price-callout">
          <div>
            <p className="mk-kicker">Same toolkit, different period</p>
            <h2>Feature maze nahi. Sirf billing cycle choose karein.</h2>
            <p>{MARKETING_CONFIG.pricing.notice}</p>
          </div>
          {featuredPlan ? (
            <div className="mk-price-block">
              <span>{featuredPlan.name}</span>
              <strong>PKR {featuredPlan.pricePkr.toLocaleString("en-PK")}</strong>
              <small>{featuredPlan.billingLabel}</small>
              <MarketingButton to="/pricing">Pricing dekhein</MarketingButton>
            </div>
          ) : null}
        </div>
      </IronSection>

      <IronSection index="07" label="Short answers">
        <div className="mk-faq-teaser-grid">
          <SectionHeading
            eyebrow="Trial se pehle"
            title="Jo poochna hai, seedha poochhein."
            copy="Claims current product ke mutabiq rakhe gaye hain."
          />
          <div className="mk-faq-teaser-list">
            {teaserFaqs.map((item, index) => (
              <article key={item.question}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              </article>
            ))}
            <MarketingButton to="/faq" secondary>
              Poora FAQ <ArrowRight aria-hidden="true" />
            </MarketingButton>
          </div>
        </div>
      </IronSection>

      <section className="mk-closing-cta" aria-labelledby="home-closing-title">
        <div className="mk-content">
          <p className="mk-kicker">Agla set</p>
          <h2 id="home-closing-title">Apne gym ka current hisaab flow WhatsApp par batayein.</h2>
          <p>Team trial availability, account setup aur final details confirm karegi.</p>
          <MarketingButton to="/contact">
            Details bhejein <ArrowRight aria-hidden="true" />
          </MarketingButton>
        </div>
      </section>
    </>
  );
}
