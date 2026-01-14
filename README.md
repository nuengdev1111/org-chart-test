# Org Chart Test (Angular)


## ฟีเจอร์หลัก
- สร้าง Position (ชื่อ + แผนก/Section)
- ลากวาง Position ลงใน Level ต่าง ๆ
- เพิ่ม Level ได้ไม่จำกัด
- กติกา: วางลง Level > 1 ได้ก็ต่อเมื่อ Level ก่อนหน้ามีอย่างน้อย 1 node
- เมื่อวางใน Level > 1 ต้องเลือก Parent จาก Level ก่อนหน้า
- ลบ node ได้ 2 แบบ
  - Cascade: ลบลูกทั้งหมดด้วย
  - Reattach: ย้ายลูกไปผูกกับ parent ของ node ที่ถูกลบ
- Hover เพื่อไฮไลต์ความสัมพันธ์ (ancestor / descendant)
- วาดเส้นความสัมพันธ์ Parent → Child พร้อมลูกศรและสีตามความสัมพันธ์

## Requirements
- Node.js (แนะนำ v16+)
- Angular CLI (ถ้ายังไม่มี: `npm i -g @angular/cli`)

## Installation
npm install

Run (Development)
ng serve -o
