import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import {
  IronSection,
  MarketingButton,
  SectionHeading,
} from "@/components/marketing/marketing-primitives";
import { MARKETING_CONFIG, marketingMeta } from "@/lib/marketing-config";

export const Route = createFileRoute("/_marketing/faq")({
  head: () =>
    marketingMeta(
      "FAQ",
      "GymKhata ke data access, mobile use, trial, WhatsApp reminders, payments, plans, attendance aur exports ke seedhe jawab.",
    ),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <MarketingPageHero
        page="04"
        eyebrow="Frequently asked questions"
        title="Seedhe sawaal. Current product ke jawab."
        copy="Automatic reminders, online collection aur native mobile app jaise features ka claim nahi. Jo current app karta hai, wohi neeche likha hai."
        actions={
          <MarketingButton to="/contact" secondary>
            Apna sawaal bhejein <ArrowRight aria-hidden="true" />
          </MarketingButton>
        }
      >
        <FaqIndex />
      </MarketingPageHero>

      <IronSection index="01" label="Answers">
        <div className="mk-faq-layout">
          <div className="mk-faq-intro">
            <SectionHeading
              eyebrow="Trial se pehle"
              title="Jo operational detail matter karti hai."
              copy="Trial duration aur setup team contact par confirm karti hai. WhatsApp form backend par details save nahi karta."
            />
            <p className="mk-faq-note">
              Jawab nahi mila? Contact form se apna exact workflow bhejein.
            </p>
          </div>
          <div className="mk-faq-list">
            {MARKETING_CONFIG.faq.map((item, index) => (
              <details className="mk-faq-item" key={item.question}>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.question}</strong>
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </IronSection>

      <section className="mk-closing-cta" aria-labelledby="faq-closing-title">
        <div className="mk-content">
          <p className="mk-kicker">Apna case batayein</p>
          <h2 id="faq-closing-title">Gym ka current workflow do lines mein bhejein.</h2>
          <p>Team account setup, trial availability aur relevant screens explain karegi.</p>
          <MarketingButton to="/contact">
            Contact form <ArrowRight aria-hidden="true" />
          </MarketingButton>
        </div>
      </section>
    </>
  );
}

function FaqIndex() {
  const items = ["Phone use", "WhatsApp flow", "Data export", "Membership plans"];

  return (
    <div className="mk-faq-index" role="img" aria-label="GymKhata frequently asked question index">
      <div>
        <span>FAQ / 10</span>
        <strong>Current product</strong>
      </div>
      {items.map((item, index) => (
        <p key={item}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          {item}
          <i aria-hidden="true">+</i>
        </p>
      ))}
    </div>
  );
}
