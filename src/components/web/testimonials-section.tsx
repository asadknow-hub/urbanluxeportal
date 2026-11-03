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
    <section className="bg-[var(--ul-primary)] py-16 md:py-24">
      <div className="ul-shell">
        <div className="ul-panel-light p-6 sm:p-8 md:p-10">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
            <Reveal>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--ul-secondary)]">
                Testimonials
              </p>
              <h2 className="mt-3 text-3xl font-extrabold uppercase tracking-[-0.03em] text-[var(--ul-secondary)] md:text-4xl">
                What our clients say
              </h2>
            </Reveal>
            <Reveal delay={50}>
              <p className="max-w-xl text-base leading-relaxed text-[#475569] lg:justify-self-end lg:text-right">
                Quiet recommendations from buyers, investors, and tenants who chose UrbanLuxe.
              </p>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((item, i) => (
              <Reveal key={item.name} delay={i * 70}>
                <blockquote className="flex h-full flex-col rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6">
                  <Quote className="h-7 w-7 text-[var(--ul-secondary)]" strokeWidth={1.5} aria-hidden />
                  <p className="mt-4 flex-1 text-base leading-relaxed text-[#0f172a]">“{item.quote}”</p>
                  <footer className="mt-6 border-t border-[#e2e8f0] pt-4">
                    <p className="text-sm font-bold text-[#07111F]">{item.name}</p>
                    <p className="mt-1 text-xs font-medium tracking-wide text-[#64748b]">{item.role}</p>
                  </footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
