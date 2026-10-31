# 03: Patient Registration (HN/VN) with Simulated Health ID & Duplicate CID Prevention

**What to build:** สร้างตาราง `patients` (พร้อม Unique National ID 13 หลัก) และตาราง `visits` (Macro State เริ่มต้นเป็น `registered`), พัฒนา Route Handler จำลอง `/api/mock/health-id/scan` สำหรับอ่านบัตร Smart Card, หน้าจอลงทะเบียนเวชระเบียน (`registrar`) พร้อมปุ่มกด "Simulate Card Read" ที่ดึงข้อมูลจำลองมากรอกฟอร์มอัตโนมัติ, ระบบป้องกันการสร้าง HN ซ้ำด้วยการตรวจสอบ National ID (หากพบประวัติเดิมจะเปิด Visit ใหม่ทันทีโดยไม่สร้าง HN ซ้ำ), และหน้าจอแสดงคิวผู้ป่วยที่รอการลงทะเบียน

**Blocked by:** 02 (Immutable Audit Trail & Strict RPC Barrier for Single Patient View)

**Status:** ready-for-agent

- [ ] ตาราง `patients` มีคอลัมน์ `national_id` กำหนดเป็น UNIQUE NULLS NOT DISTINCT
- [ ] ตาราง `visits` ถูกสร้างพร้อมคอลัมน์ `status` (Macro State) และคอลัมน์ OCC (`version`, `updated_at`)
- [ ] Route Handler `/api/mock/health-id/scan` ส่งคืนข้อมูลบัตรประชาชนจำลองพร้อม Badge แสดง "SIMULATED"
- [ ] หน้าจอเวชระเบียนมีปุ่มอ่านบัตรจำลองที่กรอกฟอร์มอัตโนมัติและสร้าง HN ถาวร
- [ ] หากกรอกเลขบัตรประชาชนที่มีอยู่ในระบบ ระบบไม่อนุญาตให้สร้าง HN ใหม่ แต่จะเปิด Visit ใหม่ให้ HN เดิมทันที
- [ ] มี Test Suite ครอบคลุมการเปิด Visit ใหม่, การป้องกันเลขประจำตัวซ้ำ, และการจำลองอ่านบัตร Health ID
