# 04: Nurse Triage, Vital Signs Recording & Drug Allergy Registration

**What to build:** สร้างตาราง `vital_signs` (คำนวณค่า BMI อัตโนมัติ), ตาราง `allergies` (เก็บประวัติแพ้ยา ระดับความรุนแรง และอาการแพ้), และตาราง `triage_notes`, หน้าจอคิวพยาบาลคัดกรอง (`nurse`) แสดงรายชื่อผู้ป่วยที่เปิด Visit แล้ว (`registered`) แบบเรียลไทม์, ฟอร์มสำหรับบันทึกสัญญาณชีพ อาการสำคัญ (Chief Complaint) และประวัติแพ้ยา, พร้อมปุ่มกดยืนยันการคัดกรองเสร็จสิ้นเพื่อเปลี่ยนสถานะ Visit จาก `registered` ➔ `triaged` (รอตรวจหน้าห้องตรวจแพทย์)

**Blocked by:** 03 (Patient Registration (HN/VN) with Simulated Health ID & Duplicate CID Prevention)

**Status:** ready-for-agent

- [ ] ตาราง `vital_signs`, `allergies`, และ `triage_notes` ถูกสร้างพร้อมคอลัมน์ OCC (`version`, `updated_at`)
- [ ] ฟอร์มสัญญาณชีพคำนวณและแสดงผลค่า BMI อัตโนมัติจากค่าน้ำหนักและส่วนสูง
- [ ] พยาบาลสามารถบันทึกประวัติการแพ้ยาพร้อมระบุระดับความรุนแรง (เช่น Mild, Moderate, Severe/Anaphylaxis)
- [ ] เมื่อพยาบาลกดยืนยันการคัดกรอง สถานะของ Visit เปลี่ยนเป็น `triaged` สำเร็จ
- [ ] หน้าจอคิวพยาบาลอัปเดตแบบเรียลไทม์ผ่าน Supabase Realtime เมื่อมีคนไข้ใหม่ลงทะเบียน
- [ ] มี Test Suite ทดสอบการบันทึกสัญญาณชีพ, การคำนวณ BMI, และการเปลี่ยนสถานะจาก `registered` ไปเป็น `triaged`
