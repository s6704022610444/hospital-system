/**
 * Nursing Domain Type Contracts (ก้าวที่ 2: ระบบงานการพยาบาลผู้ป่วยนอก)
 * Governing ADRs: ADR 0006, ADR 0007, ADR 0008
 */

import { VisitQueueItem } from "@/src/lib/patient/registrar-service";

/**
 * 1. Core Vital Signs (สัญญาณชีพหลัก)
 */
export interface CoreVitalSigns {
  bw?: number; // น้ำหนักตัว (kg)
  ht?: number; // ส่วนสูง (cm)
  sbp?: number; // Systolic Blood Pressure (mmHg)
  dbp?: number; // Diastolic Blood Pressure (mmHg)
  pr?: number; // Pulse Rate / Heart Rate (bpm)
  temp?: number; // Body Temperature (°C)
  rr?: number; // Respiratory Rate (/min)
  spo2?: number; // Oxygen Saturation (%)
  painScore?: number; // Pain Scale 0 - 10
}

/**
 * 2. Specialized & Dynamic Clinical Assessment Parameter
 */
export interface SpecializedAssessmentItem {
  id: string;
  category: string;
  name: string;
  value: string;
  unit: string;
  statusBadge?: string;
  isCustom?: boolean;
}

/**
 * 3. Triage Urgency Levels (1-5 ตามมาตรฐานสากล ESI / กระทรวงสาธารณสุข)
 */
export type TriageUrgencyLevel = "routine" | "urgent" | "emergency";

export type TriageCategoryLevel =
  | "1_resuscitation" // แดง: ภาวะคุกคามชีวิตทันที
  | "2_emergency" // ส้ม/ชมพู: ฉุกเฉินวิกฤต
  | "3_urgent" // เหลือง: เร่งด่วนปานกลาง
  | "4_semi_urgent" // เขียว: กึ่งเร่งด่วน รอได้
  | "5_non_urgent"; // ขาว/เขียวอ่อน: ทั่วไป ไม่เร่งด่วน

/**
 * 4. Fast-Track Clinical Evaluation Result (ADR 0008)
 */
export interface FastTrackRuleResult {
  triggered: boolean;
  reason?: string;
  suggestedUrgency: TriageUrgencyLevel;
  criticalParameter?: "bp" | "spo2" | "temp" | "pr" | "pain";
}

/**
 * 5. Exam Room Dispatch Target (ADR 0008: Hybrid Queue)
 */
export interface DispatchTarget {
  type: "pooled_clinic" | "specific_room";
  clinicName: string;
  roomNumber?: string;
  doctorName?: string;
}

/**
 * 6. Extended Nurse Queue Item
 */
export interface NurseQueueItem extends VisitQueueItem {
  fastTrackFlag?: boolean;
  fastTrackReason?: string;
  callCount?: number;
  lastCalledAt?: string;
}

/**
 * 7. Nurse Triage Handover Input
 */
export interface NurseTriageInput {
  visitId: string;
  hn: string;
  vn: string;
  patientName: string;
  clinicName: string;
  coreVitals: CoreVitalSigns;
  specializedItems?: SpecializedAssessmentItem[];
  chiefComplaint: string;
  presentIllness?: string;
  triageUrgency: TriageUrgencyLevel;
  triageCategory?: TriageCategoryLevel;
  dispatchTarget: DispatchTarget;
  allergies?: string;
  emergencyContact?: string;
  nurseName: string;
  nurseLicenseNo?: string;
  nurseStaffId?: string;
}

/**
 * 8. Nurse Care Plan (ตาราง 3 คอลัมน์ตามมาตรฐาน รพ.พระนั่งเกล้า)
 */
export interface NurseCarePlanItem {
  id: string;
  problem: string;
  interventions: string[];
  evaluation: string;
  nurseName: string;
  timestamp: string;
}
