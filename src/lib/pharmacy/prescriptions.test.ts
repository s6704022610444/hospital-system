import { describe, expect, it } from "vitest";
import { checkAllergyMatch } from "./prescriptions";

describe("Drug Allergy Matching Logic", () => {
  const mockAllergies = [
    { drug_name: "Amoxicillin", severity: "severe_anaphylaxis" },
    { drug_name: "Ibuprofen", severity: "mild" },
  ];

  it("detects exact and substring drug allergy matches", () => {
    const match1 = checkAllergyMatch("Amoxicillin 500mg", mockAllergies);
    expect(match1.hasAllergy).toBe(true);
    expect(match1.severity).toBe("severe_anaphylaxis");

    const match2 = checkAllergyMatch("Ibuprofen", mockAllergies);
    expect(match2.hasAllergy).toBe(true);
    expect(match2.severity).toBe("mild");
  });

  it("returns hasAllergy = false when no allergy is found", () => {
    const match = checkAllergyMatch("Paracetamol 500mg", mockAllergies);
    expect(match.hasAllergy).toBe(false);
  });
});
