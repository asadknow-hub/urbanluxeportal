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
    <section className="bg-[var(--ul-primary)] py-16 md:py-24">
      <div className="ul-shell">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end">
          <Reveal>
            <p className="ul-kicker">Our people</p>
            <h2 className="ul-section-heading mt-3 text-3xl md:text-4xl">
              Why our agents are right for you
            </h2>
          </Reveal>
          <Reveal delay={50}>
            <p className="max-w-xl text-base leading-relaxed text-[var(--ul-muted)] lg:justify-self-end lg:text-right">
              Specialists, not sales scripts — advisors who combine market craft with the care of a
              private office.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUALITIES.map((item, i) => (
            <Reveal key={item.title} delay={i * 50}>
              <article className="ul-card-dark flex h-full flex-col p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--ul-secondary)] text-[#07111F]">
                  <item.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-bold uppercase tracking-wide text-white">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--ul-muted)]">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mt-12">
          <Link href="/contact" prefetch className="ul-btn-primary">
            Speak with an agent
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
