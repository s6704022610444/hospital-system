# ADR 0006: Simulated External Integrations Architecture and High-Density Seed Data Strategy

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (External Interfaces & Testing Infrastructure)

## Context & Problem Statement
ในระบบ V1 Scope มีการเชื่อมต่อกับระบบภายนอก 3 ระบบ ได้แก่:
1. การชำระเงินผ่าน QR Code (Bank Payment Gateway)
2. การยืนยันตัวตนคนไทย (Health ID / Smart Card Reader)
3. ระบบให้คำปรึกษาทางไกล (Telemedicine Video Consultation)

เนื่องจากระบบจริงต้องการการลงทะเบียนทางกฎหมายและเครือข่ายเฉพาะ จึงถูกจัดเป็น Out-of-Scope สำหรับ V1 และต้องทำเป็น Mock Services ที่ติดป้าย "simulated" ชัดเจน นอกจากนี้ การทดสอบระบบจำเป็นต้องมีชุดข้อมูลตั้งต้น (Seed Data) ที่สมจริง มีปริมาณหนาแน่นเพียงพอสำหรับการทดสอบ Performance, State Transition, และ Pagination ของตารางคิวและบันทึกเวชระเบียน

## Decision Drivers
1. **Zero External Dependency:** สามารถ Build, Test, และ Deploy รันบน Vercel ได้ทันทีโดยไม่ต้องพึ่งพา 3rd-party servers หรือ sandbox ภายนอก
2. **Interactive Event Simulation:** สามารถทดสอบ Webhook ขาเข้า (เช่น ยอดเงินชำระสำเร็จจากธนาคาร) และทดสอบการเสียบบัตร Smart Card ได้อย่างสมจริงผ่านหน้าจอ
3. **Realistic Queue Stress Testing:** มีข้อมูลผู้ป่วยในสถานะต่างๆ หนาแน่นเพียงพอให้ทดสอบ Realtime Queue และ Pagination ได้เหมือนโรงพยาบาลที่เปิดบริการจริง

## Decision Outcome
เลือกสถาปัตยกรรม **Next.js Internal Route Handlers (`/api/mock/*`) พร้อม Simulator Control Panel** และกำหนดกลยุทธ์ **High-Density Seed Data (150–200 รายการ)**:

### 1. Simulated External Integrations Architecture
- **Next.js Route Handlers (`/api/mock/*`):**
  - `/api/mock/health-id/scan`: จำลองการอ่านข้อมูลบัตรประชาชน/Health ID ส่งข้อมูลจำลอง (CID, ชื่อ-สกุล, ที่อยู่, วันเกิด, สิทธิการรักษา)
  - `/api/mock/payment/generate-qr`: ออก Mock PromptPay QR Code ที่ผูกกับ `invoice_id`
  - `/api/mock/payment/webhook`: รับ Payload แจ้งชำระเงินสำเร็จ (Callback จากธนาคาร) เพื่อทริกเกอร์ระบบการเงินและเปลี่ยนสถานะคิว
  - `/api/mock/telemed/session`: สร้าง Mock Video Conference Room URL พร้อม Badge แสดงคำว่า "SIMULATED TELEMEDICINE"
- **Interactive Simulator Control Panel UI:**
  - สร้าง Floating/Dev-Drawer บนหน้าเว็บ สำหรับบุคลากร/ผู้ทดสอบ:
    - ปุ่ม *"Simulate Health ID Dip-Chip"* (จำลองคนไข้เสียบบัตรที่เวชระเบียน)
    - ปุ่ม *"Simulate Bank Payment Success"* (ส่ง Webhook จำลองว่าคนไข้สแกนจ่ายเงินสำเร็จทันที)
    - ปุ่ม *"Simulate Telemed Connect/Disconnect"*

### 2. High-Density Seed Data Strategy (150–200 Patients)
จัดทำ Script สำหรับ Seed ข้อมูลอัตโนมัติ (`npm run seed` หรือ `supabase/seed.sql`):
- **จำนวนผู้ป่วย:** 150–200 รายการผู้ป่วยที่ไม่ซ้ำกัน พร้อมเลข HN ที่เป็นมาตรฐาน
- **การกระจายตัวของคิวประจำวัน (Realistic Queue Density):**
  - `registered`: ~15 คน (รอพยาบาลเรียกคัดกรอง)
  - `triaged`: ~20 คน (วัดสัญญาณชีพแล้ว รอพบแพทย์รอบแรก)
  - `in_doctor`: ~10 คน (กำลังตรวจในห้องตรวจต่างๆ)
  - `pending_payment` (Pre-paid): ~15 คน (รอจ่ายค่าแล็บ/ค่าเอกซเรย์ที่การเงิน)
  - `pending_orders`: ~25 คน (กระจายตามห้องเจาะเลือด, ห้อง X-ray, ห้องเวชศาสตร์นิวเคลียร์)
  - `doctor_review`: ~15 คน (ผลตรวจออกครบแล้ว วนกลับมารอพบแพทย์เพื่อฟังผล)
  - `pending_payment` (Final): ~20 คน (รอชำระค่ายาและค่าบริการทางการแพทย์)
  - `dispensing`: ~25 คน (รอรับยาที่ห้องจ่ายยา)
  - `completed`: ~40+ คน (ตรวจรักษาและรับยากลับบ้านเรียบร้อย สำหรับทดสอบรายงานและแดชบอร์ด)
- **Special Clinical Cases ใน Seed Data:**
  - คนไข้ที่มีประวัติแพ้ยารุนแรง (เช่น Penicillin Anaphylaxis) เพื่อทดสอบระบบ Alert ในหน้าจอสั่งยา
  - คนไข้โรคเรื้อรัง (NCDs) ที่มีรหัส ICD-10 กำกับ (เช่น เบาหวาน E11, ความดันโลหิตสูง I10)
  - คนไข้เวชศาสตร์นิวเคลียร์: เคสเตรียมกลืนแร่ I-131 (พร้อมค่า Calibrated Dose) และเคส Scan Tc-99m
- **Seed Users (9 บทบาทครบถ้วน):**
  - สร้าง User Account ทดสอบ 9 บทบาท พร้อม Mock Password และผูกสิทธิ์ใน `user_roles`
  - มีบัญชีทดสอบที่ได้รับมอบหมายหลายบทบาท (เช่น `doctor` + `director`, `nurse` + `registrar`) เพื่อทดสอบฟีเจอร์ Switch Active Role

## Consequences
- **Positive:** สามารถ Demo ระบบได้เสมือนจริง 100%, ทดสอบ Pagination และความเร็วของ Realtime Queue ได้อย่างมีประสิทธิภาพ, ผู้พัฒนาและผู้ทดสอบไม่ต้องกรอกข้อมูลเองตั้งแต่เริ่มต้น
- **Negative / Trade-offs:** Script Seed Data มีขนาดใหญ่และต้องดูแลความสัมพันธ์ของ Foreign Keys ให้ถูกต้องสมบูรณ์
