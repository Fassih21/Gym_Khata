export const MARKETING_CONFIG = {
  brand: {
    name: "GymKhata",
    tagline: "Gym ka hisaab, ek jagah.",
    eyebrow: "Pakistan ke gym owners ke liye",
    description: "Members, fees, attendance aur roz ka kharcha — simple Roman Urdu mein.",
    madeIn: "Made in Pakistan",
  },
  contact: {
    whatsappNumber: "923284872578",
    email: "hello@gymkhata.pk",
    defaultMessage: "Assalam o alaikum! Mujhe GymKhata ke bare mein maloomat chahiye.",
  },
  about: {
    storyLabel: "Why GymKhata",
    story:
      "Gym floor fast hota hai: member aa raha hai, trainer busy hai, fee follow-up chal raha hai. Jab record register, copies aur WhatsApp messages mein bikhra ho to owner ko simple jawab ke liye bhi rukna parta hai. GymKhata isi daily operations gap ko ek focused browser-based system mein rakhta hai.",
    mission:
      "Pakistani gym owners ko ek aisa daily operations tool dena jo unki language, PKR workflow aur real ground routine ko samjhe — aur feature claims hamesha product ki asal capability ke mutabiq rakhe.",
  },
  faq: [
    {
      question: "Kya mera gym data doosre gyms se alag rehta hai?",
      answer:
        "Haan. Current app Supabase login aur row-level access rules use karta hai, aur har gym apne scoped login se apna record dekhta hai. Apni login details private rakhna phir bhi zaroori hai.",
    },
    {
      question: "Free trial kitne din ka hai?",
      answer:
        "Trial availability aur duration abhi config mein fixed claim nahi ki gayi. Contact form bhejein; team current offer aur setup details WhatsApp par confirm karegi.",
    },
    {
      question: "Kya GymKhata phone par chalta hai?",
      answer:
        "Haan. Current interface responsive hai aur mobile ya desktop browser mein use ho sakta hai. Separate native Android/iPhone app ka claim nahi kiya gaya.",
    },
    {
      question: "Kya WhatsApp reminders automatic jate hain?",
      answer:
        "Nahi. Fees page one-tap prefilled WhatsApp chat kholta hai. Owner message review karke khud send karta hai; scheduled ya automatic sending current feature nahi hai.",
    },
    {
      question: "Kya main subscription cancel anytime kar sakta hoon?",
      answer:
        "Current app mein self-service billing ya cancel button nahi hai. Subscription access end date se controlled hai; cancellation ya renewal ke liye team se contact karein.",
    },
    {
      question: "Kya app member se online payment collect karta hai?",
      answer:
        "Nahi. GymKhata cash, bank ya kisi aur channel se milne wali fees ka record rakhta hai; current app payment gateway ya online collection process nahi karta.",
    },
    {
      question: "Kya apne membership plans bana sakta hoon?",
      answer:
        "Haan. Gym owner plan ka naam, duration in months aur PKR price set, edit aur active/inactive kar sakta hai. Monthly, quarterly, yearly aur custom plans possible hain.",
    },
    {
      question: "Attendance members aur employees dono ki hai?",
      answer:
        "Haan. Members ke liye date-wise check-in aur monthly visits hain. Employees ke liye Present, Absent aur Leave ke saath monthly summary hai.",
    },
    {
      question: "Kya data export ho sakta hai?",
      answer:
        "Haan. Reports se dues, payments aur expenses CSV milte hain. Settings se members, plans, payments, expenses, employees, salaries aur attendance ki CSV files ek ZIP mein download hoti hain.",
    },
    {
      question: "Kya member aur employee photos upload hoti hain?",
      answer:
        "Schema aur private photo utilities maujood hain, lekin current member/employee screens initials dikhati hain aur user-facing upload flow present nahi hai. Full export image file nahi, sirf saved photo path include karta hai.",
    },
  ],
  navLinks: [
    { label: "Home", to: "/" },
    { label: "Features", to: "/features" },
    { label: "Pricing", to: "/pricing" },
    { label: "FAQ", to: "/faq" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
  ],
  pricing: {
    notice:
      "Monthly plan PKR 1,500 hai; 6-month aur yearly totals isi monthly rate par calculated hain.",
    includedFeatures: [
      "Members, plans aur expiry records",
      "Fees, dues aur WhatsApp reminders",
      "Member aur employee attendance",
      "Expenses, salaries aur reports",
      "CSV/ZIP data export",
    ],
    plans: [
      {
        id: "monthly",
        name: "Monthly",
        pricePkr: 1500,
        billingLabel: "per month",
        summary: "Month-to-month access ke saath poora GymKhata toolkit.",
        highlighted: false,
      },
      {
        id: "six-months",
        name: "6 Months",
        pricePkr: 9000,
        billingLabel: "per 6 months",
        summary: "6 months ka uninterrupted access ek payment mein.",
        highlighted: true,
      },
      {
        id: "yearly",
        name: "Yearly",
        pricePkr: 18000,
        billingLabel: "per year",
        summary: "Poore saal ka access ek payment mein.",
        highlighted: false,
      },
    ],
  },
} as const;

export function marketingWhatsAppUrl(message = MARKETING_CONFIG.contact.defaultMessage) {
  return `https://wa.me/${MARKETING_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function marketingMeta(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — ${MARKETING_CONFIG.brand.name}` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — ${MARKETING_CONFIG.brand.name}` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
