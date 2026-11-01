import { describe, expect, it } from "vitest";
import { ROLE_CONFIGS, ROLE_MENUS, HospitalRole } from "./auth";

describe("Hospital Roles and Role-based Dynamic Menus", () => {
  const allRoles: HospitalRole[] = [
    "registrar",
    "nurse",
    "doctor",
    "med_tech",
    "nuclear_med",
    "cashier",
    "pharmacist",
    "warehouse",
    "director",
    "admin",
  ];

  it("configures all 10 hospital roles with titles and departments", () => {
    allRoles.forEach((role) => {
      const config = ROLE_CONFIGS[role];
      expect(config).toBeDefined();
      expect(config.title).toBeTruthy();
      expect(config.department).toBeTruthy();
      expect(config.defaultPath).toContain("/dashboard/");
    });
  });

  it("assigns distinct functional menus to each role as specified in UI mockup", () => {
    allRoles.forEach((role) => {
      const menus = ROLE_MENUS[role];
      expect(menus).toBeDefined();
      expect(menus.length).toBeGreaterThanOrEqual(3);

      menus.forEach((item) => {
        expect(item.id).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.iconName).toBeTruthy();
        expect(item.path).toContain("/dashboard/");
      });
    });

    const regLabels = ROLE_MENUS.registrar.map((m) => m.label);
    const docLabels = ROLE_MENUS.doctor.map((m) => m.label);
    const registrarTabs = ROLE_MENUS.registrar.map((m) => m.path.split("?tab=")[1]);
    expect(regLabels).toContain("ค้นหาผู้ป่วย / เปิด Visit (VN)");
    expect(docLabels).toContain("ตรวจรักษา (OPD Card)");
    expect(regLabels).not.toEqual(docLabels);
    expect(registrarTabs).toEqual(["search", "new_patient", "today_queue", "appointments"]);
    expect(new Set(registrarTabs).size).toBe(4); // No two sidebar items share the same destination tab.
  });
});
