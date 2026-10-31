# 02: Immutable Audit Trail & Strict RPC Barrier for Single Patient View

**What to build:** สร้างโครงสร้างตารางบันทึกการเข้าดูข้อมูล `access_logs` (Read Audit) และตารางบันทึกการเปลี่ยนแปลง `audit_logs` (Write Audit) พร้อมตั้งค่า Database Rules/Triggers เพื่อทำให้เป็น Append-Only Table 100% (ห้ามแก้ไขและห้ามลบเด็ดขาด) ตั้งค่านโยบายความปลอดภัยปิดกั้นสิทธิ์ SELECT ตารางข้อมูลสุขภาพอ่อนไหว (PHI) โดยตรง และพัฒนาฟังก์ชัน PostgreSQL RPC `log_access(p_hn, p_vn, p_reason)` แบบ Security Definer ที่บังคับบันทึก Read Audit ก่อนคืนข้อมูลผู้ป่วย พร้อมคอมโพเนนต์หน้าจอแสดงผลข้อมูลผู้ป่วยส่วนหัว (Patient Banner Widget)

**Blocked by:** 01 (Project Foundation, User Profiles & Multi-Role Active Switching)

**Status:** ready-for-agent

- [ ] ตาราง `audit_logs` และ `access_logs` ถูกสร้างพร้อมคอลัมน์บันทึก User, Role, Action, Timestamp โดยไม่มีคอลัมน์ version/updated_at
- [ ] ติดตั้ง Database Rules/Triggers บล็อกคำสั่ง UPDATE และ DELETE บนตาราง Audit Log ทุกกรณี
- [ ] สิทธิ์ SELECT บนตาราง PHI ถูก Revoke จากบทบาททั่วไปโดยตรง
- [ ] ฟังก์ชัน RPC `log_access` บันทึก Read Audit สำเร็จและส่งคืนข้อมูล Single Patient View ตามสิทธิ์
- [ ] Patient Banner Widget บน Frontend แสดงข้อมูลผู้ป่วยพื้นฐานจากการเรียกผ่าน `log_access`
- [ ] มี Test Suite ยืนยันว่าการ SELECT ตารางคนไข้ตรงๆ ล้มเหลว และการเรียกผ่าน `log_access` สร้างแถวใน `access_logs` เสมอ
