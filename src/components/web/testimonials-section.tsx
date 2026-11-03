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
    <section className="ul-band-light py-10 md:py-14 lg:py-16">
      <div className="ul-shell-wide">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Reveal className="justify-self-start">
            <p className="ul-kicker">Testimonials</p>
            <h2 className="ul-section-heading mt-3 text-3xl md:text-4xl">What our clients say</h2>
          </Reveal>
          <Reveal delay={50} className="lg:justify-self-end lg:text-right">
            <p className="max-w-xl text-base leading-relaxed text-[var(--ul-muted)] lg:ml-auto">
              Quiet recommendations from buyers, investors, and tenants who chose UrbanLuxe.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((item, i) => (
            <Reveal key={item.name} delay={i * 70}>
              <blockquote className="flex h-full flex-col rounded-2xl border border-[var(--ul-hair)] bg-[var(--ul-tertiary)] p-6">
                <Quote className="h-7 w-7 text-[var(--ul-secondary)]" strokeWidth={1.5} aria-hidden />
                <p className="mt-4 flex-1 text-base leading-relaxed text-[var(--ul-primary)]">
                  “{item.quote}”
                </p>
                <footer className="mt-6 border-t border-[var(--ul-hair)] pt-4">
                  <p className="text-sm font-bold text-[var(--ul-primary)]">{item.name}</p>
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
