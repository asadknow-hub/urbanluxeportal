import type { ReactNode } from "react";
import Link from "next/link";
import { Reveal } from "@/components/web/reveal";
import { cn } from "@/lib/utils";

export type PageIntroCta = {
  href: string;
  label: string;
  prefetch?: boolean;
};

export function PageIntro({
  eyebrow,
  title,
  lede,
  tone = "dark",
  layout = "split",
  primaryCta,
  secondaryCta,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  tone?: "dark" | "light";
  /** split = title | lede columns; stack = title then lede; compact = tighter padding */
  layout?: "split" | "stack" | "compact";
  primaryCta?: PageIntroCta;
  secondaryCta?: PageIntroCta;
  children?: ReactNode;
  className?: string;
}) {
  const dark = tone === "dark";
  const compact = layout === "compact";
  const stack = layout === "stack" || compact;

  return (
    <section
      className={cn(
        dark
          ? "ul-band-dark border-b border-white/10"
          : "ul-band-light border-b border-[var(--ul-hair)]",
        compact ? "py-10 sm:py-12 md:py-14" : "py-12 sm:py-14 md:py-16",
        className
      )}
    >
      <div className="ul-shell-wide">
        <div
          className={cn(
            stack
              ? "max-w-3xl"
              : "grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-end"
          )}
        >
          <Reveal className="justify-self-start">
            <p className="ul-kicker">{eyebrow}</p>
            <h1
              className={cn(
                "mt-3 font-extrabold uppercase leading-[1.08] tracking-[-0.03em] sm:mt-4",
                compact
                  ? "max-w-3xl text-[1.65rem] sm:text-3xl md:text-4xl"
                  : "max-w-4xl text-[1.85rem] sm:text-4xl md:text-5xl",
                dark ? "text-white" : "text-[var(--ul-primary)]"
              )}
            >
              {title}
            </h1>
            {stack ? (
              <p
                className={cn(
                  "mt-4 max-w-2xl text-[0.9375rem] leading-relaxed sm:text-base",
                  dark ? "text-[#8ba0b8]" : "text-[var(--ul-muted)]"
                )}
              >
                {lede}
              </p>
            ) : null}
          </Reveal>
          {!stack ? (
            <Reveal delay={60} className="lg:justify-self-end lg:text-right">
              <p
                className={cn(
                  "max-w-xl text-[0.9375rem] leading-relaxed sm:text-base md:text-lg lg:ml-auto",
                  dark ? "text-[#8ba0b8]" : "text-[var(--ul-muted)]"
                )}
              >
                {lede}
              </p>
            </Reveal>
          ) : null}
        </div>

        {(primaryCta || secondaryCta) && (
          <Reveal delay={90} className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                prefetch={primaryCta.prefetch}
                className={cn(
                  "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors sm:h-11",
                  dark
                    ? "bg-[var(--ul-secondary)] text-white hover:bg-[#006633]"
                    : "bg-[var(--ul-primary)] text-white hover:bg-[var(--ul-secondary)]"
                )}
              >
                {primaryCta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                prefetch={secondaryCta.prefetch}
                className={cn(
                  "inline-flex h-12 items-center justify-center rounded-full border px-6 text-sm font-semibold transition-colors sm:h-11",
                  dark
                    ? "border-white/35 text-white hover:bg-white/10"
                    : "border-[var(--ul-hair)] text-[var(--ul-primary)] hover:border-[var(--ul-secondary)]"
                )}
              >
                {secondaryCta.label}
              </Link>
            )}
          </Reveal>
        )}

        {children ? <div className="mt-8 md:mt-10">{children}</div> : null}
      </div>
    </section>
  );
}
