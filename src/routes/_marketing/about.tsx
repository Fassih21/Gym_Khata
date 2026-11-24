import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import {
  FactLine,
  IronSection,
  MarketingButton,
  SectionHeading,
} from "@/components/marketing/marketing-primitives";
import { MARKETING_CONFIG, marketingMeta } from "@/lib/marketing-config";

export const Route = createFileRoute("/_marketing/about")({
  head: () =>
    marketingMeta(
      "About",
      "GymKhata ka Pakistani gym owners ke liye simple, honest gym operations mission.",
    ),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <MarketingPageHero
        page="05"
        eyebrow="About GymKhata"
        title="Gym floor ki routine se design."
        copy="Focus simple hai: owner ko roz ka operational hisaab samajhne ke liye copies, calculator aur endless WhatsApp scroll par depend na karna pare."
        actions={
          <MarketingButton to="/contact">
            Product discuss karein <ArrowRight aria-hidden="true" />
          </MarketingButton>
        }
      >
        <DashboardPreview compact />
      </MarketingPageHero>

      <IronSection index="01" label="Why this exists">
        <div className="mk-story-grid">
          <SectionHeading
            eyebrow={MARKETING_CONFIG.about.storyLabel}
            title="Gym modern ho to hisaab bhi floor ki speed par ho."
          />
          <div className="mk-story-copy">
            <p>{MARKETING_CONFIG.about.story}</p>
          </div>
        </div>
      </IronSection>

      <IronSection index="02" label="Mission" tone="solid">
        <div className="mk-mission-block">
          <span>MISSION / PK</span>
          <h2>Software jo gym owner ki language aur routine samjhe.</h2>
          <p>{MARKETING_CONFIG.about.mission}</p>
        </div>
      </IronSection>

      <IronSection index="03" label="Product rules" tone="panel">
        <div className="mk-split">
          <SectionHeading
            eyebrow="How decisions are made"
            title="Shiny extras se pehle daily work."
            copy="Product direction teen grounded rules par rehti hai."
          />
          <div>
            <FactLine number="01" title="Local language">
              Roman Urdu + English mix, PKR amounts aur familiar gym vocabulary.
            </FactLine>
            <FactLine number="02" title="Honest capability">
              Future idea ko current feature bana kar market nahi karna.
            </FactLine>
            <FactLine number="03" title="Daily work first">
              Members, dues, hazri, salaries aur expenses ko pehle clear rakhna.
            </FactLine>
          </div>
        </div>
      </IronSection>

      <IronSection index="04" label="Pakistan context">
        <div className="mk-context-grid">
          <div>
            <span>PKR</span>
            <h3>Local money</h3>
            <p>Fees, plans, salary aur expenses PKR workflow ke saath.</p>
          </div>
          <div>
            <span>RU</span>
            <h3>Familiar copy</h3>
            <p>Actions seedhi Roman Urdu/English mein, training manual jaisi language nahi.</p>
          </div>
          <div>
            <span>WA</span>
            <h3>Owner-controlled WhatsApp</h3>
            <p>Prefilled reminder, final review aur send gym owner ke haath mein.</p>
          </div>
        </div>
      </IronSection>

      <section className="mk-closing-cta" aria-labelledby="about-closing-title">
        <div className="mk-content">
          <p className="mk-kicker">Your floor, your workflow</p>
          <h2 id="about-closing-title">
            Apni gym routine batayein. Product us context mein dekhein.
          </h2>
          <p>Team trial availability aur setup WhatsApp par confirm karegi.</p>
          <MarketingButton to="/contact">
            Rabta karein <ArrowRight aria-hidden="true" />
          </MarketingButton>
        </div>
      </section>
    </>
  );
}
