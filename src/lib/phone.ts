export function normalizeContactNumber(value: string, allowPartial: boolean = false): string {
  if (!value || typeof value !== "string") {
    return "";
  }

  const digitsOnly = value.replace(/[^\d+]/g, "");

  if (digitsOnly.startsWith("+63")) {
    const remaining = digitsOnly.slice(3);
    if (remaining.length === 10) {
      return `+63${remaining}`;
    }
    if (remaining.length > 10) {
      return `+63${remaining.slice(0, 10)}`;
    }
    if (allowPartial) {
      return digitsOnly;
    }
    return digitsOnly;
  }

  if (digitsOnly.startsWith("+")) {
    const withoutPlus = digitsOnly.slice(1);
    if (withoutPlus.startsWith("63") && withoutPlus.length === 12) {
      return `+${withoutPlus}`;
    }
    if (allowPartial) {
      return digitsOnly;
    }
    return digitsOnly;
  }

  if (digitsOnly.startsWith("09")) {
    if (digitsOnly.length === 11) {
      return `+63${digitsOnly.slice(1)}`;
    }
    if (allowPartial) {
      return digitsOnly;
    }
    if (digitsOnly.length > 11) {
      return `+63${digitsOnly.slice(1, 11)}`;
    }
    return digitsOnly;
  }

  if (digitsOnly.startsWith("0") && digitsOnly.length === 11) {
    return `+63${digitsOnly.slice(1)}`;
  }

  if (digitsOnly.startsWith("63") && digitsOnly.length === 12) {
    return `+${digitsOnly}`;
  }

  if (/^\d{10}$/.test(digitsOnly) && !digitsOnly.startsWith("0")) {
    return `+63${digitsOnly}`;
  }

  if (allowPartial) {
    return digitsOnly;
  }

  return digitsOnly;
}

export function formatContactNumberForDisplay(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const normalized = normalizeContactNumber(value);

  if (normalized.startsWith("+63")) {
    return normalized;
  }

  if (normalized.startsWith("09")) {
    return `+63${normalized.slice(1)}`;
  }

  if (normalized.startsWith("63") && normalized.length === 12) {
    return `+${normalized}`;
  }

  return normalized;
}

