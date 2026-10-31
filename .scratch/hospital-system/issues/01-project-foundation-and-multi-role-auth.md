# 01: Project Foundation, User Profiles & Multi-Role Active Switching

**What to build:** ติดตั้งและกำหนดค่าโปรเจกต์ Next.js 14+ (App Router, TypeScript, Tailwind CSS) เชื่อมต่อกับ Supabase Local Environment สร้างโครงสร้างตารางบัญชีผู้ใช้งาน `user_roles` และ `user_profiles` พร้อมติดตั้ง Supabase Custom Access Token Hook เพื่อฉีด Claims `roles` และ `active_role` เข้าสู่ JWT รองรับการทำงานของบุคลากร 10 บทบาท (`registrar`, `nurse`, `doctor`, `med_tech`, `nuclear_med`, `cashier`, `pharmacist`, `warehouse`, `admin`, `director`) พร้อมคอมโพเนนต์สลับบทบาท (Role Switcher) บน Navigation Header และหน้าล็อกอินสำหรับบัญชีทดสอบ

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] โปรเจกต์ Next.js และ Supabase Local ถูกกำหนดค่าและเชื่อมต่อได้สมบูรณ์
- [ ] ตาราง `user_roles` และ `user_profiles` ถูกสร้างพร้อมเก็บสิทธิ์ 10 บทบาท
- [ ] Supabase Custom Access Token Hook ทำงานถูกต้อง ฉีด Claims `roles` และ `active_role` ลงใน JWT Token
- [ ] หน้าจอ Login และ Navigation Header มี Role Switcher แสดงเฉพาะบทบาทที่บัญชีนั้นได้รับอนุญาต
- [ ] เมื่อผู้ใช้กดสลับ Active Role ระบบเรียก RPC `switch_active_role` และทำการ Refresh Session เพื่อรับ Token ใหม่สำเร็จโดยไม่ต้องล็อกอินใหม่
- [ ] มี Test Suite ตรวจสอบกลไกการสลับบทบาทและการปฏิเสธบทบาทที่ผู้ใช้ไม่ได้รับอนุญาต
