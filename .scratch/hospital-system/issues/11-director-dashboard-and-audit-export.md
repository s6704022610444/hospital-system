# 11: Director Dashboard, Security Metrics & Self-Auditing CSV Export

**What to build:** พัฒนาหน้าจอแดชบอร์ดผู้อำนวยการโรงพยาบาล (`director`) แสดงสถิติและภาพรวมการดำเนินงานของ OPD (ปริมาณผู้ป่วยแยกตามแผนก, ระยะเวลารอคอยเฉลี่ย, และรายได้รวม), แดชบอร์ดความปลอดภัยและการตรวจสอบ (Security & Audit Metrics) แสดงความถี่ในการเข้าดูข้อมูลสุขภาพผู้ป่วย (PHI Access Velocity) และสถิติการสลับ Active Role, หน้าจอตรวจสอบและสืบค้น Audit Log สำหรับ `admin` และ `director`, และระบบส่งออกข้อมูล Audit Log เป็นไฟล์ CSV ผ่าน Route Handler `/api/audit/export` ที่มีระบบ **Recursive Self-Auditing** บันทึกเหตุการณ์ `log_export_generated` ทุกครั้งที่กดดาวน์โหลด

**Blocked by:** 02 (Immutable Audit Trail & Strict RPC Barrier for Single Patient View), 10 (Walkout Debt Policy, Void/Refund & Cross-Visit Outstanding Balance Alert)

**Status:** ready-for-agent

- [ ] แดชบอร์ดผู้อำนวยการแสดงสถิติจำนวนผู้ป่วยตามแผนก ปริมาณการให้บริการ และระยะเวลารอคอยเฉลี่ย
- [ ] แดชบอร์ดแสดงกราฟและสถิติการเข้าดูข้อมูลสุขภาพ (PHI Access Velocity) และพฤติกรรมการสลับบทบาท
- [ ] หน้าจอ Audit Log Viewer ช่วยให้ Admin และ Director สามารถค้นหา กรอง และเรียกดูประวัติทั้ง Read และ Write ได้
- [ ] ปุ่ม Export CSV ดาวน์โหลดข้อมูล Audit Log ได้ตามช่วงวันที่กำหนด
- [ ] ทุกครั้งที่มีการสั่ง Export CSV ระบบบันทึก Log ใหม่ใน `audit_logs` ระบุผู้สั่ง วันเวลา และ Filter (Self-Auditing)
- [ ] มี Test Suite ทดสอบการคำนวณ Metrics บนแดชบอร์ด และการบันทึก Self-Auditing เมื่อมีการดาวน์โหลด CSV
