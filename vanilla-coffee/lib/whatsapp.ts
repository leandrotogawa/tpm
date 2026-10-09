export function normalizeWhatsappNumber(value: string | null | undefined) {
  if (!value) return "";

  const fromUrlMatch = value.match(/wa\.me\/(\d+)/i) ?? value.match(/phone=(\d+)/i);
  if (fromUrlMatch) return fromUrlMatch[1];

  return value.replace(/\D/g, "");
}
