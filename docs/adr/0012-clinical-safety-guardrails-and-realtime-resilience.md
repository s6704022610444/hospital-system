# ADR 0012: Clinical Safety Guardrails and Realtime Network Resilience

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (Clinical Safety, Patient Identity & System Availability)

## Context & Problem Statement
ในการปฏิบัติงานจริงของโรงพยาบาล มักพบปัญหาสำคัญ 4 ด้านที่ส่งผลกระทบต่อความปลอดภัยของผู้ป่วยและความต่อเนื่องในการให้บริการ ได้แก่:
1. ความผิดพลาดจากการสั่งยาที่ผู้ป่วยมีประวัติแพ้ (Drug Allergy Adverse Event)
2. การสร้างเวชระเบียนซ้ำซ้อน (Duplicate HN) ทำให้ประวัติการรักษาแยกเป็นหลายชิ้น
3. ยาในสต็อกถูกจองค้างข้ามคืน (Phantom Stock Lockup) จากผู้ป่วยที่ทิ้งใบสั่งยาและไม่ไปชำระเงิน
4. สัญญาณอินเทอร์เน็ต/Wi-Fi ในโรงพยาบาลหลุดชั่วคราว ทำให้หน้าจอคิว Realtime ค้างและไม่อัปเดตสถานะ

## Decision Drivers
1. **Patient Safety:** ป้องกันการจ่ายยาที่คนไข้แพ้และการระบุตัวตนผิดพลาดอย่างเด็ดขาด
2. **Inventory Liquidity:** ไม่ให้สต็อกยาถูกล็อกค้างอย่างไร้จุดหมายเกิน 24 ชั่วโมง
3. **High Availability & Fault Tolerance:** หน้าจอคิวต้องทำงานได้อย่างต่อเนื่องแม้ WebSocket ขาดการเชื่อมต่อ

## Decision Outcome
เลือกสถาปัตยกรรม **Clinical Safety Guardrails 4 เสาหลัก** ผนวกเข้าสู่ V1 Scope:

### 1. Drug Allergy Alert Engine with Doctor Override
- เมื่อแพทย์เลือกรายการยาใน `prescriptions`:
  - Frontend และ Backend จะทำการเทียบรหัสตัวยา หรือกลุ่มยา (Drug Class) กับตาราง `allergies` ของผู้ป่วยรายนั้น
  - **หากตรวจพบประวัติแพ้:**
    - แสดง Pop-up เตือนสีแดงเด่นชัด ระบุชื่อยา, ระดับความรุนแรง (Severity), และอาการที่เคยแพ้
    - **กรณีแพ้ระดับรุนแรง (Anaphylaxis / Angioedema / Stevens-Johnson):** ระบบบังคับให้แพทย์ต้องพิมพ์ *"Clinical Justification"* เพื่อทำการ Override ก่อนระบบจึงจะอนุญาตให้ส่งคำสั่งจองสต็อกยาได้
    - บันทึกการ Override ลงใน Audit Log ทันที

### 2. Patient Identity & Duplicate HN Prevention via National ID (CID)
- ตาราง `patients`:
  - คอลัมน์ `national_id` (เลขบัตรประชาชน 13 หลัก) กำหนดเป็น `UNIQUE NULLS NOT DISTINCT`
- **Registration Workflow:**
  - เมื่อเวชระเบียนพิมพ์เลข 13 หลัก หรือกดจำลอง Smart Card (Health ID Mock):
    - ระบบจะค้นหาว่ามี `national_id` นี้ในฐานข้อมูลหรือไม่
    - หากพบ: ระบบจะดึงข้อมูลเดิมขึ้นมาเปิด Visit (VN) ใหม่ทันที **ไม่อนุญาตให้สร้าง HN ใหม่ซ้ำ**

### 3. Automated Stock Reservation Release (24-Hour Expiry)
- เพื่อป้องกันปัญหา Phantom Stock Lockup:
  - กำหนดอายุการจองสต็อกยาไว้ที่ **24 ชั่วโมง** นับจากเวลาที่แพทย์ออกใบสั่งยา (`prescriptions.created_at`)
  - ใช้ PostgreSQL Background Function / Cron Job (หรือ Scheduled Stored Procedure):
    - ตรวจจับใบสั่งยาที่ค้างอยู่ในสถานะ `pending` และยังไม่ชำระเงินเกิน 24 ชั่วโมง
    - ปรับสถานะใบสั่งยาเป็น `expired`
    - คืนจำนวนยาจาก `reserved_stock` กลับสู่ `available_stock` ของตาราง `medications` โดยอัตโนมัติ

### 4. Realtime Queue Resilience with SWR Polling Fallback
- สถาปัตยกรรมหน้าจอคิวทุกแผนก (`useQueueSubscription`):
  - **Primary Channel:** เชื่อมต่อ Supabase Realtime ผ่าน WebSocket เพื่อรับ Event ทันทีที่ `visits.status` หรือ `orders.status` เปลี่ยน
  - **Heartbeat & Disconnect Detector:** มีกลไกดักฟังสถานะ Connection ของ WebSocket
  - **SWR Fallback:** หาก WebSocket หลุด หรืออยู่ในสถานะ Reconnecting เกิน 5 วินาที:
    - ระบบจะสลับไปใช้ **HTTP Polling via SWR** ทุกๆ 15 วินาทีอัตโนมัติ
    - เมื่อ WebSocket เชื่อมต่อกลับมาสำเร็จ จะหยุด Polling และกลับสู่โหมด Realtime ทันที
  - ช่วยให้หน้าจอคิวของพยาบาล, แพทย์, ห้องแล็บ, การเงิน ไม่ค้างแม้เครือข่ายมีปัญหาชั่วขณะ

## Consequences
- **Positive:** ความปลอดภัยของผู้ป่วยสูงสุด, ไม่เกิดเวชระเบียนซ้ำซ้อน, บริหารสต็อกยาได้อย่างมีประสิทธิภาพ, หน้าจอคิวเสถียรและทนทานต่อปัญหาเครือข่าย
- **Negative / Trade-offs:** เพิ่ม Logic ตรวจสอบ Allergy Matching และการจัดการ Connection State บน Frontend
