# ADR 0002: Strict RPC Barrier for PHI Read Audit and Realtime Segregation

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (OPD Security & Compliance)

## Context & Problem Statement
ระบบมีข้อกำหนดว่าทุกการเปิดดูประวัติคนไข้ (Single Patient View) ต้องบันทึก Read Audit Log ลง PostgreSQL เสมอ และต้องใช้ Database-level Security (RLS) อย่างไรก็ตาม ในระบบ PostgreSQL ทั่วไปคำสั่ง `SELECT` ไม่สามารถก่อให้เกิด side-effect เพื่อบันทึกแถวข้อมูลลง Audit Log ได้ หากเปิดสิทธิ์ `SELECT` ผ่าน RLS ให้ผู้ใช้โดยตรง จะเกิดช่องโหว่ให้ Client สามารถดึงข้อมูลผู้ป่วย (PHI - Protected Health Information) ข้ามการบันทึก Audit ได้

## Decision Drivers
1. **Unbypassable Read Audit:** ห้ามมีช่องทางใดที่ผู้ใช้สามารถเข้าถึงข้อมูลประวัติการรักษาโดยไม่มี Audit Record
2. **Realtime Queue Performance:** หน้าจอคิวและสถานะการบริการต้องรองรับ Supabase Realtime โดยไม่ติดขัดปัญหา RLS
3. **Data Segregation:** แยกชั้นความปลอดภัยระหว่างข้อมูลการจัดคิว (Queue Telemetry) กับข้อมูลสุขภาพส่วนบุคคล (Sensitive Clinical Data)

## Considered Options
- **Option A (Strict RPC Barrier):** ไม่อนุญาตให้ `SELECT` ตารางข้อมูลอ่อนไหวโดยตรง ต้องผ่านฟังก์ชัน RPC `log_access` (SECURITY DEFINER) เท่านั้น ส่วน Realtime ใช้กับตารางคิวสถานะ
- **Option B (Next.js API/Server Gateway Only):** ตัดการเชื่อมต่อ Supabase Client-side บนเบราว์เซอร์สำหรับตารางข้อมูล แล้วให้วิ่งผ่าน Next.js Server Side 100%
- **Option C (Dual Model):** ปล่อยให้ `SELECT` ได้ตาม RLS Policy แล้วให้ Frontend ช่วยเรียก `log_access` ควบคู่กัน

## Decision Outcome
เลือก **Option A (Strict RPC Barrier)** ร่วมกับการแยกตาราง Realtime (Data Segregation):

### 1. Table-Level Permission Segregation
- **Non-sensitive Queue Tables (`visits`, `orders_queue_view`):**
  - อนุญาตให้ `SELECT` ผ่าน RLS Policy ตาม Role ของผู้ใช้ได้
  - เปิดใช้งาน **Supabase Realtime CDC** เพื่อดักฟัง Event การเปลี่ยนสถานะคิว (`registered`, `triaged`, `in_doctor`, ฯลฯ) ขับเคลื่อน UI หน้าห้องตรวจ
  - ข้อมูลในตารางนี้มีเฉพาะ Metadata (HN, VN, สถานะ, แผนก, เวลา) ไม่มีข้อมูลบันทึกการรักษา ผลแล็บ หรือชื่อยาเชิงลึก
- **Sensitive PHI Tables (`patients`, `vital_signs`, `diagnoses`, `prescriptions`, `order_results`, `clinical_notes`):**
  - **REVOKE SELECT** สำหรับบทบาท `anon` และ `authenticated` โดยตรง
  - การเข้าถึง Single Patient View **ต้องเรียกผ่าน PostgreSQL RPC Function `log_access(p_hn text, p_vn text, p_reason text)`** เท่านั้น
  - ฟังก์ชัน `log_access` ทำงานเป็น `SECURITY DEFINER`:
    1. ตรวจสอบสิทธิ์ (Role & Permission) ของ `auth.uid()`
    2. ทำ `INSERT` บันทึก Read Audit Log (User ID, Role, HN, VN, Timestamp, Client IP/Context)
    3. ส่งคืน (Return) ข้อมูลผู้ป่วยแบบ Single Patient View (JSON หรือ Table format)

### 2. Write Audit Strategy
- ใช้ **PostgreSQL Database Triggers** ในทุกตารางสำคัญ ดักฟังเหตุการณ์ `AFTER INSERT OR UPDATE OR DELETE`
- บันทึก `old_data`, `new_data`, `changed_by`, `action`, `changed_at` ลงในตาราง `audit_logs` อัตโนมัติในระดับ Database Engine

## Consequences
- **Positive:** ความปลอดภัยสูงสุด ข้อมูลสุขภาพผู้ป่วยไม่รั่วไหล Audit Trail ครบถ้วน 100% ไม่สามารถหลบเลี่ยงได้แม้จะใช้ Supabase Client ยิง query นอกแอป
- **Negative / Trade-offs:** ไม่สามารถใช้ Supabase Realtime กับตารางประวัติการรักษาโดยตรง (แต่ไม่จำเป็นเพราะประวัติการรักษาไม่ใช่ข้อมูลที่เปลี่ยนแบบเสี้ยววินาทีเหมือนคิว) และต้องออกแบบ Data Contract ของฟังก์ชัน `log_access` ให้ครอบคลุม
