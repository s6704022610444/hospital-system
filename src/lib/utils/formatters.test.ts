import { describe, expect, it } from "vitest";
import {
  formatHnDisplay,
  formatVnDisplay,
  calculateAge,
  validateThaiNationalId,
} from "./formatters";

describe("Registrar Formatters and Validators (ADR 0003)", () => {
  it("formats HN from storage format (HN-YY-XXXXXXX) to UI display format (HN-XXXXXXX)", () => {
    expect(formatHnDisplay("HN-68-0000001")).toBe("HN-0000001");
    expect(formatHnDisplay("HN-68-1234567")).toBe("HN-1234567");
    expect(formatHnDisplay("HN-0000001")).toBe("HN-0000001");
    expect(formatHnDisplay("")).toBe("-");
  });

  it("formats VN from storage format (VN-DDMMYYYY-XXXXXXX) to UI display format (VN-XXXXXXX)", () => {
    expect(formatVnDisplay("VN-31102568-0000001")).toBe("VN-0000001");
    expect(formatVnDisplay("VN-21102568-0000465")).toBe("VN-0000465");
    expect(formatVnDisplay("VN-0000001")).toBe("VN-0000001");
    expect(formatVnDisplay("")).toBe("-");
  });

  it("calculates age accurately from birth date string", () => {
    const age = calculateAge("1990-01-01");
    expect(age).toBeGreaterThanOrEqual(35);
    expect(calculateAge("")).toBe(0);
  });

  it("validates Thai National ID 13 digits using official checksum algorithm", () => {
    expect(validateThaiNationalId("1103700543210")).toBe(true);
    expect(validateThaiNationalId("12345")).toBe(false);
    expect(validateThaiNationalId("110370054321A")).toBe(false);
    expect(validateThaiNationalId("1103700543219")).toBe(false);
  });
});
