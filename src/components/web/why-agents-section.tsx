import Link from "next/link";
import {
  Award,
  Clock3,
  Handshake,
  MapPinned,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "@/components/web/reveal";

const QUALITIES = [
  {
    icon: MapPinned,
    title: "Hyper-local expertise",
    body: "Agents who live the communities they sell — Palm, Marina, Hills, Creek — not generic city-wide lists.",
  },
  {
    icon: ShieldCheck,
    title: "RERA-licensed & vetted",
    body: "Every advisor is licensed, background-checked, and held to UrbanLuxe service standards.",
  },
  {
    icon: Clock3,
    title: "Same-day viewings",
    body: "Private tours arranged within hours when it matters — evenings and weekends included.",
  },
  {
    icon: Handshake,
    title: "Negotiation that protects you",
    body: "From offer strategy to SPA clauses, we fight for price, terms, and handover clarity.",
  },
  {
    icon: MessageCircle,
    title: "One clear point of contact",
    body: "No call-centre handoffs. Your agent stays with you from enquiry through keys.",
  },
  {
    icon: Award,
    title: "Off-market access",
    body: "Quiet listings and developer allocations before they hit the open portals.",
  },
] as const;

export function WhyAgentsSection() {
  return (
    <section className="ul-band-light py-10 md:py-14 lg:py-16">
      <div className="ul-shell-wide">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Reveal className="justify-self-start">
            <p className="ul-kicker">Our people</p>
            <h2 className="ul-section-heading mt-3 text-3xl md:text-4xl">
              Why our agents are right for you
            </h2>
          </Reveal>
          <Reveal delay={50} className="lg:justify-self-end lg:text-right">
            <p className="max-w-xl text-base leading-relaxed text-[var(--ul-muted)] lg:ml-auto">
              Specialists, not sales scripts — advisors who combine market craft with the care of a
              private office.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUALITIES.map((item, i) => (
            <Reveal key={item.title} delay={i * 50}>
              <article className="flex h-full flex-col rounded-2xl border border-[var(--ul-hair)] bg-white p-6 shadow-[0_8px_30px_rgba(7,17,31,0.04)]">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ul-secondary)] text-white">
                  <item.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-bold uppercase tracking-wide text-[var(--ul-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--ul-muted)]">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mt-12">
          <Link href="/contact" prefetch className="ul-btn-primary rounded-full">
            Speak with an agent
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
