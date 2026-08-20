import { Quote } from "lucide-react";
import { Reveal } from "@/components/web/reveal";

const TESTIMONIALS = [
  {
    quote:
      "They never sent a catalogue. They sent three addresses — and one of them was the house we closed on within a month.",
    name: "Aisha Al Hashimi",
    role: "Buyer · Palm Jumeirah",
  },
  {
    quote:
      "Our agent negotiated hard on the SPA and still kept the process calm. Off-market access made all the difference.",
    name: "James Rahman",
    role: "Investor · Dubai Creek Harbour",
  },
  {
    quote:
      "From first viewing to keys in six weeks. Discreet, exact, and unhurried — which, in this market, is rare.",
    name: "Marie Laurent",
    role: "Tenant · Dubai Marina",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section className="bg-white px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="ul-kicker">Testimonials</p>
          <h2 className="ul-section-heading mt-3 text-3xl md:text-4xl">
            What our clients say
          </h2>
          <p className="ul-section-lede mt-4 text-base leading-relaxed">
            Quiet recommendations from buyers, investors, and tenants who chose Urban Luxe.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item, i) => (
            <Reveal key={item.name} delay={i * 70}>
              <blockquote className="flex h-full flex-col rounded-sm border border-[var(--ul-hair)] bg-[var(--ul-tertiary)] p-6 md:p-7">
                <Quote
                  className="h-8 w-8 text-[var(--ul-secondary)]"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <p className="mt-5 flex-1 text-base leading-relaxed text-[var(--ul-primary)]">
                  “{item.quote}”
                </p>
                <footer className="mt-6 border-t border-[var(--ul-primary)]/10 pt-5">
                  <p className="text-sm font-semibold text-[var(--ul-primary)]">{item.name}</p>
                  <p className="mt-1 text-xs font-medium tracking-wide text-[var(--ul-muted)]">
                    {item.role}
                  </p>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
