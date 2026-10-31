# 12: High-Density Seed Data (150–200 Patients), Simulator Drawer & Realtime Resilience

**What to build:** พัฒนาชุดสคริปต์ Seeding ข้อมูลอัตโนมัติ (`npm run seed` หรือ `supabase/seed.sql`) สร้างข้อมูลจำลองผู้ป่วยหนาแน่น 150–200 คน กระจายตัวครบทุกสถานะคิวจริง (ตั้งแต่ Triage จนถึง Completed) มีเคสพิเศษทั้งแพ้ยา เคสนิวเคลียร์ โรคเรื้อรัง ICD-10 และบัญชีผู้ใช้ทดสอบ 10 บทบาทพร้อมข้อมูลสิทธิ์, สร้างคอมโพเนนต์ **Floating Simulator Control Drawer** บนหน้าเว็บสำหรับกดจำลองเหตุการณ์ต่างๆ (จำลองเสียบบัตร Smart Card, จำลอง Callback เงินเข้าจากธนาคาร, จำลองเชื่อมต่อ Telemed), และพัฒนากลไก **SWR Polling Fallback** ให้กับ Hook คิวเรียลไทม์ (`useQueueSubscription`) โดยสลับไป Polling ผ่าน HTTP ทุก 15 วินาทีอัตโนมัติหาก WebSocket ขาดการเชื่อมต่อ

**Blocked by:** 11 (Director Dashboard, Security Metrics & Self-Auditing CSV Export)

**Status:** ready-for-agent

- [ ] รันคำสั่ง Seed สำเร็จและสร้างข้อมูลผู้ป่วย 150–200 คนกระจายครบทุกสถานะคิวทางกายภาพ
- [ ] มีบัญชีผู้ใช้งานทดสอบครบทั้ง 10 บทบาทพร้อมรหัสผ่านจำลองและสิทธิ์ที่ถูกต้อง สามารถล็อกอินและสลับบทบาทได้ทันที
- [ ] Floating Simulator Control Drawer ใช้งานได้บนหน้าจอ สามารถกดจำลองเหตุการณ์ Health ID, Payment Webhook ได้จริง
- [ ] เมื่อจำลองปิดสัญญาณ WebSocket หน้าจอคิวสลับไปใช้ SWR Polling ทุก 15 วินาทีอัตโนมัติโดยข้อมูลไม่หยุดนิ่ง
- [ ] เมื่อเปิดสัญญาณกลับมา ระบบสลับกลับสู่ WebSocket Realtime ทันที
- [ ] มี End-to-End Test Suite ตรวจสอบความถูกต้องของการ Seed Data และการจำลองเหตุการณ์ผ่าน Simulator Drawer
