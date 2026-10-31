# ADR 0001: Dual State Machine & Hybrid State Transition Architecture

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (OPD)

## Context & Problem Statement
ระบบ OPD มีความซับซ้อนของการไหลเวียนผู้ป่วย (Patient Flow) ซึ่งไม่สามารถใช้ State Machine ระดับเดียว (Single Flat State) ได้ เพราะผู้ป่วย 1 Visit อาจมีหลาย Orders (Lab, X-ray, Nuclear Med) ดำเนินการพร้อมกันแบบ Asynchronous นอกจากนี้ยังมีเรื่องการชำระเงินแบบ Pre-paid (จ่ายก่อนตรวจ) และการวนกลับมาพบแพทย์เพื่อฟังผล (Doctor Loop-back)

## Decision Drivers
1. คิวหน้าห้องตรวจแพทย์ต้องแยกแยะระหว่างคนไข้ใหม่ที่ยังไม่ตรวจ กับคนไข้ที่รอฟังผลการตรวจได้อย่างเด็ดขาด
2. คิวหน้าจอแต่ละแผนกต้องสะท้อนตำแหน่งทางกายภาพที่คนไข้อยู่จริงในโรงพยาบาล (Physical Location Queue)
3. ป้องกันปัญหาความผิดพลาดจากมนุษย์ (Human Error เช่น ลืมกดส่งคิว) โดยไม่ตัดทอนการตัดสินใจทางคลินิกของบุคลากรทางการแพทย์

## Considered Options
- **Option A (Pure Manual):** ผู้ใช้แต่ละจุดกดเลื่อนสถานะ Visit เองทั้งหมด
- **Option B (Pure Trigger-Driven):** ระบบคำนวณและเลื่อนสถานะ Visit จาก Aggregate สถานะลูกอัตโนมัติ 100%
- **Option C (Hybrid Architecture):** ฝั่งคลินิกควบคุมด้วยมนุษย์ (Manual Actions) ส่วนฝั่งสั่งตรวจและชำระเงินควบคุมด้วย Database Triggers (Automated Transitions)

## Decision Outcome
เลือก **Option C (Hybrid Architecture)** โดยมีรายละเอียดดังนี้:

### 1. Macro States (`visits.status`)
สะท้อน Physical Location ของผู้ป่วยตามลำดับ:
- `registered` (เวชระเบียนลงทะเบียน/เปิดสิทธิ์)
- `triaged` (คัดกรอง/วัด Vital Signs เสร็จ รอเข้าห้องตรวจ)
- `in_doctor` (กำลังพบแพทย์รอบแรก)
- `pending_payment` (รอชำระเงินที่การเงิน - กรณี Pre-paid orders หรือค่าตรวจรักษา/ค่ายา)
- `pending_orders` (รอหรือกำลังตรวจตามแผนกต่างๆ เช่น ห้องเจาะเลือด, X-ray, นิวเคลียร์)
- `doctor_review` (ผลการตรวจครบทุก Order แล้ว วนกลับมาต่อคิวพบแพทย์เพื่อฟังผล/สั่งยา)
- `dispensing` (รอรับยาที่ห้องยาหลังชำระเงินเรียบร้อย)
- `completed` (สิ้นสุดกระบวนการ OPD ประจำวัน)
- `cancelled` (ยกเลิกการตรวจ)

### 2. Micro States (`orders.status`)
สถานะคำสั่งตรวจแต่ละใบ (จัดการอิสระต่อกัน):
- `ordered` ➔ `scheduled` ➔ `in_prep` ➔ `in_procedure` ➔ `result_pending` ➔ `completed` / `cancelled`

### 3. Transition Drivers
- **Clinical Points (Manual Action via App):**
  - พยาบาลคัดกรองเสร็จ ➔ กดส่งต่อเข้าคิวหมอ (`registered` ➔ `triaged`)
  - แพทย์เรียกตรวจ ➔ กดรับคนไข้ (`triaged` / `doctor_review` ➔ `in_doctor`)
  - แพทย์สรุปผลตรวจครั้งสุดท้าย ➔ กดส่งต่อไปชำระเงินหรือรับยา
- **Diagnostic & Payment Orchestration (Automated via DB Triggers):**
  - หากแพทย์สั่ง Orders ที่มี `payment_type = 'pre_paid'` ➔ ระบบตั้งค่า Visit เป็น `pending_payment`
  - เมื่อการเงินยืนยันชำระเงิน (Payments `status = 'paid'`) สำหรับ Pre-paid Orders ➔ Trigger อัปเดต Visit ไปเป็น `pending_orders` ทันที
  - เมื่อ Orders ของ Visit นั้น **ทุกรายการ** มีสถานะเป็น `completed` (หรือ `cancelled`) ➔ Trigger อัปเดต Visit ไปเป็น `doctor_review` ทันทีโดยอัตโนมัติ
  - เมื่อการเงินยืนยันชำระเงินงวดสุดท้าย (Final Payment) ➔ Trigger อัปเดต Visit ไปเป็น `dispensing` ทันที

## Consequences
- **Positive:** หน้าจอคิวแยกหมวดหมู่ชัดเจน, ไม่มีคนไข้ตกค้างจากการลืมกดส่งของเจ้าหน้าที่ห้องแล็บ, Real-time update สะท้อนตรงกับความเป็นจริง
- **Negative / Trade-offs:** ต้องเขียน Database Function/Trigger เพื่อ Aggregate สถานะ Orders อย่างรัดกุม รองรับเคสยกเลิกออร์เดอร์ (Cancelled) หรือสั่งตรวจเพิ่มระหว่างรอฟังผล
