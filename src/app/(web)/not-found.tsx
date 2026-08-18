import Link from "next/link";

export default function WebNotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-28 text-center">
      <p className="ul-kicker">404</p>
      <h1 className="mt-4 text-4xl md:text-6xl">This address is not listed.</h1>
      <p className="mt-4 max-w-md font-light text-[#8a8178]">
        The page has moved, or it was never on the brochure.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex h-12 items-center bg-[#2dd4bf] px-8 text-[0.72rem] font-semibold tracking-[0.22em] uppercase text-[#14110e]"
      >
        Return home
      </Link>
    </section>
  );
}
