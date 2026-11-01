# Specification: Step 02 - OPD Nursing Workstation & Vitals Triage Engine

- **Status:** Draft / Ready for Tickets
- **Target Module:** ก้าวที่ 2: ระบบงานการพยาบาลผู้ป่วยนอก (OPD Nursing Workstation)
- **Governing Architecture Decisions:**
  - [ADR 0006: Clinic-Specific Nursing Workstation and Queue Segregation](./adr/0006-clinic-specific-nursing-workstation-and-queue-segregation.md)
  - [ADR 0007: Single-Sheet Interactive Electronic OPD Card and Categorized Clinical Assessment](./adr/0007-single-sheet-interactive-opd-card-and-assessment.md)
  - [ADR 0008: Hybrid Clinic Exam Queue Handover and Automated Triage Fast-Track Escalation](./adr/0008-hybrid-exam-queue-and-automated-fast-track.md)

---

## Problem Statement

ในโรงพยาบาลศูนย์มหาราชนครราชสีมา มีผู้ป่วยนอกหลั่งไหลเข้ามารับบริการวันละ 4,000–5,000 คน เมื่อผู้ป่วยผ่านการเปิด Visit จากโต๊ะเวชระเบียนแล้ว ขั้นตอนการพยาบาลต้องเผชิญกับปัญหาสำคัญดังนี้:

1. **คิวคนไข้ปะปนกันข้ามคลินิก:** หากระบบแสดงคิวรวม พยาบาลแต่ละคลินิกเฉพาะทาง (เช่น คลินิกอายุรกรรม, คลินิกเด็ก, เวชศาสตร์นิวเคลียร์) จะต้องเสียเวลาค้นหาคนไข้ของตนเอง เกิดความล่าช้าและเสี่ยงเรียกคนไข้ผิดห้อง
2. **ระบบชาร์ตเวชระเบียนกระจัดกระจายหลายหน้าต่าง:** พยาบาลต้องคลิกสลับหน้าไปมาเพื่อดูข้อมูลที่อยู่/สิทธิจากเวชระเบียน สลับไปหน้าคีย์ความดัน และสลับไปดูประวัติแพ้ยา ทำให้เกิดความเมื่อยล้าและข้อมูลสำคัญตกหล่น
3. **ขาดความยืดหยุ่นในการตรวจวัด:** แต่ละคลินิกมีค่าตรวจวัดเฉพาะทางต่างกัน (เช่น คลินิกเบาหวานต้องเจาะ DTX, คลินิกนิวเคลียร์ต้องคัดกรองตั้งครรภ์ก่อนฉีดรังสี) หากระบบล็อกฟอร์มตายตัว พยาบาลจะไม่สามารถบันทึกค่าจำเป็นได้
4. **ความเสี่ยงต่อชีวิตจากสัญญาณชีพวิกฤต:** ผู้ป่วยที่มีภาวะความดันโลหิตสูงวิกฤต (SBP ≥ 180 mmHg) หรือออกซิเจนต่ำ หากต้องนั่งรอคิวตรวจตามลำดับปกติ (FIFO) มีความเสี่ยงสูงต่อภาวะหลอดเลือดสมองแตก (Stroke) หรือหัวใจล้มเหลวเฉียบพลัน

---

## Solution

พัฒนาระบบงาน **"ระบบงานการพยาบาลผู้ป่วยนอก (OPD Nursing Workstation)"** ที่ทำงานในรูปแบบ **Single Patient View (Digital Medical Sheet)**:

1. **Clinic-Specific Queue Isolation:** พยาบาลเลือกคลินิกประจำการที่หัวหน้าจอ (เช่น คลินิกอายุรกรรม) ระบบจะกรองแสดงเฉพาะผู้ป่วยที่ถูกส่งมายังคลินิกนั้น พร้อมปุ่มกดเรียกคิว (Call Queue)
2. **Interactive Single-Sheet Electronic OPD Card:** แผ่นชาร์ตเสมือนกระดาษแผ่นเดียวที่รวมทุกข้อมูล (ชื่อ, HN, VN, ป้ายเตือนแพ้ยาสีแดง, สิทธิ, ที่อยู่เวชระเบียน) และสามารถคลิกพิมพ์แก้ไขตัวเลขสัญญาณชีพ เพิ่ม หรือลบค่าตรวจวัดได้โดยตรงบนแผ่นเดียว
3. **Core Vitals & Dynamic Specialized Parameters:**
   - สัญญาณชีพหลัก: BW, HT, คำนวณ BMI อัตโนมัติ, BP, PR, Temp, RR, SpO2, และ Pain Score (0–10)
   - ค่าตรวจเฉพาะทางแบบพลวัต: เพิ่ม/ลบ DTX, เส้นรอบเอว, คัดกรองการตั้งครรภ์/ให้นมบุตร (รังสีวิทยา), GCS Score, หรือกำหนดค่าเองได้อิสระ
4. **Automated Triage Fast-Track Rule Engine:** ตรวจจับสัญญาณชีพวิกฤตอัตโนมัติ (เช่น BP ≥ 180 mmHg, SpO2 < 92%, T ≥ 39.0 °C) และยกระดับคิวเป็น Priority Queue แทรกขึ้นอันดับแรกพร้อมแถบสีแดงกระพริบเตือนทันที
5. **Hybrid Exam Queue Handover:** พยาบาลสามารถเลือกส่งต่อผู้ป่วยเข้าสู่ "คิวกลางของคลินิก" หรือ "เจาะจงห้องตรวจแพทย์ (เช่น ห้อง 101)" และอัปเดตสถานะเป็น `triaged` (คัดกรองแล้ว พร้อมพบแพทย์) ทันที

---

## User Stories

### A. Clinic Station & Workstation Context (ADR 0006)
1. As a nurse, I want to see my assigned clinic station prominently on the top bar, so that I am immediately aware of my current duty station.
2. As a nurse rotating shifts, I want to switch my active clinic duty from a header dropdown, so that I can cover another clinic without requesting IT permission.
3. As a nurse in the Internal Medicine clinic, I want the waiting queue to show only patients routed to Internal Medicine, so that queues from other clinics do not clutter my screen.
4. As a nurse, I want the waiting queue to clearly distinguish Walk-in patients from Appointment and Referral cases, so that I can prioritize intake appropriately.
5. As a nurse, I want to click a "Call Patient" button on a queue row, so that the patient's Electronic OPD Card opens immediately on my screen.

### B. Persistent Patient Banner & Demographic Integration (ADR 0007)
6. As a nurse, I want a persistent patient summary banner pinned at the top of the chart, so that I never lose sight of the patient's identity (HN, VN, Name, Age, Gender).
7. As a nurse, I want a prominent red Allergy alert banner displayed on the patient header, so that I am warned of severe drug allergies (e.g., Penicillin) before initiating clinical intake.
8. As a nurse, I want to click a quick "View Address & Registrar Intake" button on the banner, so that I can inspect the patient's full address, phone number, and emergency contact without navigating away.
9. As a nurse, I want to see the patient's insurance scheme, referral document number, and outstanding balance status on the banner, so that I understand their financial and administrative context.
10. As a nurse, I want the patient header to continuously display real-time vital sign snapshots (BW, HT, BMI, BP, PR, Temp, SpO2), so that I have a continuous overview while reading clinical notes.

### C. Core Vitals & Inline Direct Editing (ADR 0007)
11. As a nurse, I want to enter body weight (kg) and height (cm) directly into the chart, so that the system automatically calculates BMI and assigns a nutritional status badge (Underweight, Normal, Overweight, Obese).
12. As a nurse, I want to enter systolic and diastolic blood pressure (SBP/DBP), so that values are recorded in standard mmHg format.
13. As a nurse, I want to enter pulse rate (bpm), body temperature (°C), respiratory rate (/min), and oxygen saturation (SpO2 %), so that baseline vital signs are complete.
14. As a nurse, I want to click directly into any vital sign field to edit numbers inline, so that data entry feels as fast and natural as writing on paper.
15. As a nurse, I want to select a Pain Score from 0 to 10 with emotional facial indicators, so that the patient's pain intensity is objectively recorded.
16. As a nurse, I want the system to warn me if body temperature is ≥ 37.5 °C (Low Fever) or ≥ 38.5 °C (High Fever), so that I can prepare antipyretic care.
17. As a nurse, I want the system to warn me if SpO2 is < 95%, so that I can evaluate the need for supplemental oxygen.

### D. Dynamic Specialized Clinical Assessments (ADR 0007)
18. As a nurse in an NCD or Diabetic clinic, I want to add a capillary blood glucose (DTX) parameter to the chart, so that I can record pre-meal or fasting sugar levels.
19. As a nurse in a Metabolic clinic, I want to add a waist circumference (cm) parameter, so that metabolic syndrome risks can be tracked.
20. As a nurse in Nuclear Medicine or Radiology, I want a pregnancy/lactation screening check on the chart, so that female patients of childbearing age are verified before radiopharmaceutical administration.
21. As a nurse managing an acute trauma or neurological patient, I want to add a Glasgow Coma Scale (GCS) assessment, so that eye, verbal, and motor responses (3-15) are documented.
22. As a nurse, I want to add custom clinical parameters with custom names and values, so that non-standard observations can be recorded directly on the sheet.
23. As a nurse, I want a delete button (`✕`) on every specialized assessment card, so that unneeded parameters can be removed instantly without cluttering the chart.

### E. Clinical Safety & Automated Triage Fast-Track (ADR 0008)
24. As a nurse, I want the system to automatically detect a Hypertensive Crisis (SBP ≥ 180 mmHg or DBP ≥ 110 mmHg), so that the patient is immediately flagged for emergency doctor review.
25. As a nurse, I want patients with critical vital signs to be automatically promoted to the top of the clinic queue with a pulsing red `🚨 FAST-TRACK` badge, so that doctors see them ahead of routine queues.
26. As a nurse, I want the fast-track rule engine to trigger on severe hypoxia (SpO2 < 92%) and severe pain (Pain Score ≥ 8/10), so that life-threatening symptoms receive zero-delay escalation.
27. As a nurse, I want the escalation reason to be recorded in the audit trail, so that the clinical decision to prioritize the patient is legally accountable.

### F. Nursing Assessment & Doctor Handover (ADR 0007 & ADR 0008)
28. As a nurse, I want to record and refine the Chief Complaint (CC) and Present Illness notes, so that the examining physician receives a concise clinical briefing.
29. As a nurse, I want to select between handing over to the "Pooled Clinic Queue" or a "Specific Doctor Room (e.g., Room 101)", so that patient dispatch matches the clinic's operating model.
30. As a nurse, I want to click a single "Save & Handover to Doctor" button, so that the visit status updates to `triaged` and the patient's queue number appears on the doctor's workstation.
31. As a nurse, I want the handover record to timestamp the completion time and stamp my name and nursing license number, so that nursing documentation meets clinical governance standards.
32. As a nurse, I want a "Triaged History Today" view, so that I can review, edit, or reprint routing slips for patients already triaged during my shift.

---

## Implementation Decisions

### 1. Modules to be Built / Modified
- **`src/lib/triage/nurse-service.ts` (New Domain Service):**
  - Manages nurse workstation queues, core vitals calculations, dynamic parameter attachments, automated fast-track rule evaluation, and visit status transitions from `registered` to `triaged`.
- **`src/lib/triage/nurse-service.test.ts` (Unit & Regression Tests):**
  - 100% test coverage for BMI calculation, threshold alerts, queue filtering by clinic, priority reordering on critical vitals, and handover payload validation.
- **`app/dashboard/nurse/page.tsx` (Production UI Component):**
  - Upgrades placeholder into the full OPD Nursing Workstation using the proven single-sheet architecture prototyped in `app/preview/opd-card/page.tsx`.
- **`src/types/nurse.ts` (Type Contracts):**
  - Definitive TypeScript interfaces for `CoreVitalSigns`, `SpecializedAssessmentItem`, `NurseTriageInput`, and `FastTrackRuleResult`.

### 2. High-Level Testing Seams
- **Primary Seam (`src/lib/triage/nurse-service.ts`):**
  - All clinical calculations (BMI, threshold evaluation, priority queue sorting, status transition) will be tested through pure service functions decoupled from the DOM.
- **UI Integration Seam (`app/dashboard/nurse/page.tsx`):**
  - Verified through typecheck, Vitest component behavior tests, and interactive browser verification.

### 3. Architectural Alignment
- Aligned 100% with ADR 0001–0005 (Registrar & Numbering) and ADR 0006–0008 (Nurse Workstation, Single-sheet EMR, Fast-track Escalation).
- Strict segregation of nursing boundaries: Doctor clinical notes, prescriptions, and lab ordering are deferred to Step 03.
