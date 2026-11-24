import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { MARKETING_CONFIG, marketingWhatsAppUrl } from "@/lib/marketing-config";
import { cn } from "@/lib/utils";

import "./marketing-theme.css";

type MarketingTheme = "dark" | "light";

const footerGroups = [
  {
    label: "Product",
    links: [
      { label: "Features", to: "/features" as const },
      { label: "Pricing", to: "/pricing" as const },
      { label: "FAQ", to: "/faq" as const },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", to: "/about" as const },
      { label: "Contact", to: "/contact" as const },
      { label: "Owner login", to: "/login" as const },
    ],
  },
] as const;

function IronMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M7 5h7v31H7zM34 5h7v31h-7zM7 9h34v6H7z" fill="currentColor" />
      <path d="M3 36h42v7H3z" fill="var(--mk-safety)" />
      <path d="M17 20h14v5H17zM20 17h8v11h-8z" fill="var(--mk-bg)" />
    </svg>
  );
}

function BrandLink({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("mk-brand-link", className)}
      aria-label={`${MARKETING_CONFIG.brand.name} home`}
    >
      <IronMark className="mk-brand-mark" />
      <span className="mk-brand-copy">
        <span className="mk-brand-name">{MARKETING_CONFIG.brand.name}</span>
        <span className="mk-brand-tagline">Gym floor. Clear hisaab.</span>
      </span>
    </Link>
  );
}

function NavigationLinks({ mobile = false, close }: { mobile?: boolean; close?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return MARKETING_CONFIG.navLinks.map((item, index) => (
    <Link
      key={item.to}
      to={item.to}
      aria-current={pathname === item.to ? "page" : undefined}
      className="mk-nav-link"
      onClick={mobile ? close : undefined}
    >
      <span className="mk-nav-index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span>{item.label}</span>
    </Link>
  ));
}

function ThemeToggle({ theme, onToggle }: { theme: MarketingTheme; onToggle: () => void }) {
  const dark = theme === "dark";

  return (
    <button
      type="button"
      className="mk-icon-button"
      aria-label={dark ? "Light mode use karein" : "Dark mode use karein"}
      aria-pressed={!dark}
      title={dark ? "Light mode" : "Dark mode"}
      onClick={onToggle}
    >
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}

function AccountLink({ authenticated }: { authenticated: boolean }) {
  return (
    <Link className="mk-account-link" to={authenticated ? "/dashboard" : "/login"}>
      {authenticated ? "Dashboard" : "Owner login"}
    </Link>
  );
}

export function MarketingLayout({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<MarketingTheme>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gymkhata-marketing-theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      // Storage can be unavailable; the dark-first default still works.
    }
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setAuthenticated(Boolean(data.user));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthenticated(Boolean(session?.user));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("gymkhata-marketing-theme", next);
      } catch {
        // The in-page toggle still works without storage.
      }
      return next;
    });
  };

  return (
    <div className="marketing-shell" data-mk-theme={theme}>
      <a href="#main-content" className="mk-skip-link">
        Main content par jayen
      </a>

      <header className="mk-site-header">
        <nav className="mk-nav-wrap" aria-label="Main navigation">
          <BrandLink />
          <div className="mk-desktop-nav">
            <NavigationLinks />
          </div>
          <div className="mk-header-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <AccountLink authenticated={authenticated} />
            <Link className="mk-contact-link" to="/contact">
              Trial ka poochhein
            </Link>
          </div>
          <div className="mk-mobile-controls">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              type="button"
              className="mk-icon-button"
              aria-label={menuOpen ? "Menu band karein" : "Menu kholein"}
              aria-expanded={menuOpen}
              aria-controls="marketing-mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </nav>

        {menuOpen ? (
          <div className="mk-mobile-panel" id="marketing-mobile-menu">
            <div className="mk-mobile-panel-inner">
              <nav className="mk-mobile-nav" aria-label="Mobile navigation">
                <NavigationLinks mobile close={() => setMenuOpen(false)} />
              </nav>
              <div className="mk-mobile-actions">
                <AccountLink authenticated={authenticated} />
                <Link className="mk-contact-link" to="/contact" onClick={() => setMenuOpen(false)}>
                  Trial ka poochhein
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main id="main-content" className="mk-main" tabIndex={-1}>
        {children}
      </main>

      <footer className="mk-footer">
        <div className="mk-footer-stripe" aria-hidden="true" />
        <div className="mk-footer-inner">
          <div className="mk-footer-lead">
            <div>
              <p className="mk-kicker">Next set</p>
              <h2 className="mk-footer-title">Gym floor busy rakhein. Hisaab clear rakhein.</h2>
            </div>
            <a className="mk-button" href={marketingWhatsAppUrl()} target="_blank" rel="noreferrer">
              WhatsApp par baat karein <ArrowUpRight aria-hidden="true" />
            </a>
          </div>

          <div className="mk-footer-directory">
            <div className="mk-footer-brand">
              <BrandLink />
              <p className="mk-footer-description">{MARKETING_CONFIG.brand.description}</p>
            </div>
            {footerGroups.map((group) => (
              <div key={group.label}>
                <h2 className="mk-footer-heading">{group.label}</h2>
                <div className="mk-footer-links">
                  {group.links.map((item) => (
                    <Link key={item.to} to={item.to}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <h2 className="mk-footer-heading">Rabta</h2>
              <div className="mk-footer-links">
                <a href={`mailto:${MARKETING_CONFIG.contact.email}`}>
                  {MARKETING_CONFIG.contact.email}
                </a>
                <a href={marketingWhatsAppUrl()} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="mk-footer-base">
            <span>
              © {new Date().getFullYear()} {MARKETING_CONFIG.brand.name}. All rights reserved.
            </span>
            <span>{MARKETING_CONFIG.brand.madeIn}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
