# 08: Master Warehouse Inventory & Doctor Prescriptions with Allergy Guardrails

**What to build:** สร้างตาราง `medications` สำหรับ Master Inventory คลังยาโรงพยาบาลจุดเดียว (แสดงยอด `total_stock`, `reserved_stock`, และ `available_stock` พร้อม Database Check Constraint ป้องกันสต็อกติดลบ 100%), ตาราง `prescriptions` และ `prescription_items`, ฟอร์มสั่งยาของแพทย์ที่เชื่อมต่อระบบตรวจสอบการแพ้ยา (**Drug Allergy Alert Modal** แจ้งเตือนสีแดงทันที และบังคับกรอกเหตุผลทางคลินิกหากแพ้รุนแรง), กลไกตัดสต็อกยาจังหวะที่ 1 (**Reserve on Order**) ทันทีที่แพทย์สั่งยา, และ Background Function สำหรับปลดล็อกยาที่ถูกจองอัตโนมัติหากค้างชำระเกิน 24 ชั่วโมง

**Blocked by:** 05 (Doctor Queue, Consultation Encounter & ICD-10 Diagnoses)

**Status:** ready-for-agent

- [ ] ตาราง `medications` มี Check Constraints `total_stock >= 0` และ `total_stock >= reserved_stock` (ห้ามสต็อกติดลบเด็ดขาด)
- [ ] เมื่อแพทย์เลือกสั่งยาที่คนไข้มีประวัติแพ้ ระบบแสดง Modal แจ้งเตือนสีแดง และบังคับใส่เหตุผลทางคลินิกกรณีแพ้รุนแรง
- [ ] เมื่อบันทึกใบสั่งยา ยอด `reserved_stock` เพิ่มขึ้นตามจำนวนที่สั่ง และยอด `available_stock` ลดลงทันที
- [ ] หากยาในคลังไม่พอ (`available_stock < quantity`) ระบบบล็อกการสั่งยาอย่างเด็ดขาดและแจ้งเตือนแพทย์
- [ ] ระบบมีฟังก์ชันปลดล็อกสต็อกยาที่ถูกจอง (Release Reservation) อัตโนมัติหากใบสั่งยาค้างชำระเกิน 24 ชั่วโมง
- [ ] มี Test Suite ทดสอบการจองสต็อกยา, การตรวจจับแพ้ยา, การบล็อกเมื่อสต็อกหมด, และการปลดล็อกหลังหมดอายุ
