import crypto from "crypto";

export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createTokenHint(token: string) {
  const cleaned = token.trim();
  if (cleaned.length <= 12) {
    return cleaned;
  }
  return `${cleaned.slice(0, 6)}...${cleaned.slice(-4)}`;
}

