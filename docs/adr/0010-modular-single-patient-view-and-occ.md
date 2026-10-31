# ADR 0010: Modular Single Patient View Dashboard and System-Wide Optimistic Concurrency Control (OCC)

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (UI/UX Architecture & Data Concurrency Integrity)

## Context & Problem Statement
ระบบ OPD มีวิสัยทัศน์หลักคือ Single Patient View เพื่อให้ผู้ป่วย 1 คนมีข้อมูลชุดเดียวและเข้าถึงได้จากทุกแผนก อย่างไรก็ตาม แต่ละแผนก (พยาบาล, แพทย์, การเงิน, เภสัชกร, เวชศาสตร์นิวเคลียร์) มีความต้องการโฟกัสข้อมูลที่แตกต่างกัน หากแยกหน้าจอเป็นหลาย URL ตามบทบาทจะทำให้สูญเสียคอนเซปต์ Single View และโค้ดซ้ำซ้อน

นอกจากนี้ ในการทำงานจริงของโรงพยาบาล มักเกิดเหตุการณ์แก้ไขข้อมูลพร้อมกันข้ามแผนก (Concurrent Updates) เช่น พยาบาลกำลังอัปเดต Vital Signs ขณะที่แพทย์กำลังบันทึกผลการตรวจ หรือการเงินกำลังคิดเงินขณะหมอสั่งยาเพิ่ม หากไม่มีการควบคุม Concurrency อาจเกิดเหตุการณ์เขียนทับข้อมูลโดยไม่รู้ตัว (Dirty Overwrite / Lost Updates)

## Decision Drivers
1. **Single Source of Truth UI:** หน้าจอเดียวที่รวมข้อมูลประวัติผู้ป่วยไว้ครบถ้วน แต่ปรับการจัดวาง (Layout & Prioritization) ให้เข้ากับภาระงานของแต่ละบทบาทโดยอัตโนมัติ
2. **Zero Dirty Overwrite:** ป้องกันการเขียนทับข้อมูลที่ถูกแก้ไขไปก่อนหน้าโดยบุคลากรท่านอื่นแบบ 100%
3. **Consistency with Audit Integrity:** การควบคุม Concurrency ต้องไม่ขัดแย้งกับหลักการ Append-Only ของตาราง Audit Trail

## Decision Outcome
เลือกสถาปัตยกรรม **Modular Widget Dashboard (`/patient/[hn]`) ปรับตาม Active Role** ร่วมกับ **System-Wide Optimistic Concurrency Control (OCC) โดยยกเว้นตาราง Audit Logs**:

### 1. Modular Widget Dashboard Architecture (`/patient/[hn]`)
- รวมศูนย์หน้าแสดงข้อมูลผู้ป่วยไว้ที่ Path เดียว (`/patient/[hn]`)
- ประกอบด้วย Reusable Modular Widgets:
  - `PatientBannerWidget`: ข้อมูลประจำตัว, รูปถ่าย, HN, อายุ, สิทธิการรักษา, และ Badge แจ้งเตือนสำคัญ (Allergies, Debt Alert)
  - `VitalSignsWidget`: สัญญาณชีพปัจจุบันและแนวโน้มย้อนหลัง
  - `ClinicalEncounterWidget`: การซักประวัติ, บันทึกการตรวจ (SOAP), รหัสโรค ICD-10
  - `DiagnosticOrdersWidget`: คำสั่งตรวจทางห้องปฏิบัติการ, X-ray, เวชศาสตร์นิวเคลียร์ พร้อม Micro State
  - `PrescriptionWidget`: รายการยาสั่งจ่าย, ขนาดยา, คำเตือนการแพ้ยา, สถานะการจ่ายยา
  - `BillingSummaryWidget`: สรุปยอดค่าใช้จ่าย, รายการใน/นอกสิทธิ์, สถานะใบแจ้งหนี้
  - `NuclearSafetyWidget`: Safety Checklist, บันทึก Calibrated & Administered Dose (แสดงเฉพาะเมื่อมี Order นิวเคลียร์)
- **Role-Adaptive Layout:**
  - `doctor`: ไฮไลต์ ClinicalEncounter, DiagnosticOrders และ Prescription เป็นแถวแรก
  - `nurse`: ไฮไลต์ VitalSigns และ Triage Notes
  - `cashier`: ไฮไลต์ BillingSummary และ Orders Payment Status
  - `pharmacist`: ไฮไลต์ Prescription และ Drug Allergies
  - `nuclear_med`: ไฮไลต์ NuclearSafetyWidget และ Decay Calculator

### 2. System-Wide Optimistic Concurrency Control (OCC)
- **Schema Enforcement:** บังคับใส่ 2 คอลัมน์ในทุกตารางข้อมูลที่สามารถแก้ไขได้ (All Mutable Tables):
  - `updated_at`: TIMESTAMPTZ (อัปเดตอัตโนมัติผ่าน DB Trigger)
  - `version`: INTEGER DEFAULT 1 (เพิ่มขึ้นทีละ 1 ทุกครั้งที่มีการแก้ไข)
  - *ตารางที่บังคับใช้:* `patients`, `visits`, `vital_signs`, `medical_records`, `diagnoses`, `prescriptions`, `prescription_items`, `orders`, `medications`, `invoices`, `user_roles`
- **OCC Update Contract:**
  - ทุกคำสั่ง `UPDATE` ฝั่ง Application / API จะต้องส่งค่า `version` เดิมที่ดึงไปตอนแรกไปด้วย:
    ```sql
    UPDATE patients 
    SET first_name = $1, version = version + 1, updated_at = now()
    WHERE id = $2 AND version = $3;
    ```
  - หาก `ROW_COUNT() = 0` (แปลว่ามีผู้อื่นแก้ไขข้อมูลไปก่อนแล้ว):
    - ระบบจะ Rollback Transaction ทันที
    - Frontend แสดง Pop-up Modal แจ้งเตือนผู้ใช้: *"ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณารีเฟรชข้อมูลก่อนบันทึกซ้ำ"*
- **Explicit Exemption for Audit Tables:**
  - **ยกเว้นตาราง `audit_logs` และ `access_logs` จาก OCC โดยเด็ดขาด**
  - ไม่ใส่คอลัมน์ `updated_at` และ `version` ในตาราง Audit
  - ตาราง Audit ยังคงเป็นแบบ **Append-Only 100% (INSERT only, REVOKE UPDATE/DELETE)** ใช้คอลัมน์ `created_at` สำหรับบันทึกเวลาที่เกิดเหตุการณ์

## Consequences
- **Positive:** ประสบการณ์การใช้งานลื่นไหลและตรงจุดสำหรับทุกวิชาชีพ, ข้อมูลไม่สูญหายจากการเขียนทับกัน, สถาปัตยกรรมมีความน่าเชื่อถือสูงมาก
- **Negative / Trade-offs:** ผู้ใช้งานอาจพบหน้าต่างเตือน Concurrency Conflict หากทำงานพร้อมกันใน Visit เดียวกัน และต้องกดรีเฟรชข้อมูลเพื่อดูค่าล่าสุด
