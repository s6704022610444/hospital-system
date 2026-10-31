# 09: Consolidated Invoicing, Simulated QR Payment & Pharmacy Dispensing

**What to build:** สร้างตาราง `invoices`, `receipts`, และ `payments`, พัฒนาฟังก์ชันรวมบิลรอบสุดท้าย (**Consolidated Single Invoice**) ที่รวบรวมค่าใช้จ่ายของคำสั่งตรวจ Post-paid ค่ายาจาก `prescriptions` และค่าบริการทางการแพทย์ไว้ในใบแจ้งหนี้เดียว, หน้าจอการเงิน (`cashier`) พร้อม Route Handler `/api/mock/payment/generate-qr` ออก Mock PromptPay QR, Route Handler รับชำระเงิน `/api/mock/payment/webhook` ซึ่งจะทริกเกอร์ตัดสต็อกยาจริง (**Deduct on Paid**) และดันคนไข้เข้าสู่คิวรับยา (`dispensing`), และหน้าจอห้องยาสำหรับเภสัชกร (`pharmacist`) เพื่อตรวจสอบและกดยืนยันจ่ายยา (`completed`)

**Blocked by:** 07 (Nuclear Medicine: Radioactive Decay Calculator & Pregnancy Hard Stop), 08 (Master Warehouse Inventory & Doctor Prescriptions with Allergy Guardrails)

**Status:** ready-for-agent

- [ ] ฟังก์ชันรวมบิลออกใบแจ้งหนี้ Consolidated Single Invoice ดึงยอด Post-paid Orders + ค่ายา + ค่าบริการ ถูกต้องครบถ้วน
- [ ] Route Handler `/api/mock/payment/generate-qr` ออก QR Code จำลองพร้อมติดป้าย "SIMULATED"
- [ ] เมื่อ Webhook จำลองการจ่ายเงินสำเร็จทำงาน ระบบเปลี่ยนสถานะใบเสร็จเป็น `paid` และตัดยอดสต็อกยาจริง (`total_stock` และ `reserved_stock` ลดลง)
- [ ] สถานะของ Visit เปลี่ยนเป็น `dispensing` อัตโนมัติหลังชำระเงินสำเร็จ และคนไข้ปรากฏบนคิวห้องยา
- [ ] เภสัชกรสามารถตรวจสอบประวัติแพ้ยาและรายการยาในหน้าจอจ่ายยา ก่อนกดยืนยันจ่ายยาเพื่อเปลี่ยน Visit เป็น `completed`
- [ ] มี Test Suite ทดสอบการรวมบิล, การตัดสต็อกยาเมื่อชำระเงิน, และการไหลของสถานะจาก `pending_payment` ➔ `dispensing` ➔ `completed`
