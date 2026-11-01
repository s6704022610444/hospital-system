/**
 * Registrar Data Formatters and Validators
 * Implements formatting rules defined in ADR 0003:
 * - Stored HN: 'HN-YY-XXXXXXX' -> Displayed: 'HN-XXXXXXX'
 * - Stored VN: 'VN-DDMMYYYY-XXXXXXX' -> Displayed: 'VN-XXXXXXX'
 */

// Format stored HN to UI Display format
export function formatHnDisplay(storedHn?: string | null): string {
  if (!storedHn) return "-";
  const trimmed = storedHn.trim();
  const match = trimmed.match(/^HN-\d{2}-(\d{7})$/);
  if (match) {
    return `HN-${match[1]}`;
  }
  return trimmed;
}

// Format stored VN to UI Display format
export function formatVnDisplay(storedVn?: string | null): string {
  if (!storedVn) return "-";
  const trimmed = storedVn.trim();
  const match = trimmed.match(/^VN-\d{8}-(\d{7})$/);
  if (match) {
    return `VN-${match[1]}`;
  }
  return trimmed;
}

// Calculate patient age in years from birthdate
export function calculateAge(birthDateStr?: string | null): number {
  if (!birthDateStr) return 0;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 0;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

// Format date to Thai Buddhist Era string
export function formatThaiDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format date and time to Thai string
export function formatThaiDateTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Thai National ID Checksum Algorithm validation
export function validateThaiNationalId(id: string): boolean {
  const clean = id.replace(/\D/g, "");
  if (clean.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean.charAt(i), 10) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(clean.charAt(12), 10);
}
