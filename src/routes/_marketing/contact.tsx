import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Check, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import type { FormEvent } from "react";

import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import { IronSection, SectionHeading } from "@/components/marketing/marketing-primitives";
import { MARKETING_CONFIG, marketingMeta, marketingWhatsAppUrl } from "@/lib/marketing-config";

export const Route = createFileRoute("/_marketing/contact")({
  head: () =>
    marketingMeta(
      "Contact",
      "Apne gym ki details share karein aur GymKhata trial, setup aur pricing ke liye WhatsApp par rabta karein.",
    ),
  component: ContactPage,
});

function ContactPage() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const message = [
      MARKETING_CONFIG.contact.defaultMessage,
      "",
      `Naam: ${String(form.get("name") ?? "").trim()}`,
      `Gym: ${String(form.get("gymName") ?? "").trim()}`,
      `Phone: ${String(form.get("phone") ?? "").trim()}`,
      `City: ${String(form.get("city") ?? "").trim()}`,
      `Message: ${String(form.get("message") ?? "").trim() || "Trial aur setup details chahiye."}`,
    ].join("\n");

    window.open(marketingWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <MarketingPageHero
        page="06"
        eyebrow="Seedha rabta"
        title="Details yahan. Baat WhatsApp par."
        copy="Form backend par save nahi hota. Submit par prefilled WhatsApp chat khulti hai; final message review karke send aap khud karte hain."
        actions={
          <div className="mk-inline-facts">
            <span>
              <Check aria-hidden="true" /> No automatic send
            </span>
            <span>
              <Check aria-hidden="true" /> No backend form storage
            </span>
          </div>
        }
      >
        <WhatsAppPreview />
      </MarketingPageHero>

      <IronSection index="01" label="Trial request">
        <div className="mk-contact-grid">
          <div>
            <SectionHeading
              eyebrow="Basic details"
              title="Form bharein. Chat kholein. Send se pehle check karein."
              copy="Public self-signup abhi available nahi. Team current trial availability, PKR pricing aur account setup confirm karegi."
              id="contact-form-title"
            />

            <form
              className="mk-contact-form"
              onSubmit={handleSubmit}
              aria-labelledby="contact-form-title"
            >
              <FormField id="contact-name" label="Aap ka naam">
                <input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  placeholder="Ali Khan"
                  required
                />
              </FormField>

              <FormField id="contact-gym" label="Gym ka naam">
                <input
                  id="contact-gym"
                  name="gymName"
                  autoComplete="organization"
                  placeholder="Iron Fitness Lahore"
                  required
                />
              </FormField>

              <FormField id="contact-phone" label="Phone / WhatsApp">
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="03XX XXXXXXX"
                  required
                />
              </FormField>

              <FormField id="contact-city" label="Shehar">
                <input
                  id="contact-city"
                  name="city"
                  autoComplete="address-level2"
                  placeholder="Lahore"
                  required
                />
              </FormField>

              <FormField id="contact-message" label="Message" wide>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Members kitne hain, ya kis screen ki detail chahiye?"
                  rows={5}
                />
              </FormField>

              <div className="mk-form-submit">
                <button type="submit" className="mk-button">
                  WhatsApp chat kholein <Send aria-hidden="true" />
                </button>
                <p>
                  Submit se message automatically send nahi hota. Final send WhatsApp mein aap
                  karenge.
                </p>
              </div>
            </form>
          </div>

          <aside className="mk-contact-rails" aria-label="Contact options">
            <article>
              <MessageCircle aria-hidden="true" />
              <span>Preferred</span>
              <h3>WhatsApp</h3>
              <p>
                Trial aur setup ke liye configured number: +
                {MARKETING_CONFIG.contact.whatsappNumber}
              </p>
              <a href={marketingWhatsAppUrl()} target="_blank" rel="noreferrer">
                Direct chat <ArrowUpRight aria-hidden="true" />
              </a>
            </article>

            <article>
              <Mail aria-hidden="true" />
              <span>Alternate</span>
              <h3>Email</h3>
              <p>Detailed question email par bhejna ho to:</p>
              <a href={`mailto:${MARKETING_CONFIG.contact.email}`}>
                {MARKETING_CONFIG.contact.email}
              </a>
            </article>

            <article>
              <MapPin aria-hidden="true" />
              <span>Context</span>
              <h3>Pakistan-first setup</h3>
              <p>
                PKR records, Roman Urdu/English interface aur local gym workflow ke context mein
                demo.
              </p>
            </article>
          </aside>
        </div>
      </IronSection>
    </>
  );
}

function FormField({
  id,
  label,
  wide = false,
  children,
}: {
  id: string;
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "mk-field mk-field-wide" : "mk-field"}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function WhatsAppPreview() {
  return (
    <div
      className="mk-whatsapp-preview"
      role="img"
      aria-label="Prefilled GymKhata WhatsApp inquiry preview"
    >
      <div className="mk-whatsapp-head">
        <MessageCircle aria-hidden="true" />
        <div>
          <strong>GymKhata inquiry</strong>
          <span>Prefilled · not sent</span>
        </div>
      </div>
      <div className="mk-whatsapp-body">
        <div className="mk-whatsapp-message">
          <p>Assalam o alaikum! Mujhe GymKhata ke bare mein maloomat chahiye.</p>
          <span>Naam: Ali Khan</span>
          <span>Gym: Iron Fitness Lahore</span>
          <span>City: Lahore</span>
        </div>
        <div className="mk-whatsapp-review">
          Message review karein <Send aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
