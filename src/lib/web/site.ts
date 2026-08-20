export const SITE = {
  name: "UrbanLuxe",
  tagline: "A private house for Dubai.",
  description:
    "UrbanLuxe is a private Dubai brokerage for villas, apartments, and off-plan residences — placed with discretion, not listed as inventory.",
  url: "https://urbanluxe.com",
  phoneDisplay: "+971 4 000 0000",
  phoneTel: "+97140000000",
  whatsapp: "971500000000",
  email: "enquiries@urbanluxe.com",
  address: "Gate Avenue, DIFC, Dubai, United Arab Emirates",
  rera: "ORN 00000",
} as const;

export const NAV = [
  { href: "/buy", label: "Buy" },
  { href: "/rent", label: "Rent" },
  { href: "/off-plan", label: "Offplan" },
  { href: "/mortgages", label: "Mortgages" },
  { href: "/careers", label: "Careers" },
  { href: "/insights", label: "Insights" },
] as const;

export const CURRENCIES = [
  { code: "AED", label: "UAE Dirham" },
  { code: "USD", label: "US Dollar" },
  { code: "GBP", label: "British Pound" },
  { code: "EUR", label: "Euro" },
] as const;

export const FOOTER_PROPERTY = [
  { href: "/buy", label: "Buy" },
  { href: "/rent", label: "Rent" },
  { href: "/off-plan", label: "Off-plan" },
  { href: "/communities", label: "Communities" },
] as const;

export const FOOTER_SERVICES = [
  { href: "/sell", label: "List with Us" },
  { href: "/contact", label: "Property Management" },
  { href: "/mortgages", label: "Mortgage Advisory" },
  { href: "/contact", label: "Valuations" },
] as const;

export const FOOTER_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Agent Portal" },
] as const;

export function waLink(text?: string) {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
