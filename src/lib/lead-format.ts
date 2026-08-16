export function formatLeadLabel(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatLeadInterest(value: string) {
  return formatLeadLabel(value);
}

export function formatLeadTag(value: string) {
  return formatLeadLabel(value);
}
