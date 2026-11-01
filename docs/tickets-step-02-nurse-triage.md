# Tickets: Step 02 - OPD Nursing Workstation & Vitals Triage Engine

- **Source Spec:** [spec-step-02-nurse-triage.md](./spec-step-02-nurse-triage.md)
- **Governing ADRs:** ADR 0006, ADR 0007, ADR 0008
- **Total Tickets:** 8 tickets (T01–T08)
- **Execution Order:** Sequential — each ticket depends on the previous

---

## T01: TypeScript Type Contracts for Nursing Domain

**Priority:** P0 (Foundation — all other tickets depend on this)
**Estimated Complexity:** Small

### Objective
Establish the definitive TypeScript type contracts for the entire nursing triage domain.

### Files
- `src/types/nurse.ts` (New)

### Deliverables
1. `CoreVitalSigns` interface: `{ bw?, ht?, sbp?, dbp?, pr?, temp?, rr?, spo2?, painScore? }`
2. `SpecializedAssessmentItem` interface: `{ id, category, name, value, unit, statusBadge?, isCustom? }`
3. `NurseTriageInput` interface: wraps vitals, specializedItems, chiefComplaint, triageUrgency, dispatchTarget
4. `DispatchTarget` type: `{ type: "pooled_clinic" | "specific_room"; clinicName: string; roomNumber?: string; doctorName?: string }`
5. `FastTrackRuleResult` interface: `{ triggered: boolean; reason?: string; suggestedUrgency: "routine" | "urgent" | "emergency" }`
6. `NurseQueueItem` interface: extends `VisitQueueItem` with `fastTrackFlag?: boolean; fastTrackReason?: string`

### Acceptance Criteria
- [ ] All types compile cleanly under `tsc --strict`
- [ ] Types are importable by `nurse-service.ts` and `app/dashboard/nurse/page.tsx` without errors

---

## T02: Nurse Domain Service — Vitals Engine & Fast-Track Rule Engine

**Priority:** P0 (Core Clinical Logic — TDD: Write tests FIRST)
**Estimated Complexity:** Medium

### Objective
Build the pure TypeScript service module for all clinical calculations and rule evaluation.

### Files
- `src/lib/triage/nurse-service.ts` (New)
- `src/lib/triage/nurse-service.test.ts` (New — write tests FIRST, RED then GREEN)

### TDD Test Cases (Write FIRST — RED Phase)
1. `calculateBMI(54, 160)` → `21.1` (Normal BMI)
2. `calculateBMI(0, 160)` → `null` (invalid input)
3. `getBmiStatusLabel(21.1)` → `"สมส่วนปกติ"`
4. `getBmiStatusLabel(17.5)` → `"น้ำหนักน้อย"`
5. `getBmiStatusLabel(28.0)` → `"ภาวะอ้วน"`
6. `evaluateFastTrackRules({ sbp: 185 })` → `{ triggered: true, reason: "ความดันโลหิตวิกฤต (SBP 185 mmHg)", suggestedUrgency: "emergency" }`
7. `evaluateFastTrackRules({ sbp: 120, dbp: 80 })` → `{ triggered: false, suggestedUrgency: "routine" }`
8. `evaluateFastTrackRules({ spo2: 90 })` → `{ triggered: true, suggestedUrgency: "emergency" }`
9. `evaluateFastTrackRules({ temp: 39.2 })` → `{ triggered: true, suggestedUrgency: "urgent" }`
10. `evaluateFastTrackRules({ painScore: 8 })` → `{ triggered: true, suggestedUrgency: "urgent" }`
11. `evaluateFastTrackRules({ painScore: 7 })` → `{ triggered: false, suggestedUrgency: "routine" }`
12. `filterQueueByClinic([v1, v2], "คลินิกอายุรกรรมทั่วไป")` → returns only matching clinic visits
13. `sortQueueByPriority([routine, fast-track, routine])` → fast-track item is at index 0
14. `buildTriagedVisit(validInput)` → returns object with `status: "triaged"`, valid `triageCompletedAt` ISO timestamp

### Acceptance Criteria
- [ ] All 14+ test cases pass: `npx vitest run src/lib/triage/nurse-service.test.ts`
- [ ] Zero TypeScript errors under `npm run typecheck`
- [ ] No DOM dependencies in service file (pure functions only)

---

## T03: Nurse Workstation Queue View — Clinic Selector & Waiting Queue Table

**Priority:** P1 (First visible UI milestone)
**Estimated Complexity:** Medium

### Objective
Build the queue management interface. Replaces the current placeholder in `app/dashboard/nurse/page.tsx`.

### File
- `app/dashboard/nurse/page.tsx` (Upgrade from placeholder)

### UI Specification

**Header Strip:**
- Clinic selector dropdown: `[ 🏥 คลินิกอายุรกรรมทั่วไป ▾ ]` (pre-filled from `user.assignedStation`)
- Realtime queue count: `(12 คนรอคัดกรอง)`
- Nurse name + professionalTitle + staffId shown at top

**Waiting Queue Table (filtered by selected clinic):**
- Columns: คิว | HN | ชื่อ-สกุล | ประเภทผู้ป่วย | Fast-Track | เวลารอ | ปุ่มเรียก
- Row color coding:
  - `walk_in` → white
  - `appointment` → light blue + badge `[ 📅 มีนัด ]`
  - `referral` → light purple + badge `[ 🔁 ส่งตัว ]`
  - `fastTrackFlag = true` → light red + pulsing badge `[ 🚨 FAST-TRACK ]` + reason text
- Auto-refresh every 30 seconds

**Call Patient Button:**
- Opens patient's OPD Card chart view
- Updates visit status: `registered` → `being_assessed`

### Acceptance Criteria
- [ ] Clinic dropdown filters queue rows by `clinicName`
- [ ] Fast-track rows display red pulsing border and reason text
- [ ] Badge colors correct for Walk-in / Appointment / Referral
- [ ] `npm run typecheck` passes clean

---

## T04: Patient Chart — Persistent Banner, Demographics Drawer & Allergy Alert

**Priority:** P1
**Estimated Complexity:** Medium

### Objective
Build the Persistent Patient Summary Banner pinned at the top of the chart view.

### File
- `app/dashboard/nurse/page.tsx` (within chart view)

### UI Specification

**Persistent Banner:**
- Left: Avatar, ชื่อ-สกุล, HN, VN, คิว, เพศ, อายุ, วันเกิด, สัญชาติ, คลินิก, สิทธิการรักษา
- Safety badges (in order of visual prominence):
  - 🔴 `Allergy: [ยาที่แพ้]` (สีแดงเด่นชัดที่สุด — First Safety Priority)
  - 🟠 `Pre-Caution: ...`
  - 🔵 `Chronic: ...`
- Right: real-time vital snapshot (BW, HT, BMI, BP, PR, T, SpO2)

**Expandable Demographics Drawer:**
- Button: `[ 📍 ดูที่อยู่ & ข้อมูลเวชระเบียน ▾ ]`
- Expands inline to show (without page navigation):
  - ที่อยู่ฉบับเต็ม (จาก PatientRecord.address)
  - เบอร์โทรศัพท์
  - เลขบัตรประชาชน (CID)
  - ผู้ติดต่อฉุกเฉิน / ญาติ + ความสัมพันธ์ + เบอร์โทร
  - สิทธิ + รพ.ต้นสังกัด + เลขหนังสือส่งตัว (ถ้ามี)
  - ยอดค้างชำระ (แดงถ้า > 0 บาท)

### Acceptance Criteria
- [ ] Red allergy badge renders before any other data
- [ ] Drawer opens/closes without page navigation
- [ ] Vital summary updates reactively as vitals are entered in T05
- [ ] Outstanding balance shows red warning badge if > 0

---

## T05: Core Vital Signs — Inline Editing, Auto-BMI & Clinical Threshold Alerts

**Priority:** P1
**Estimated Complexity:** Medium

### Objective
Build the "สัญญาณชีพหลัก" block of the Electronic OPD Card.

### File
- `app/dashboard/nurse/page.tsx` (within OPD Card section)

### UI Specification

**7-Column Vitals Grid:**
1. BW (kg, step 0.1) + HT (cm) → auto-calculates BMI + status badge
2. BP: SBP / DBP dual inputs — red pulsing card when SBP ≥ 180 or DBP ≥ 110
3. PR (/min)
4. Temp (°C, step 0.1) — fever badge if ≥ 37.5
5. SpO2 (%) — warning badge if < 95
6. RR (/min)
7. BMI (read-only, auto-calculated, color-coded)

**Pain Score:**
- 11 numbered buttons (0–10) with emoji labels (😀 → 😭)

**Repeat BP Option:**
- `[ + บันทึกความดันครั้งที่ 2 (หลังพัก 15 นาที) ]` button adds second BP row

**Fast-Track Integration:**
- On each vital change: call `evaluateFastTrackRules(vitals)` from `nurse-service.ts`
- If triggered: render alert card `🚨 FAST-TRACK ถูกเปิดใช้งาน: [reason]` + reorder queue

### Acceptance Criteria
- [ ] BMI recalculates on every BW/HT keystroke
- [ ] BP Crisis triggers red pulsing card (SBP ≥ 180)
- [ ] Fast-track alert appears within 200ms of typing critical value
- [ ] Pain score button highlights correctly on click

---

## T06: Dynamic Specialized Clinical Assessments

**Priority:** P2
**Estimated Complexity:** Small-Medium

### Objective
Build the specialized parameter system where nurses can add, edit, and remove clinical measurements beyond core vitals.

### File
- `app/dashboard/nurse/page.tsx`

### Predefined Presets

| Key | Label | Input Fields |
|---|---|---|
| `dtx` | 🩸 น้ำตาลปลายนิ้ว (DTX) | ค่า (mg/dL) + สถานะงดอาหาร |
| `waist` | 📏 เส้นรอบเอว | ค่า (cm) |
| `pregnancy` | 🤰 คัดกรองตั้งครรภ์/ให้นม | Checkbox + LMP date |
| `gcs` | 🧠 ระดับความรู้สึกตัว (GCS) | E + V + M + รวม |
| `o2_device` | 💨 อุปกรณ์ออกซิเจน | ประเภท + Flow Rate (LPM) |
| `head_circ` | 👶 เส้นรอบศีรษะเด็ก | ค่า (cm) |
| `custom` | ✏️ กำหนดเอง | ชื่อ + ค่า + หน่วย |

**Behaviors:**
- Dropdown `[ + เพิ่มค่าตรวจวัดลงแผ่น... ▾ ]` opens preset selector
- Each card has inline editable value field
- `[ ✕ ]` removes card instantly
- If clinic = Nuclear Medicine AND patient is female → auto-add `pregnancy` card on chart load

### Acceptance Criteria
- [ ] All 7 presets render with correct input fields
- [ ] `[ ✕ ]` removes card from `additionalItems` state instantly
- [ ] Nuclear Med + female patient auto-inserts pregnancy screening card

---

## T07: Nursing Notes, Hybrid Handover & Triaged History Tab

**Priority:** P2
**Estimated Complexity:** Medium

### Objective
Complete the triage workflow with nursing documentation, hybrid dispatch selection, handover action, and triaged history view.

### File
- `app/dashboard/nurse/page.tsx`

### UI Specification

**Nursing Notes Block:**
- `อาการสำคัญ (CC)` — editable textarea
- `ระดับความเร่งด่วน (Triage Category)` — dropdown (Level 1–5 with color indicators)
  - If FastTrack triggered: auto-sets urgency to Level 2 or 3

**Hybrid Dispatch Selector:**
- Toggle: `[ 🏥 คิวกลางของคลินิก ]` vs `[ 🚪 ระบุห้องตรวจแพทย์ ]`
- If "ระบุห้อง": room dropdown (filtered to current clinic's rooms)

**Save & Handover Button:**
- Label: `[ บันทึก & ส่งคิวเข้าห้องตรวจ ➔ ]`
- On click:
  1. Calls `buildTriagedVisit()` from `nurse-service.ts`
  2. Stamps: `triageCompletedAt`, `triageNurseName` (from `user.fullName`), `triageNurseLicenseNo` (from `user.licenseNumber`)
  3. Removes patient from waiting queue
  4. Shows success toast: `✓ ส่งต่อผู้ป่วย [ชื่อ] เข้าห้องตรวจเรียบร้อย (คิว A-02)`
  5. Returns to queue view

**Triaged History Today Tab:**
- Table of all visits triaged this session
- Columns: เวลาคัดกรอง | คิว | HN | ชื่อ | สัญญาณชีพสรุป | ห้องตรวจ | ปุ่มดูชาร์ต
- "ดูชาร์ต" opens read-only OPD Card with all recorded data

### Acceptance Criteria
- [ ] Dispatch type and room stored in visit payload
- [ ] Handover stamps `triageNurseName` and `triageNurseLicenseNo`
- [ ] Visit status changes to `triaged` after handover
- [ ] Patient disappears from waiting queue immediately after handover
- [ ] History tab shows completed patients with correct visit data

---

## T08: Integration Tests & Quality Gate

**Priority:** P3 (Quality Gate — run before merge)
**Estimated Complexity:** Small

### Objective
Ensure all 7 previous tickets compile together, tests pass, and the end-to-end nurse flow works in the browser.

### Additional Test Cases to Add
1. `evaluateFastTrackRules({ sbp: 140, dbp: 95 })` → `triggered: false` (Stage 1 HT, not crisis)
2. `filterQueueByClinic([], "คลินิกอายุรกรรม")` → `[]` (empty queue handled)
3. `buildTriagedVisit(input)` → `triageNurseName` is non-empty string
4. `buildTriagedVisit(input)` → `dispatchTarget.type` is one of `["pooled_clinic", "specific_room"]`
5. `sortQueueByPriority([routineA, fastTrack, routineB])` → fastTrack at index 0, routineA at index 1

### Final Verification Checklist
- [ ] `npm run typecheck` → 0 errors
- [ ] `npx vitest run src/lib/triage/nurse-service.test.ts` → all tests pass
- [ ] Manual browser: open `http://localhost:3000/dashboard/nurse` as `nurse` login
- [ ] Verify: clinic selector filters queue ✓, Call Patient opens chart ✓, BMI auto-calculates ✓, BP crisis alert shows ✓, Fast-track promotes queue row ✓, Handover removes patient from queue ✓

---

## Execution Order Summary

```text
T01 — Type Contracts (Foundation)
  └──▶ T02 — Nurse Service + Unit Tests (TDD: RED → GREEN)
         └──▶ T03 — Queue View & Clinic Selector
                └──▶ T04 — Patient Banner & Demographics
                       └──▶ T05 — Core Vitals & Alerts
                              └──▶ T06 — Dynamic Parameters
                                     └──▶ T07 — Handover & History
                                            └──▶ T08 — Integration + Typecheck
```
