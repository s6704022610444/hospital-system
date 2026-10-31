# 07: Nuclear Medicine: Radioactive Decay Calculator & Pregnancy Hard Stop

**What to build:** โมดูลเวชศาสตร์นิวเคลียร์สำหรับ `nuclear_med`: เครื่องคำนวณการสลายตัวของสารรังสี (Decay Calculator) บนหน้าจอ TypeScript คำนวณแบบ Dynamic ตามครึ่งชีวิตของไอโซโทป (I-131 และ Tc-99m) เพื่อช่วยในการสอบเทียบปริมาณยาก่อนฉีด, กลไกบันทึก Snapshot ปริมาณรังสีจริง (`calibrated_dose`, `administered_dose`, `calibration_time`, `administered_time`, `decay_factor`) ลงในคอลัมน์ `orders.details` เพื่อเป็นหลักฐานทางกฎหมาย, และระบบตรวจสอบความปลอดภัย (Safety Checklist) โดยมี **Pregnancy Test เป็น Hard Stop 100%** สำหรับสตรีวัยเจริญพันธุ์ที่บล็อกการเปลี่ยนสถานะเป็น `in_procedure` หากผลไม่เป็นลบ พร้อมฟังก์ชัน Doctor Override สำหรับเช็กลิสต์อื่น

**Blocked by:** 06 (Diagnostic Orders (Lab & X-ray) and Medical Technologist (`med_tech`) Loop-back)

**Status:** ready-for-agent

- [ ] เครื่องคำนวณ Decay บนหน้าจอ UI คำนวณค่ากัมมันตภาพรังสีตามเวลาจริงได้อย่างแม่นยำ
- [ ] เจ้าหน้าที่สามารถบันทึกและ Freeze ค่า Snapshot ทางกฎหมายของปริมาณรังสีที่ฉีดจริงลงใน `orders.details`
- [ ] Database Trigger ตรวจสอบผล UPT ของสตรีวัย 12-55 ปี และบล็อกคำสั่งเปลี่ยนสถานะเป็น `in_procedure` ทันทีหากไม่มีผล Negative
- [ ] มีกล่องข้อความเตือนสำหรับ Safety Checklist อื่นๆ และยอมให้แพทย์กด Override โดยบังคับกรอก Clinical Justification
- [ ] คำสั่งตรวจเวชศาสตร์นิวเคลียร์ได้รับการตั้งค่าเริ่มต้นเป็น `post_paid` โดยอัตโนมัติตามนโยบายความเร่งด่วน
- [ ] มี Test Suite ทดสอบการบล็อก Hard Stop กรณีตั้งครรภ์, การบันทึก Snapshot ปริมาณรังสี, และการ Override ที่บันทึกลง Audit Log
