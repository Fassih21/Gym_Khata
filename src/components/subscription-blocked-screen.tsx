import { LockKeyhole, MessageCircle } from "lucide-react";

import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SUPPORT_MESSAGE, SUPPORT_WHATSAPP } from "@/lib/config";
import { whatsappLink } from "@/lib/format";

export function SubscriptionBlockedScreen({ reason }: { reason: "suspended" | "expired" }) {
  const expired = reason === "expired";
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-sidebar px-6 text-center text-sidebar-foreground">
      <LogoMark className="size-12 text-sidebar-foreground" />
      <div className="mt-6 flex size-14 items-center justify-center rounded-2xl bg-primary/15">
        <LockKeyhole className="size-7 text-primary" />
      </div>
      <h1 className="display-num mt-6 text-4xl tracking-wide">
        {expired ? "Subscription mukammal ho gayi" : "Account suspended hai"}
      </h1>
      <p className="mt-3 max-w-sm text-sm text-sidebar-foreground/70">
        {expired
          ? "Aap ki GymKhata subscription khatam ho chuki hai. Data mehfooz hai — renew karne ke baad sab kuch waisa ka waisa milega."
          : "Is waqt aap ka gym account suspend kiya gaya hai. Details ke liye support se rabta karein."}
      </p>
      <a
        href={whatsappLink(SUPPORT_WHATSAPP, SUPPORT_MESSAGE)}
        target="_blank"
        rel="noreferrer"
        className="mt-8"
      >
        <Button size="lg" className="h-12 px-6 text-base font-semibold">
          <MessageCircle className="size-5" />
          WhatsApp par rabta karein
        </Button>
      </a>
    </div>
  );
}
