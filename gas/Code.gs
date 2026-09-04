/**
 * =========================================================================
 * Google Apps Script (GAS) สำหรับระบบติดตามเอกสาร (Document Tracking System)
 * Google Sheet ID: 16wNQfdZE6sNZBsiSuRDUkqUP3FpJJh18u7TaURqzmzk
 * ชื่อ Sheet ที่ใช้เก็บข้อมูล: DATA
 * รองรับ: งานตรวจจ่าย, งานสอบทาน, งานการเงิน, งานงบประมาณ
 * =========================================================================
 */

const SHEET_ID = '16wNQfdZE6sNZBsiSuRDUkqUP3FpJJh18u7TaURqzmzk';
const SHEET_NAME = 'DATA';

/**
 * ฟังก์ชันเปิดหน้าเว็บ (Web App Entry Point) หรือดึงข้อมูล JSON ผ่าน Fetch API (GET)
 */
function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || '';

    if (action === 'getDocuments') {
      const data = getAllDocuments();
      return jsonResponse({ status: 'success', data: data });
    }

    // รองรับการอัปเดตผ่าน GET fallback ด้วย
    if (action === 'updateDocument' && params.data) {
      const itemData = typeof params.data === 'string' ? JSON.parse(params.data) : params.data;
      const result = updateDocumentRecord(itemData);
      return jsonResponse({ status: 'success', message: 'อัปเดตเอกสารสำเร็จ', result: result });
    }

    // Default: แสดงหน้า HTML Web App (Bootstrap 5)
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('ระบบติดตามเอกสาร - 4 ฝ่าย')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * ฟังก์ชันรับคำขอ POST ผ่าน Fetch API สำหรับ บันทึก/แก้ไข/เพิ่มรอบเอกสาร
 */
function doPost(e) {
  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    const action = postData.action;
    let data = postData.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (parseErr) {}
    }

    if (action === 'updateDocument') {
      const result = updateDocumentRecord(data);
      return jsonResponse({ status: 'success', message: 'อัปเดตเอกสารสำเร็จ', result: result });
    }

    if (action === 'addRound') {
      const result = addNewRound(data);
      return jsonResponse({ status: 'success', message: 'เพิ่มรอบเอกสารสำเร็จ', result: result });
    }

    if (action === 'createDocument') {
      const result = createNewDocument(data);
      return jsonResponse({ status: 'success', message: 'สร้างเอกสารใหม่สำเร็จ', result: result });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * ดึงข้อมูลเอกสารทั้งหมดจาก Sheet "DATA"
 */
function getAllDocuments() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 2) return [];

  // ข้อมูลจริงเริ่มที่แถว 3 (index 2) ข้ามแถวที่ 1 (กลุ่มงาน) และแถวที่ 2 (ชื่อคอลัมน์)
  const rows = [];
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const docNo = String(row[7] || '').trim();
    if (!docNo && !row[2]) continue; // ข้ามแถวว่าง

    rows.push({
      rowId: i + 1,
      ep: String(row[0] || '').trim(),
      no: String(row[1] || '').trim(),
      receiveNo: String(row[2] || '').trim(),
      sender: String(row[3] || '').trim(),
      phone: String(row[4] || '').trim(),
      docRef: String(row[5] || '').trim(),
      agency: String(row[6] || '').trim(),
      docNo: docNo,
      docType: String(row[8] || '').trim(),
      dateReceive: formatValue(row[9]),
      dateDesk: formatValue(row[10]),
      dateReturn: formatValue(row[11]),
      returnStatus: String(row[12] || '').trim(),
      providerAuto: String(row[13] || '').trim(),
      providerChange: String(row[14] || '').trim(),
      providerFinal: String(row[15] || '').trim(),
      note: String(row[16] || '').trim(),
      subType: String(row[17] || '').trim(),
      qa: String(row[18] || '').trim(),
      actionDate: formatValue(row[19]),
      action: String(row[20] || '').trim(),
      status: String(row[21] || '').trim(),
      editGroup: String(row[22] || '').trim(),
      editDetail: String(row[23] || '').trim(),
      department: detectDepartment(row)
    });
  }

  return rows;
}

/**
 * อัปเดตข้อมูลเอกสารในแถวเดิม
 */
function updateDocumentRecord(item) {
  const sheet = getSheet();
  let rowId = parseInt(item.rowId, 10);
  const data = sheet.getDataRange().getValues();

  // ตรวจสอบความถูกต้องของ rowId โดยเทียบกับ docNo หรือ receiveNo ป้องกันการเขียนทับผิดแถว
  let targetRow = 0;
  if (rowId && rowId >= 3 && rowId <= data.length) {
    const r = data[rowId - 1];
    const matchDocNo = item.docNo && String(r[7]).trim() === String(item.docNo).trim();
    const matchRecvNo = item.receiveNo && String(r[2]).trim() === String(item.receiveNo).trim();
    if (matchDocNo || matchRecvNo) {
      targetRow = rowId;
    }
  }

  // หากยังไม่พบแถวที่ตรง ให้ค้นหาจาก docNo หรือ receiveNo ในชีท DATA ตั้งแต่แถวที่ 3 (ข้าม 2 แถวแรกที่เป็น Header)
  if (!targetRow) {
    for (let i = 2; i < data.length; i++) {
      const r = data[i];
      if (item.docNo && String(r[7]).trim() === String(item.docNo).trim()) {
        targetRow = i + 1;
        break;
      } else if (item.receiveNo && String(r[2]).trim() === String(item.receiveNo).trim()) {
        targetRow = i + 1;
        break;
      }
    }
  }

  // Fallback ถ้ายังไม่พบ แต่ rowId >= 3
  if (!targetRow && rowId >= 3) {
    targetRow = rowId;
  }

  if (!targetRow || targetRow < 3) {
    throw new Error('ไม่พบแถวในชีท DATA สำหรับเอกสาร ' + (item.docNo || item.receiveNo || ''));
  }
  rowId = targetRow;

  // คอลัมน์ A ถึง Q (คอลัมน์ 1 ถึง 17)
  if (item.ep !== undefined) sheet.getRange(rowId, 1).setValue(item.ep);
  if (item.no !== undefined) sheet.getRange(rowId, 2).setValue(item.no);
  if (item.receiveNo !== undefined) sheet.getRange(rowId, 3).setValue(item.receiveNo);
  if (item.sender !== undefined) sheet.getRange(rowId, 4).setValue(item.sender);
  if (item.phone !== undefined) sheet.getRange(rowId, 5).setValue(item.phone);
  if (item.docRef !== undefined) sheet.getRange(rowId, 6).setValue(item.docRef);
  if (item.agency !== undefined) sheet.getRange(rowId, 7).setValue(item.agency);
  if (item.docNo !== undefined) sheet.getRange(rowId, 8).setValue(item.docNo);
  if (item.docType !== undefined) sheet.getRange(rowId, 9).setValue(item.docType);
  if (item.dateReceive !== undefined) sheet.getRange(rowId, 10).setValue(item.dateReceive);
  if (item.dateDesk !== undefined) sheet.getRange(rowId, 11).setValue(item.dateDesk);
  if (item.dateReturn !== undefined) sheet.getRange(rowId, 12).setValue(item.dateReturn);
  if (item.returnStatus !== undefined) sheet.getRange(rowId, 13).setValue(item.returnStatus);
  if (item.providerAuto !== undefined) sheet.getRange(rowId, 14).setValue(item.providerAuto);
  if (item.providerChange !== undefined) sheet.getRange(rowId, 15).setValue(item.providerChange);
  if (item.providerFinal !== undefined) sheet.getRange(rowId, 16).setValue(item.providerFinal);
  if (item.note !== undefined) sheet.getRange(rowId, 17).setValue(item.note);

  // งานตรวจจ่าย (คอลัมน์ R ถึง X: คอลัมน์ที่ 18 ถึง 24 ในชีท DATA)
  if (item.subType !== undefined) sheet.getRange(rowId, 18).setValue(item.subType);       // R: ประเภทเอกสารย่อย
  if (item.qa !== undefined) sheet.getRange(rowId, 19).setValue(item.qa);                 // S: QA.
  if (item.actionDate !== undefined) sheet.getRange(rowId, 20).setValue(item.actionDate); // T: วันที่ดำเนินการ
  if (item.action !== undefined) sheet.getRange(rowId, 21).setValue(item.action);         // U: การดำเนินการ
  if (item.status !== undefined) sheet.getRange(rowId, 22).setValue(item.status);         // V: สถานะ
  if (item.editGroup !== undefined) sheet.getRange(rowId, 23).setValue(item.editGroup);   // W: Group-กรณีแก้ไข
  if (item.editDetail !== undefined) sheet.getRange(rowId, 24).setValue(item.editDetail); // X: รายละเอียดกรณีแก้ไข

  return { rowId: rowId, docNo: item.docNo };
}

/**
 * เพิ่มรอบการเข้า-ออกใหม่ (กรณีเอกสารเลขเดียวกันเข้า-ออกหลายรอบ)
 * จะบันทึกเป็นแถวใหม่ใน Sheet โดยยังคงเลขที่เอกสารเดิม
 */
function addNewRound(item) {
  const sheet = getSheet();
  const newRow = [
    item.ep || '',
    item.no || 'N',
    item.receiveNo || '',
    item.sender || '',
    item.phone || '',
    item.docRef || '',
    item.agency || '',
    item.docNo || '',
    item.docType || '',
    item.dateReceive || Utilities.formatDate(new Date(), 'Asia/Bangkok', 'd/M/yyyy HH:mm:ss'),
    item.dateDesk || Utilities.formatDate(new Date(), 'Asia/Bangkok', 'd/M/yyyy HH:mm:ss'),
    item.dateReturn || '',
    item.returnStatus || 'กำลังดำเนินการ',
    item.providerAuto || '',
    item.providerChange || '',
    item.providerFinal || '',
    item.note || '',
    item.subType || '',
    item.qa || '',
    item.actionDate || Utilities.formatDate(new Date(), 'Asia/Bangkok', 'd/M/yyyy HH:mm:ss'),
    item.action || 'เพิ่มรอบการเข้า-ออก',
    item.status || 'รอดำเนินการ',
    item.editGroup || '',
    item.editDetail || ''
  ];

  sheet.appendRow(newRow);
  const lastRow = sheet.getLastRow();
  return { rowId: lastRow, docNo: item.docNo };
}

/**
 * สร้างเอกสารใหม่
 */
function createNewDocument(item) {
  return addNewRound(item);
}

/**
 * แยกฝ่ายผู้ให้บริการอัตโนมัติตามข้อมูล
 */
function detectDepartment(row) {
  const pFinal = String(row[15] || '');
  const pAuto = String(row[13] || '');
  const docType = String(row[8] || '');
  const subType = String(row[17] || '');
  const combined = (pFinal + ' ' + pAuto + ' ' + docType + ' ' + subType).toLowerCase();

  if (combined.indexOf('s2') !== -1 || combined.indexOf('สอบทาน') !== -1) {
    return 'งานสอบทาน';
  }
  if (combined.indexOf('จ่ายเงิน') !== -1 || combined.indexOf('การเงิน') !== -1 || combined.indexOf('เงินเดือน') !== -1 || combined.indexOf('ทุนการศึกษา') !== -1) {
    return 'งานการเงิน';
  }
  if (combined.indexOf('งบประมาณ') !== -1) {
    return 'งานงบประมาณ';
  }
  return 'งานตรวจจ่าย';
}

/**
 * Helper: ดึง Sheet DATA
 */
function getSheet() {
  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}
  if (!ss) {
    try {
      ss = SpreadsheetApp.openById(SHEET_ID);
    } catch (e) {}
  }
  if (!ss) throw new Error('ไม่สามารถเปิดชีทได้');
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('ไม่พบ Sheet ชื่อ ' + SHEET_NAME);
  return sheet;
}

/**
 * Helper: Format วันที่หรือข้อความ
 */
function formatValue(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Bangkok', 'd/M/yyyy HH:mm:ss');
  }
  return String(val).trim();
}

/**
 * Helper: ส่งคำตอบกลับเป็น JSON พร้อม CORS
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
