export function whatsappLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

export function telLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return `tel:${phone}`;
}

export function validateE164Phone(phone: string): boolean {
  return /^\+?[1-9]\d{6,14}$/.test(phone);
}

/** Normalize for comparison: digits only, leading 00 → country code style. */
export function normalizePhoneDigits(phone: string | null | undefined): string {
  if (!phone) return "";
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

export function phonesLikelyMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizePhoneDigits(a);
  const right = normalizePhoneDigits(b);
  if (!left || !right) return false;
  if (left === right) return true;
  // UAE local 05… vs +9715…
  if (left.length >= 9 && right.length >= 9) {
    return left.slice(-9) === right.slice(-9);
  }
  return false;
}
