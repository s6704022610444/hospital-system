/**
 * Nurse Domain Service & Clinical Vitals Engine
 * Governing ADRs: ADR 0006, ADR 0007, ADR 0008
 */

import {
  CoreVitalSigns,
  FastTrackRuleResult,
  NurseQueueItem,
  NurseTriageInput,
} from "@/src/types/nurse";
import { VisitQueueItem } from "@/src/lib/patient/registrar-service";

/**
 * 1. Calculate Body Mass Index (BMI)
 * Formula: Weight (kg) / (Height (m))^2
 */
export function calculateBMI(weightKg: number, heightCm: number): number | null {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * 2. Assign Asian Clinical BMI Status Label
 */
export function getBmiStatusLabel(bmi: number): string {
  if (bmi < 18.5) return "น้ำหนักน้อย";
  if (bmi <= 22.9) return "สมส่วนปกติ";
  if (bmi <= 24.9) return "น้ำหนักเกิน";
  return "ภาวะอ้วน";
}

/**
 * 3. Automated Fast-Track Rule Engine (ADR 0008: Zero-Delay Safety Escalation)
 * Evaluates clinical vital sign thresholds and escalates critical visits to Priority Queue
 */
export function evaluateFastTrackRules(vitals: CoreVitalSigns): FastTrackRuleResult {
  // 1. Hypertensive Crisis (SBP >= 180 or DBP >= 110)
  if ((vitals.sbp && vitals.sbp >= 180) || (vitals.dbp && vitals.dbp >= 110)) {
    return {
      triggered: true,
      reason: `ความดันโลหิตวิกฤต (SBP ${vitals.sbp || "-"}/${vitals.dbp || "-"} mmHg)`,
      suggestedUrgency: "emergency",
      criticalParameter: "bp",
    };
  }

  // 2. Severe Hypoxia (SpO2 < 92%)
  if (vitals.spo2 && vitals.spo2 < 92) {
    return {
      triggered: true,
      reason: `ออกซิเจนในเลือดต่ำวิกฤต (SpO2 ${vitals.spo2}%)`,
      suggestedUrgency: "emergency",
      criticalParameter: "spo2",
    };
  }

  // 3. Mild Hypoxia (92% <= SpO2 < 95%)
  if (vitals.spo2 && vitals.spo2 < 95) {
    return {
      triggered: true,
      reason: `ออกซิเจนในเลือดต่ำ (SpO2 ${vitals.spo2}%)`,
      suggestedUrgency: "urgent",
      criticalParameter: "spo2",
    };
  }

  // 4. Hyperpyrexia / High Fever (Temp >= 39.0 C)
  if (vitals.temp && vitals.temp >= 39.0) {
    return {
      triggered: true,
      reason: `ไข้สูงวิกฤต (T ${vitals.temp} °C)`,
      suggestedUrgency: "urgent",
      criticalParameter: "temp",
    };
  }

  // 5. Extreme Tachycardia (PR >= 130)
  if (vitals.pr && vitals.pr >= 130) {
    return {
      triggered: true,
      reason: `ชีพจรเต้นเร็วผิดปกติ (PR ${vitals.pr} /min)`,
      suggestedUrgency: "urgent",
      criticalParameter: "pr",
    };
  }

  // 6. Severe Bradycardia (PR < 45)
  if (vitals.pr && vitals.pr < 45) {
    return {
      triggered: true,
      reason: `ชีพจรเต้นช้าผิดปกติ (PR ${vitals.pr} /min)`,
      suggestedUrgency: "urgent",
      criticalParameter: "pr",
    };
  }

  // 7. Severe Intractable Pain (Pain Score >= 8/10)
  if (vitals.painScore && vitals.painScore >= 8) {
    return {
      triggered: true,
      reason: `ปวดรุนแรงมาก (Pain Score ${vitals.painScore}/10)`,
      suggestedUrgency: "urgent",
      criticalParameter: "pain",
    };
  }

  return {
    triggered: false,
    suggestedUrgency: "routine",
  };
}

/**
 * 4. Filter Nurse Waiting Queue by Clinic Station (ADR 0006)
 */
export function filterQueueByClinic<T extends { clinicName: string }>(
  queue: T[],
  selectedClinic: string
): T[] {
  if (!selectedClinic) return queue;
  return queue.filter((item) => item.clinicName === selectedClinic);
}

/**
 * 5. Reorder Queue placing Fast-Track Patients First (ADR 0008)
 */
export function sortQueueByPriority(queue: NurseQueueItem[]): NurseQueueItem[] {
  return [...queue].sort((a, b) => {
    // 1. Emergency Fast-track first
    const aIsEmergency = a.fastTrackFlag || a.triageLevel === "emergency";
    const bIsEmergency = b.fastTrackFlag || b.triageLevel === "emergency";
    if (aIsEmergency && !bIsEmergency) return -1;
    if (!aIsEmergency && bIsEmergency) return 1;

    // 2. Urgent next
    const aIsUrgent = a.triageLevel === "urgent";
    const bIsUrgent = b.triageLevel === "urgent";
    if (aIsUrgent && !bIsUrgent) return -1;
    if (!aIsUrgent && bIsUrgent) return 1;

    // 3. FIFO / Queue order
    return a.queueNumber.localeCompare(b.queueNumber);
  });
}

/**
 * 6. Build Triaged Visit Record for Doctor Handover (ADR 0007 & ADR 0008)
 */
export function buildTriagedVisit(
  input: NurseTriageInput
): VisitQueueItem & {
  triageNurseName: string;
  triageNurseLicenseNo?: string;
  triageNurseStaffId?: string;
  triageCompletedAt: string;
  coreVitals: CoreVitalSigns;
} {
  const now = new Date().toISOString();

  return {
    id: input.visitId,
    vn: input.vn,
    hn: input.hn,
    queueNumber: "A-02",
    patientName: input.patientName,
    gender: "F",
    age: 32,
    clinicName: input.clinicName,
    roomNumber: input.dispatchTarget.roomNumber,
    doctorName: input.dispatchTarget.doctorName,
    chiefComplaint: input.chiefComplaint,
    triageLevel: input.triageUrgency,
    inflowType: "walk_in",
    isReferral: false,
    referralDocStatus: "none",
    status: "triaged",
    registeredAt: now,
    triageNurseName: input.nurseName,
    triageNurseLicenseNo: input.nurseLicenseNo,
    triageNurseStaffId: input.nurseStaffId,
    triageCompletedAt: now,
    coreVitals: input.coreVitals,
  };
}
