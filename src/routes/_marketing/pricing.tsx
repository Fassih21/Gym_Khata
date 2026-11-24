import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import {
  FactLine,
  IronSection,
  MarketingButton,
  SectionHeading,
} from "@/components/marketing/marketing-primitives";
import { MARKETING_CONFIG, marketingMeta } from "@/lib/marketing-config";

export const Route = createFileRoute("/_marketing/pricing")({
  head: () =>
    marketingMeta(
      "Pricing",
      "GymKhata ke PKR access packages, included features aur subscription process dekhein.",
    ),
  component: PricingPage,
});

function PricingPage() {
  return (
    <>
      <MarketingPageHero
        page="03"
        eyebrow="PKR access packages"
        title="Same app. Billing cycle aapki."
        copy="Har package mein current GymKhata toolkit same hai. Farq access period aur ek dafa billing amount ka hai."
        actions={
          <MarketingButton to="/contact">
            Trial ka poochhein <ArrowRight aria-hidden="true" />
          </MarketingButton>
        }
      >
        <PricingBoard />
      </MarketingPageHero>

      <IronSection index="01" label="Access packages">
        <SectionHeading
          eyebrow="No feature maze"
          title="Apne planning cycle ke mutabiq choose karein."
          copy={MARKETING_CONFIG.pricing.notice}
        />
        <div className="mk-plan-stack">
          {MARKETING_CONFIG.pricing.plans.map((plan, index) => (
            <article
              className={plan.highlighted ? "mk-plan-row is-highlighted" : "mk-plan-row"}
              key={plan.id}
            >
              <span className="mk-plan-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="mk-plan-copy">
                {plan.highlighted ? <span className="mk-plan-flag">Recommended cycle</span> : null}
                <h2>{plan.name}</h2>
                <p>{plan.summary}</p>
              </div>
              <div className="mk-plan-price">
                <strong>PKR {plan.pricePkr.toLocaleString("en-PK")}</strong>
                <span>{plan.billingLabel}</span>
              </div>
              <MarketingButton to="/contact" secondary={!plan.highlighted}>
                Trial request
              </MarketingButton>
            </article>
          ))}
        </div>
      </IronSection>

      <IronSection index="02" label="Included" tone="panel">
        <div className="mk-included-grid">
          <SectionHeading
            eyebrow="Har cycle mein"
            title="Toolkit cut nahi hota."
            copy="Monthly ho ya yearly, current core workflows package ke andar rehte hain."
          />
          <ul className="mk-included-list">
            {MARKETING_CONFIG.pricing.includedFeatures.map((feature, index) => (
              <li key={feature}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Check aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </IronSection>

      <IronSection index="03" label="Two plan types">
        <div className="mk-split">
          <SectionHeading
            eyebrow="Naam same, job alag"
            title="Software access aur member membership ko mix na karein."
            copy="Is page ke packages GymKhata access ke liye hain. App ke andar Membership Plans aapke gym customers ke rates aur duration hain."
          />
          <div>
            <FactLine number="A" title="GymKhata access">
              Team owner account set karti hai aur subscription end date record hoti hai.
            </FactLine>
            <FactLine number="B" title="Member plans">
              Aap Monthly, Quarterly, Yearly ya custom duration aur PKR price banate hain.
            </FactLine>
          </div>
        </div>
      </IronSection>

      <IronSection index="04" label="Current flow" tone="solid">
        <SectionHeading
          eyebrow="Checkout ke bajaye human setup"
          title="Request. Confirm. Access."
          copy="Current app mein public signup ya online checkout nahi. Account setup WhatsApp conversation ke baad hota hai."
        />
        <ol className="mk-process-line">
          <li>
            <span>01</span>
            <div>
              <h3>Request</h3>
              <p>Contact form prefilled WhatsApp message banata hai; send aap khud karte hain.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Account setup</h3>
              <p>Team owner login create karti hai aur current offer confirm karti hai.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Access period</h3>
              <p>
                Subscription end date account ke saath record hoti hai; renewal support se extend
                hota hai.
              </p>
            </div>
          </li>
        </ol>
      </IronSection>

      <section className="mk-closing-cta" aria-labelledby="pricing-closing-title">
        <div className="mk-content">
          <p className="mk-kicker">Final amount confirm karein</p>
          <h2 id="pricing-closing-title">Apna preferred cycle aur gym details bhejein.</h2>
          <p>
            Team trial availability, account setup aur current pricing WhatsApp par confirm karegi.
          </p>
          <MarketingButton to="/contact">
            WhatsApp form kholein <ArrowRight aria-hidden="true" />
          </MarketingButton>
        </div>
      </section>
    </>
  );
}

function PricingBoard() {
  return (
    <div className="mk-pricing-board" role="img" aria-label="GymKhata PKR access packages">
      <div className="mk-pricing-board-head">
        <span>Access / PKR</span>
        <span>Same toolkit</span>
      </div>
      {MARKETING_CONFIG.pricing.plans.map((plan) => (
        <div className={plan.highlighted ? "is-highlighted" : undefined} key={plan.id}>
          <span>{plan.name}</span>
          <strong>{plan.pricePkr.toLocaleString("en-PK")}</strong>
          <small>{plan.billingLabel}</small>
        </div>
      ))}
      <p>Account setup WhatsApp par confirm hota hai.</p>
    </div>
  );
}
