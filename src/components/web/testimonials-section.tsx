import { Quote } from "lucide-react";
import { Reveal } from "@/components/web/reveal";

const TESTIMONIALS = [
  {
    quote:
      "They never sent a catalogue. They sent three addresses, and one of them was the house we closed on within a month.",
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
      "From first viewing to keys in six weeks. Discreet, exact, and unhurried, which in this market is rare.",
    name: "Marie Laurent",
    role: "Tenant · Dubai Marina",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section className="ul-band-light border-t border-[var(--ul-hair)] py-7 md:py-9">
      <div className="ul-shell-wide">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Reveal>
            <p className="ul-kicker">Testimonials</p>
            <h2 className="ul-section-heading mt-1.5 text-2xl md:text-3xl">What our clients say</h2>
          </Reveal>
          <Reveal delay={40}>
            <p className="max-w-md text-sm leading-relaxed text-[var(--ul-muted)]">
              Quiet recommendations from buyers, investors, and tenants who chose UrbanLuxe.
            </p>
          </Reveal>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3 md:gap-4">
          {TESTIMONIALS.map((item, i) => (
            <Reveal key={item.name} delay={i * 50}>
              <blockquote className="flex h-full flex-col border border-[var(--ul-hair)] bg-[var(--ul-tertiary)] p-4 sm:p-5">
                <Quote className="h-5 w-5 text-[var(--ul-primary)]" strokeWidth={1.5} aria-hidden />
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ul-primary)]">
                  “{item.quote}”
                </p>
                <footer className="mt-4 border-t border-[var(--ul-hair)] pt-3">
                  <p className="text-sm font-bold text-[var(--ul-primary)]">{item.name}</p>
                  <p className="mt-0.5 text-xs font-medium tracking-wide text-[var(--ul-muted)]">
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
