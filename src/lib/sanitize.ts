const STRIP_HTML_REGEX = /<\/?[^>]*?>/g;
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F-\u009F]/g;
const SUSPICIOUS_PROTOCOLS = /\b(?:javascript|vbscript|file|data):/gi;

export function sanitizeInput(input: string) {
  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input.normalize("NFKC");
  sanitized = sanitized.replace(CONTROL_CHAR_REGEX, "");
  sanitized = sanitized.replace(STRIP_HTML_REGEX, "");
  sanitized = sanitized.replace(SUSPICIOUS_PROTOCOLS, "");
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
}



