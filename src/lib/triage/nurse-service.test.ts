import { describe, expect, it } from "vitest";
import {
  calculateBMI,
  getBmiStatusLabel,
  evaluateFastTrackRules,
  filterQueueByClinic,
  sortQueueByPriority,
  buildTriagedVisit,
} from "./nurse-service";
import { NurseTriageInput } from "@/src/types/nurse";
import { VisitQueueItem } from "@/src/lib/patient/registrar-service";

describe("Nurse Domain Service & Fast-Track Engine Suite (ADR 0006 - ADR 0008)", () => {
  describe("1. BMI Calculations & Status Labels", () => {
    it("calculates BMI correctly with valid body weight and height", () => {
      // 54 kg, 160 cm -> 54 / (1.6 * 1.6) = 21.09 -> 21.1
      expect(calculateBMI(54, 160)).toBe(21.1);
      // 75 kg, 175 cm -> 75 / (1.75 * 1.75) = 24.49 -> 24.5
      expect(calculateBMI(75, 175)).toBe(24.5);
    });

    it("returns null when weight or height is invalid or zero", () => {
      expect(calculateBMI(0, 160)).toBeNull();
      expect(calculateBMI(54, 0)).toBeNull();
      expect(calculateBMI(-5, 160)).toBeNull();
    });

    it("assigns clinical Asian BMI status labels accurately", () => {
      expect(getBmiStatusLabel(17.5)).toBe("น้ำหนักน้อย");
      expect(getBmiStatusLabel(21.1)).toBe("สมส่วนปกติ");
      expect(getBmiStatusLabel(24.0)).toBe("น้ำหนักเกิน");
      expect(getBmiStatusLabel(27.5)).toBe("ภาวะอ้วน");
    });
  });

  describe("2. Fast-Track Rule Engine (ADR 0008: Automated Safety Escalation)", () => {
    it("triggers emergency fast-track on Hypertensive Crisis (SBP >= 180 or DBP >= 110)", () => {
      const sbpCrisis = evaluateFastTrackRules({ sbp: 185, dbp: 95 });
      expect(sbpCrisis.triggered).toBe(true);
      expect(sbpCrisis.suggestedUrgency).toBe("emergency");
      expect(sbpCrisis.reason).toContain("ความดันโลหิตวิกฤต");

      const dbpCrisis = evaluateFastTrackRules({ sbp: 150, dbp: 115 });
      expect(dbpCrisis.triggered).toBe(true);
      expect(dbpCrisis.suggestedUrgency).toBe("emergency");
    });

    it("does not trigger fast-track on normal or mild hypertension (SBP < 180 and DBP < 110)", () => {
      const normal = evaluateFastTrackRules({ sbp: 120, dbp: 80 });
      expect(normal.triggered).toBe(false);
      expect(normal.suggestedUrgency).toBe("routine");

      const stage1 = evaluateFastTrackRules({ sbp: 145, dbp: 92 });
      expect(stage1.triggered).toBe(false);
      expect(stage1.suggestedUrgency).toBe("routine");
    });

    it("triggers emergency fast-track on severe hypoxia (SpO2 < 92%)", () => {
      const hypoxia = evaluateFastTrackRules({ spo2: 90 });
      expect(hypoxia.triggered).toBe(true);
      expect(hypoxia.suggestedUrgency).toBe("emergency");
      expect(hypoxia.reason).toContain("ออกซิเจนในเลือดต่ำวิกฤต");
    });

    it("triggers urgent fast-track on mild hypoxia (92% <= SpO2 < 95%)", () => {
      const mildHypoxia = evaluateFastTrackRules({ spo2: 94 });
      expect(mildHypoxia.triggered).toBe(true);
      expect(mildHypoxia.suggestedUrgency).toBe("urgent");
      expect(mildHypoxia.reason).toContain("ออกซิเจนในเลือดต่ำ");
    });

    it("triggers urgent fast-track on Hyperpyrexia / High Fever (Temp >= 39.0 C)", () => {
      const highFever = evaluateFastTrackRules({ temp: 39.4 });
      expect(highFever.triggered).toBe(true);
      expect(highFever.suggestedUrgency).toBe("urgent");
      expect(highFever.reason).toContain("ไข้สูงวิกฤต");

      const lowFever = evaluateFastTrackRules({ temp: 37.8 });
      expect(lowFever.triggered).toBe(false);
    });

    it("triggers urgent fast-track on severe tachycardia (PR >= 130) or extreme bradycardia (PR < 45)", () => {
      const tachy = evaluateFastTrackRules({ pr: 135 });
      expect(tachy.triggered).toBe(true);
      expect(tachy.reason).toContain("ชีพจรเต้นเร็วผิดปกติ");

      const brady = evaluateFastTrackRules({ pr: 40 });
      expect(brady.triggered).toBe(true);
      expect(brady.reason).toContain("ชีพจรเต้นช้าผิดปกติ");
    });

    it("triggers urgent fast-track on severe intractable pain (Pain Score >= 8/10)", () => {
      const severePain = evaluateFastTrackRules({ painScore: 9 });
      expect(severePain.triggered).toBe(true);
      expect(severePain.suggestedUrgency).toBe("urgent");
      expect(severePain.reason).toContain("ปวดรุนแรงมาก");

      const moderatePain = evaluateFastTrackRules({ painScore: 7 });
      expect(moderatePain.triggered).toBe(false);
    });
  });

  describe("3. Clinic Queue Segregation & Priority Reordering (ADR 0006 & ADR 0008)", () => {
    const mockVisits: VisitQueueItem[] = [
      {
        id: "v-1",
        vn: "VN-01112568-0000001",
        hn: "HN-68-0000001",
        queueNumber: "A-01",
        patientName: "สมศักดิ์ รักสงบ",
        gender: "M",
        age: 41,
        clinicName: "คลินิกอายุรกรรมทั่วไป",
        chiefComplaint: "มีไข้",
        triageLevel: "routine",
        inflowType: "walk_in",
        isReferral: false,
        referralDocStatus: "none",
        status: "registered",
        registeredAt: "2026-11-01T08:00:00Z",
      },
      {
        id: "v-2",
        vn: "VN-01112568-0000002",
        hn: "HN-68-0000002",
        queueNumber: "A-02",
        patientName: "วิภาดา เจริญพร",
        gender: "F",
        age: 32,
        clinicName: "เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์ / กลืนแร่)",
        chiefComplaint: "ติดตามไทรอยด์",
        triageLevel: "routine",
        inflowType: "appointment",
        isReferral: true,
        referralDocStatus: "verified",
        status: "registered",
        registeredAt: "2026-11-01T08:15:00Z",
      },
    ];

    it("filters queue visits accurately by designated clinic station (ADR 0006)", () => {
      const medQueue = filterQueueByClinic(mockVisits, "คลินิกอายุรกรรมทั่วไป");
      expect(medQueue.length).toBe(1);
      expect(medQueue[0].patientName).toBe("สมศักดิ์ รักสงบ");

      const nucQueue = filterQueueByClinic(mockVisits, "เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์ / กลืนแร่)");
      expect(nucQueue.length).toBe(1);
      expect(nucQueue[0].patientName).toBe("วิภาดา เจริญพร");
    });

    it("reorders queue placing Fast-Track patients ahead of routine patients (ADR 0008)", () => {
      const routine1 = { ...mockVisits[0], id: "r1", queueNumber: "A-01" };
      const routine2 = { ...mockVisits[0], id: "r2", queueNumber: "A-02" };
      const fastTrack = {
        ...mockVisits[0],
        id: "ft1",
        queueNumber: "A-03",
        triageLevel: "emergency" as const,
        fastTrackFlag: true,
      };

      const sorted = sortQueueByPriority([routine1, routine2, fastTrack]);
      expect(sorted[0].id).toBe("ft1"); // Emergency fast-track moved to top
      expect(sorted[1].id).toBe("r1");
      expect(sorted[2].id).toBe("r2");
    });
  });

  describe("4. Triage Handover Record & Status Transition (ADR 0007 & ADR 0008)", () => {
    it("builds a complete triaged visit with nurse license stamp and handover target", () => {
      const input: NurseTriageInput = {
        visitId: "vis-001",
        hn: "HN-68-0000002",
        vn: "VN-01112568-0000002",
        patientName: "วิภาดา เจริญพร",
        clinicName: "เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์ / กลืนแร่)",
        coreVitals: {
          bw: 54,
          ht: 160,
          sbp: 120,
          dbp: 80,
          pr: 80,
          temp: 36.8,
          rr: 18,
          spo2: 98,
          painScore: 2,
        },
        chiefComplaint: "ตรวจติดตามไทรอยด์เป็นพิษ",
        triageUrgency: "routine",
        triageCategory: "4_semi_urgent",
        dispatchTarget: {
          type: "specific_room",
          clinicName: "เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์ / กลืนแร่)",
          roomNumber: "101",
          doctorName: "นพ. ทวี ยิ่งสง่า",
        },
        allergies: "Penicillin",
        nurseName: "พว. มาลี มีสุข",
        nurseLicenseNo: "พย.11029845",
        nurseStaffId: "STF-68-0245",
      };

      const result = buildTriagedVisit(input);
      expect(result.status).toBe("triaged");
      expect(result.roomNumber).toBe("101");
      expect(result.doctorName).toBe("นพ. ทวี ยิ่งสง่า");
      expect(result.triageNurseName).toBe("พว. มาลี มีสุข");
      expect(result.triageNurseLicenseNo).toBe("พย.11029845");
      expect(result.triageCompletedAt).toBeDefined();
    });
  });
});
