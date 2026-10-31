# ADR 0004: Separation of Prescriptions from Diagnostic Orders and Strict Cancellation/Refund Policy

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (Clinical Orders & Medication Management)

## Context & Problem Statement
ข้อกำหนดเดิมระบุให้มี Centralized Dynamic Orders ด้วยฟิลด์ `details` (JSONB) สำหรับรองรับ Lab, X-ray, Nuclear Imaging อย่างไรก็ตาม ในระบบโรงพยาบาล วงรอบชีวิต (Life cycle) และโครงสร้างข้อมูลของ "การสั่งยา (Prescriptions)" แตกต่างจากคำสั่งตรวจทางห้องปฏิบัติการอย่างสิ้นเชิง ยามีความเสี่ยงเรื่องการแพ้ยา (Allergy), ขนาดยา, ความถี่, การนับสต็อก และการจ่ายยาทางเภสัชกรรม

นอกจากนี้ การยกเลิกคำสั่งตรวจ (Order Cancellation) จำเป็นต้องมีเส้นแบ่งที่ชัดเจนเพื่อป้องกันความขัดแย้งกับกระบวนการเตรียมสารรังสี/หัตถการ และการกระทบยอดบัญชีการเงินกรณีที่มีการชำระเงินล่วงหน้า (Pre-paid) ไปแล้ว

## Decision Drivers
1. **Clinical Safety:** การสั่งยาต้องมีโครงสร้างแบบ Normalized Relational ข้อมูลยาผูกกับรหัสยามาตรฐาน เพื่อให้สามารถตรวจสอบ Drug Allergy ได้อย่างแม่นยำ
2. **Operational Boundaries:** คำสั่งตรวจที่เข้าสู่ขั้นตอนเตรียมการ (เช่น ผสมสารรังสี หรือจัดห้องตรวจ) ห้ามถูกยกเลิกโดยพลการ
3. **Financial Integrity:** บัญชีและการเงินต้องไม่ถูกยกเลิก/คืนเงินโดยอัตโนมัติจากฝั่งห้องตรวจ ต้องมีเจ้าหน้าที่การเงินอนุมัติและทำรายการ Void/Refund เสมอ

## Considered Options
- **มุมมอง A (รวมยาทุกตัวลงในตาราง `orders` รวมศูนย์):** ทุกอย่างคือ Order เก็บรายละเอียดใน JSONB
- **มุมมอง B (แยกตาราง `prescriptions` และ `prescription_items` ชัดเจน):** ตาราง `orders` ดูแลเฉพาะคำสั่งตรวจ/หัตถการ ส่วนยานำไปจัดการในโมดูลเภสัชกรรม

## Decision Outcome
เลือก **มุมมอง B (แยกตาราง Prescriptions ชัดเจน) พร้อมกำหนดนโยบาย Cancellation & Refund อย่างเคร่งครัด**:

### 1. Data Model Separation
- **ตาราง `orders` (Diagnostic & Clinical Procedures):**
  - ใช้สำหรับ Lab, X-ray, Nuclear Imaging, และ I-131 Therapy
  - โครงสร้าง: `id`, `visit_id`, `order_type`, `payment_type` (pre_paid / post_paid), `status` (Micro State), `details` (JSONB + GIN Index สำหรับค่าทางเทคนิค), `ordered_by`, `ordered_at`
- **ตาราง `prescriptions` และ `prescription_items` (Pharmacy Module):**
  - `prescriptions`: หัวใบสั่งยา ผูกกับ `visit_id`, `doctor_id`, `status` (`pending`, `verified`, `dispensed`, `cancelled`)
  - `prescription_items`: รายการยารายตัว มี `medication_id` (FK ชัดเจน), `dosage`, `frequency`, `duration`, `quantity`, `is_covered` (ยานอกสิทธิ์/ในสิทธิ์), `unit_price`, `total_price`
- **ตาราง `invoices` / `receipts` (Billing Aggregation):**
  - รวมยอดเงินโดยดึงจากทั้ง `orders` (ค่าตรวจ) และ `prescription_items` (ค่ายา) เข้าสู่ใบแจ้งหนี้เดียวกัน

### 2. Strict Cancellation Policy (Micro State Guardrails)
- การยกเลิกคำสั่งตรวจ (`orders.status = 'cancelled'`):
  - อนุญาตให้แพทย์หรือผู้สั่งตรวจยกเลิกได้ **เฉพาะเมื่อสถานะของคำสั่งตรวจอยู่ในช่วง `ordered` หรือ `scheduled` เท่านั้น**
  - เมื่อคำสั่งตรวจเข้าสู่สถานะ `in_prep`, `in_procedure`, `result_pending`, หรือ `completed` แล้ว **ระบบจะปฏิเสธการยกเลิกโดยตรง (Database Constraint / RLS Enforced)**
- หากมีความจำเป็นต้องยกเลิกหลังจากเข้าห้องตรวจแล้ว ต้องผ่านการบันทึกหมายเหตุข้อผิดพลาดทางเทคนิค (Incident Note) โดยแผนกตรวจนั้นๆ

### 3. Pre-paid Refund & Void Policy
- หาก Order ที่ถูกยกเลิกได้รับการชำระเงินไปแล้ว (`payment_status = 'paid'`):
  - การยกเลิก Order จะ **ไม่ทำให้เงินถูกคืนโดยอัตโนมัติ (No Auto-Refund)**
  - ระบบจะสร้างสถานะ `refund_pending` ให้ใบเสร็จนั้น
  - เจ้าหน้าที่การเงิน (`cashier`) หรือ `admin` ต้องเป็นผู้กดดำเนินการตรวจสอบและยืนยัน **Void / Refund** ผ่านหน้าจอการเงินอย่างเป็นทางการ พร้อมระบุเหตุผลเพื่อคงความถูกต้องของการปิดยอดเงินสด/บัญชีประจำวัน

## Consequences
- **Positive:** ข้อมูลยามีความปลอดภัยสูง ตรวจสอบประวัติแพ้ยาได้แม่นยำ, ป้องกันปัญหาห้องแล็บ/นิวเคลียร์เตรียมของเก้อ, บัญชีการเงินถูกต้องตรงกัน 100%
- **Negative / Trade-offs:** ต้องสร้าง DDL และฟอร์มสำหรับ Prescriptions แยกต่างหากจาก Orders แต่คุ้มค่าอย่างยิ่งในแง่ Clinical & Finance Stability
