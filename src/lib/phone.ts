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
