# ADR 0011: Ten-Role Database RLS Matrix and Medical Technologist (med_tech) Segregation

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (Role-Based Access Control & Clinical Security Matrix)

## Context & Problem Statement
ระบบข้อกำหนดเดิมระบุผู้ใช้งาน 9 บทบาท โดยยังไม่มีการแยกบทบาทของห้องปฏิบัติการทางการแพทย์ (Laboratory) ออกมาเป็นเอกเทศ ทำให้มีความเสี่ยงที่การจัดการคำสั่งตรวจแล็บจะไปปะปนกับบทบาทอื่น การเพิ่มบทบาทที่ 10 คือ นักเทคนิคการแพทย์ (`med_tech`) เข้ามา จำเป็นต้องมีนิยามขอบเขตสิทธิ์ (Permission Boundaries) ระดับ Database Row Level Security (RLS) ที่เข้มงวด เพื่อให้ข้อมูลผลแล็บ การรายงานผล และการเข้าถึงข้อมูลสุขภาพของผู้ป่วยเป็นไปตามหลักการ Least Privilege

## Decision Drivers
1. **Principle of Least Privilege:** แต่ละบทบาทเข้าถึงและแก้ไขได้เฉพาะตารางข้อมูลที่จำเป็นต่อการปฏิบัติงานของตนเองเท่านั้น
2. **Separation of Clinical Diagnostics:** แยกการปฏิบัติงานของห้องปฏิบัติการทั่วไป (`med_tech`) ออกจากงานเวชศาสตร์นิวเคลียร์ (`nuclear_med`) อย่างเด็ดขาด
3. **Complete RLS Coverage:** ทุกตารางในฐานข้อมูลต้องมี RLS Policy กำกับผูกกับ `auth.jwt() -> 'app_metadata' ->> 'active_role'`

## Decision Outcome
เลือกสถาปัตยกรรม **10-Role Explicit Database RLS Matrix** โดยเพิ่มบทบาท `med_tech` เป็นบทบาทที่ 10:

### 1. The 10 Hospital Roles
1. `registrar` (เวชระเบียน)
2. `nurse` (พยาบาลคัดกรอง)
3. `doctor` (แพทย์)
4. `med_tech` (นักเทคนิคการแพทย์ - บทบาทใหม่)
5. `nuclear_med` (เจ้าหน้าที่เวชศาสตร์นิวเคลียร์)
6. `cashier` (การเงิน)
7. `pharmacist` (เภสัชกร)
8. `warehouse` (คลังสินค้า)
9. `admin` (ผู้ดูแลระบบ)
10. `director` (ผู้อำนวยการ)

### 2. Comprehensive Database RLS Matrix
| บทบาท (`active_role`) | INSERT / UPDATE Permission | SELECT Permission (Direct or via RPC) | Restrictions & Constraints |
|---|---|---|---|
| **`registrar`** | `patients`, `visits` | `patients`, `visits`, `invoices` (สรุปยอดหนี้) | ห้ามดูประวัติการรักษา, ผลแล็บ, และยาเชิงลึก |
| **`nurse`** | `vital_signs`, `visits` (status: `triaged`), `triage_notes` | `patients`, `vital_signs`, `visits`, `allergies` | ห้ามสั่งยา, ห้ามสั่งตรวจแล็บ |
| **`doctor`** | `diagnoses`, `medical_records`, `orders`, `prescriptions`, `visits` | ทุกตารางคลินิกผ่าน `log_access` | สั่งยา, สั่งตรวจ, วินิจฉัย ICD-10, สั่ง Doctor Review |
| **`med_tech`** | `lab_results`, `orders` (เฉพาะ `order_type = 'lab'`) | `orders` (เฉพาะแล็บ), `patients` (ข้อมูลพื้นฐาน), `vital_signs` | ห้ามสั่งยา, ห้ามดูประวัติการรักษาอื่น, ห้ามเข้าถึงนิวเคลียร์ |
| **`nuclear_med`** | `orders` (เฉพาะ `order_type = 'nuclear'`), Safety Checklist, Dose snapshots | `orders`, `patients`, `vital_signs`, ผลแล็บ UPT | ดูแลเฉพาะสารรังสีและการตรวจทางนิวเคลียร์ |
| **`cashier`** | `invoices`, `receipts`, `payments`, `visits` (`pending_payment` ➔ ต่อไป) | `invoices`, `payments`, `visits`, สรุปรายการคำสั่งตรวจ/ยา | ห้ามดูผลตรวจและบันทึกแพทย์เชิงลึก, มีสิทธิ์ Void/Refund |
| **`pharmacist`** | `prescriptions` (status: `dispensed`), `inventory_transactions` | `prescriptions`, `prescription_items`, `allergies`, `medications` | ตรวจสอบ Drug Allergy, จ่ายยา, ดูยอดสต็อก |
| **`warehouse`** | `medications` (รับเข้าสต็อก), `inventory_transactions` | `medications`, `inventory_transactions` | เข้าถึงข้อมูลผู้ป่วยและข้อมูลคลินิกไม่ได้เลย |
| **`admin`** | `user_roles`, `user_profiles`, ตั้งค่าระบบ | ทุกตาราง รวมถึง `audit_logs` และ `access_logs` | จัดการผู้ใช้และระบบ, ตรวจสอบและส่งออก Audit Log |
| **`director`** | Read-only (ยกเว้น Clinical Override) | ทุกตาราง รวมถึง `audit_logs` และ Director Dashboard | เรียกดูสถิติผู้บริหารและตรวจสอบความปลอดภัย |

### 3. Seed Data Specification Update
- เพิ่มผู้ใช้ทดสอบบทบาท `med_tech` เข้าสู่ Seed Script รวมเป็น 10 บัญชีผู้ใช้ตัวแทนทั้ง 10 บทบาท
- บัญชีตัวอย่างสามารถสลับบทบาท (Switch Active Role) เพื่อทดสอบ RLS Boundary ได้ทันที

## Consequences
- **Positive:** การแบ่งแยกหน้าที่ชัดเจน (Segregation of Duties) ป้องกันความผิดพลาดของบุคลากรข้ามสายงาน และสอดคล้องกับมาตรฐานความปลอดภัยโรงพยาบาลระดับสากล
- **Negative / Trade-offs:** ต้องเขียน RLS Policies แยกเงื่อนไขตาม `order_type` สำหรับตาราง `orders`
