# ADR 0009: Payment Policy, Rule-Based Post-Paid Workflow, Consolidated Invoicing, and Walkout Debt Management

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (Cashier & Revenue Cycle Management)

## Context & Problem Statement
ระบบ OPD มีกระแสเงินหมุนเวียนจากทั้งค่าตรวจวินิจฉัย (Lab, X-ray, Nuclear Imaging, I-131) ค่ายา และค่าธรรมเนียมทางการแพทย์ การตรวจบางประเภทต้องดำเนินการอย่างเร่งด่วน หรือมีขั้นตอนเตรียมสารรังสีที่จำเพาะเจาะจง หากบังคับให้ชำระเงินล่วงหน้า (Pre-paid) ทุกกรณีจะทำให้การรักษาล่าช้าและส่งผลเสียต่อผู้ป่วย แต่ในขณะเดียวกัน การอนุญาตให้ตรวจก่อนจ่ายทีหลัง (Post-paid) โดยไม่มีการควบคุม อาจนำไปสู่ปัญหาผู้ป่วยไม่ชำระเงินแล้วเดินทางกลับ (Walkout / Bad Debt)

## Decision Drivers
1. **Clinical Timeliness:** ไม่ให้กระบวนการชำระเงินเป็นคอขวดที่ขัดขวางการรักษาเคสฉุกเฉินหรือเคสสารรังสีที่มีอายุการสลายตัว (Decay)
2. **Simplified Financial Reconciliation:** รวมรายการค่าใช้จ่ายทั้งหมดใน Visit นั้นออกเป็นใบแจ้งหนี้และใบเสร็จรับเงินฉบับเดียว (Consolidated Invoicing) เพื่อความสะดวกของผู้รับบริการและฝ่ายบัญชี
3. **Loss Prevention & Risk Mitigation:** ป้องกันการเกิดหนี้สูญสะสมโดยมีระบบติดตามยอดค้างชำระและแจ้งเตือนทันทีเมื่อผู้ป่วยกลับมาเข้ารับบริการในครั้งถัดไป

## Decision Outcome
เลือกสถาปัตยกรรม **Rule-Based Post-Paid Auto-Approval**, **Consolidated Single Invoicing**, และ **Walkout Status with Cross-Department Debt Alert**:

### 1. Rule-Based Post-Paid Assignment
- **Default Policy:** คำสั่งตรวจทางห้องปฏิบัติการและเอกซเรย์ทั่วไป (Routine Lab & X-ray) จะถูกตั้งค่าเริ่มต้นเป็น `payment_type = 'pre_paid'` (ต้องชำระเงินก่อน แผนกจึงจะเริ่มทำหัตถการ)
- **Auto-Approval Rules for Post-Paid:**
  - **เคสฉุกเฉิน (Emergency Triage Level):** ผู้ป่วยที่มีระดับความเร่งด่วนฉุกเฉิน ระบบจะ Bypass เป็น `post_paid` อัตโนมัติทุก Order
  - **เคสเวชศาสตร์นิวเคลียร์ (Nuclear Medicine / I-131 / Scans):** ระบบจะตั้งค่าเป็น `post_paid` อัตโนมัติ เพื่อให้กระบวนการคำนวณและฉีดสารรังสีดำเนินไปได้ตรงตามตารางเวลาการสลายตัวของสาร
  - มีสิทธิ์ให้แพทย์สามารถเลือก Override ปรับเป็น `post_paid` ได้ตามดุลยพินิจทางคลินิก

### 2. Consolidated Final Invoicing
- เมื่อคนไข้เสร็จสิ้นกระบวนการตรวจรักษาและวนมาที่แผนกการเงินรอบสุดท้าย (`pending_payment`):
  - Database Function `generate_visit_invoice(p_visit_id)` จะทำการ Aggregate ค่าใช้จ่ายทั้งหมด:
    1. รายการ Post-paid Orders ทั้งหมดที่ตรวจเสร็จสิ้นแล้วและยังไม่มียอดชำระ
    2. รายการยาใน `prescriptions` และ `prescription_items` ที่แพทย์สั่ง
    3. ค่าบริการทางการแพทย์และค่าธรรมเนียมโรงพยาบาล (Nursing & Facility Fees)
  - ออกเป็น **ใบแจ้งหนี้เดียว (Consolidated Invoice)** และออก **ใบเสร็จรับเงินฉบับเดียว (Official Receipt)** หลังรับเงินเรียบร้อย
  - รองรับการแยกแสดงรายการในสิทธิ์ (Covered) และยานอกสิทธิ์/ส่วนเกินที่ต้องจ่ายเอง (Non-covered Out-of-pocket)

### 3. Walkout Policy & Outstanding Balance Management
- หากผู้ป่วยไม่มาชำระเงินและเดินทางออกจากโรงพยาบาล:
  - ฝ่ายการเงิน (`cashier`) หรือ `admin` สามารถปรับสถานะ Visit เป็น **`unpaid_debt`**
  - ระบบบันทึกยอดหนี้ค้างชำระ (`outstanding_balance`) ผูกเข้ากับโปรไฟล์ผู้ป่วย (HN)
- **Cross-Department Debt Alert (ตรวจจับข้ามครั้ง):**
  - เมื่อคนไข้ HN ที่มียอดค้างชำระกลับมาเข้ารับบริการในครั้งถัดไป:
    - **หน้าจอเวชระเบียน (Registrar):** ระบบจะแสดงแถบแจ้งเตือนสีแดงเด่นชัด *"ผู้ป่วยมียอดค้างชำระสะสม [จำนวนเงิน] บาท จากการรับบริการเมื่อวันที่ [วันที่]"*
    - **หน้าจอคัดกรอง (Triage):** แสดงป้ายเตือนสถานะหนี้ค้างชำระ เพื่อให้พยาบาลหรือเจ้าหน้าที่แนะนำผู้ป่วยเคลียร์ค่าใช้จ่ายเดิมที่การเงินก่อนเข้าสู่กระบวนการรักษาต่อไป

## Consequences
- **Positive:** กระบวนการคลินิกเคสนิวเคลียร์และเคสด่วนไม่สะดุด, การเงินออกบิลใบเดียวไม่สับสน, ป้องกันหนี้สูญได้อย่างเป็นระบบ
- **Negative / Trade-offs:** ต้องมีฟิลด์ `outstanding_balance` และ Logic ตรวจสอบหนี้ค้างชำระตอนเปิด Visit ใหม่ทุกครั้ง
