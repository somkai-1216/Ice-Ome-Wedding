# Ice & Ome — Wedding RSVP

เว็บ RSVP สำหรับงานแต่งงานแบบ Mobile-first

- Frontend: HTML / CSS / JavaScript
- Hosting: GitHub Pages หรือ Netlify
- Backend API: Google Apps Script Web App
- Database: Google Sheet `Ice&Ome Wedding`
- Spreadsheet ID ถูกใส่ไว้ใน `apps-script/Code.gs` แล้ว

## โครงสร้างไฟล์

```text
Ice-Ome-Wedding-RSVP/
├─ index.html
├─ style.css
├─ app.js
├─ assets/
│  ├─ background.webp
│  └─ favicon.svg
└─ apps-script/
   └─ Code.gs
```

## 1) ตั้งค่า Google Apps Script API

1. เปิด Google Sheet นี้:
   `https://docs.google.com/spreadsheets/d/1hcMnYVWkfs5f8dbpJm7-D3hqCvnwbe3Kkmd962cPUm8/edit`
2. ไปที่ **Extensions > Apps Script**
3. ลบโค้ดเดิมใน `Code.gs`
4. วางโค้ดจากไฟล์ `apps-script/Code.gs`
5. กด Save
6. เลือกฟังก์ชัน `setupSheet` แล้วกด **Run** 1 ครั้ง
7. ยืนยันสิทธิ์ Google ตามขั้นตอน

> `setupSheet()` จะสร้างหัวตารางและจัดรูปแบบให้ หากชีตยังว่างอยู่

## 2) Deploy Apps Script เป็น Web App

1. ใน Apps Script กด **Deploy > New deployment**
2. Select type = **Web app**
3. Execute as = **Me**
4. Who has access = **Anyone**
5. กด **Deploy**
6. Copy URL ที่ลงท้ายด้วย `/exec`

ตัวอย่าง:

```text
https://script.google.com/macros/s/XXXXXXXXXXXX/exec
```

## 3) ใส่ API URL ในเว็บ

เปิด `app.js` แล้วแก้บรรทัดบนสุด:

```js
const API_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

เป็น URL `/exec` ที่ได้จากข้อ 2 เช่น:

```js
const API_URL = "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";
```

## 4) Upload ขึ้น GitHub

สร้าง Repository ใหม่ แล้ว Upload ไฟล์เหล่านี้ขึ้น root ของ repo:

- `index.html`
- `style.css`
- `app.js`
- โฟลเดอร์ `assets`

โฟลเดอร์ `apps-script` จะเก็บใน repo ด้วยก็ได้ แต่ไม่จำเป็นสำหรับหน้าเว็บ

## 5) เปิด GitHub Pages

1. เข้า Repository > **Settings**
2. เลือก **Pages**
3. Source: **Deploy from a branch**
4. Branch: `main`
5. Folder: `/ (root)`
6. Save

GitHub จะสร้าง URL ประมาณ:

```text
https://USERNAME.github.io/REPOSITORY/
```

## ข้อมูลที่บันทึกใน Google Sheet

| Column | ข้อมูล |
|---|---|
| A | วันเวลา (เวลาไทย) |
| B | ชื่อ |
| C | ฝ่ายเจ้าสาว / ฝ่ายเจ้าบ่าว |
| D | สะดวก / ไม่สะดวก |
| E | จำนวนผู้เข้าร่วม รวมตัวเอง |
| F | Submission ID สำหรับป้องกันการกดซ้ำ |

Column F จะถูกซ่อนโดย `setupSheet()`

## หมายเหตุเรื่องเวลา

Google Sheet ปัจจุบันอาจใช้ timezone อื่น แต่ API นี้บันทึกเวลาเป็นข้อความโดยใช้ `Asia/Bangkok` โดยตรง จึงได้เวลาไทยถูกต้อง

## ทดสอบ

หลัง Deploy API แล้ว ให้เปิด URL `/exec` โดยตรง หากเห็น JSON ที่มี `"ok":true` แปลว่า API พร้อมทำงาน

จากนั้นเปิดเว็บ กรอก RSVP 1 รายการ และตรวจว่ามีข้อมูลเข้า `ชีต1`
