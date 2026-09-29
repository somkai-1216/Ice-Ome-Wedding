/**
 * Ice & Ome Wedding RSVP API
 * Google Sheet:
 * https://docs.google.com/spreadsheets/d/1hcMnYVWkfs5f8dbpJm7-D3hqCvnwbe3Kkmd962cPUm8/edit
 */

const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1hcMnYVWkfs5f8dbpJm7-D3hqCvnwbe3Kkmd962cPUm8',
  SHEET_NAME: 'ชีต1',
  TIMEZONE: 'Asia/Bangkok',
  MAX_GUESTS: 20
});

const HEADERS = [
  'วันเวลา',
  'ชื่อ',
  'ฝ่าย',
  'การเข้าร่วมงาน',
  'จำนวนผู้เข้าร่วม (รวมตัวเอง)',
  'Submission ID'
];

/**
 * เปิด URL ของ Web App ใน browser เพื่อเช็กว่า API ทำงานอยู่
 */
function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'Ice & Ome Wedding RSVP API',
    message: 'API is running'
  });
}

/**
 * รับข้อมูลจาก GitHub Pages / Netlify แล้วบันทึกลง Google Sheet
 */
function doPost(e) {
  try {
    const data = parseRequest_(e);

    // Honeypot: bot มักกรอกช่องนี้ แต่ผู้ใช้จริงมองไม่เห็น
    if (String(data.website || '').trim()) {
      return jsonResponse_({ ok: true });
    }

    const clean = validateAndNormalize_(data);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = getSheet_();
      ensureHeader_(sheet);

      // ป้องกันการกดซ้ำในช่วงสั้น ๆ
      const cache = CacheService.getScriptCache();
      const cacheKey = clean.submissionId ? `rsvp_${clean.submissionId}` : '';
      if (cacheKey && cache.get(cacheKey)) {
        return jsonResponse_({ ok: true, duplicate: true });
      }

      const timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm:ss');

      sheet.appendRow([
        timestamp,
        clean.name,
        clean.side,
        clean.attendance,
        clean.guests,
        clean.submissionId
      ]);

      if (cacheKey) cache.put(cacheKey, '1', 21600); // 6 ชั่วโมง

      return jsonResponse_({ ok: true });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : 'Unknown error'
    });
  }
}

/**
 * รันฟังก์ชันนี้ 1 ครั้งจาก Apps Script เพื่อเตรียมหัวตาราง
 * ฟังก์ชัน doPost ก็จะเรียกอัตโนมัติหากชีตยังว่างอยู่
 */
function setupSheet() {
  const sheet = getSheet_();
  ensureHeader_(sheet);

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#E9D4BD')
    .setFontColor('#4B392F')
    .setHorizontalAlignment('center');

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 200);
  sheet.setColumnWidth(6, 260);

  // Submission ID ใช้สำหรับระบบหลังบ้าน ไม่จำเป็นต้องแสดงตลอด
  sheet.hideColumns(6);
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
  return sheet;
}

function ensureHeader_(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  const isBlank = current.every(value => !String(value).trim());

  if (isBlank) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function parseRequest_(e) {
  if (!e) return {};

  const raw = e.postData && e.postData.contents ? e.postData.contents : '';
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      // หากไม่ได้ส่ง JSON ให้ลองอ่านจาก parameter ด้านล่าง
    }
  }

  return e.parameter || {};
}

function validateAndNormalize_(data) {
  const name = String(data.name || '').trim().replace(/\s+/g, ' ');
  const side = String(data.side || '').trim();
  const attendance = String(data.attendance || '').trim();
  const submissionId = String(data.submissionId || '').trim().slice(0, 100);

  if (name.length < 2 || name.length > 120) {
    throw new Error('ชื่อไม่ถูกต้อง');
  }

  if (!['ฝ่ายเจ้าสาว', 'ฝ่ายเจ้าบ่าว'].includes(side)) {
    throw new Error('ฝ่ายไม่ถูกต้อง');
  }

  if (!['สะดวก', 'ไม่สะดวก'].includes(attendance)) {
    throw new Error('สถานะการเข้าร่วมไม่ถูกต้อง');
  }

  let guests = Number(data.guests);

  if (attendance === 'ไม่สะดวก') {
    guests = 0;
  } else {
    if (!Number.isInteger(guests) || guests < 1 || guests > CONFIG.MAX_GUESTS) {
      throw new Error(`จำนวนผู้เข้าร่วมต้องอยู่ระหว่าง 1-${CONFIG.MAX_GUESTS} คน`);
    }
  }

  return { name, side, attendance, guests, submissionId };
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
