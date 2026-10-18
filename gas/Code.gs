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

    if (action === 'updateReview') {
      const result = updateReviewRecord(data);
      return jsonResponse({ status: 'success', message: 'บันทึกข้อมูลงานสอบทานสำเร็จ', result: result });
    }

    if (action === 'updateFinance') {
      const result = updateFinanceRecord(data);
      return jsonResponse({ status: 'success', message: 'บันทึกข้อมูลงานการเงินสำเร็จ', result: result });
    }

    if (action === 'updateBudget') {
      const result = updateBudgetRecord(data);
      return jsonResponse({ status: 'success', message: 'บันทึกข้อมูลงานงบประมาณสำเร็จ', result: result });
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
  const hasEmail = data[1] && (String(data[1][5] || '').indexOf('เมล') !== -1 || data[1].length >= 52);
  const off = hasEmail ? 1 : 0;

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const docNo = String(row[7 + off] || row[7] || '').trim();
    if (!docNo && !row[2]) continue; // ข้ามแถวว่าง

    rows.push({
      rowId: i + 1,
      ep: String(row[0] || '').trim(),
      no: String(row[1] || '').trim(),
      receiveNo: String(row[2] || '').trim(),
      sender: String(row[3] || '').trim(),
      phone: String(row[4] || '').trim(),
      email: off ? String(row[5] || '').trim() : '',
      docRef: String(row[5 + off] || '').trim(),
      agency: String(row[6 + off] || '').trim(),
      docNo: docNo,
      docType: String(row[8 + off] || '').trim(),
      dateReceive: formatValue(row[9 + off]),
      dateDesk: formatValue(row[10 + off]),
      dateReturn: formatValue(row[11 + off]),
      returnStatus: String(row[12 + off] || '').trim(),
      providerAuto: String(row[13 + off] || '').trim(),
      providerChange: String(row[14 + off] || '').trim(),
      providerFinal: String(row[15 + off] || '').trim(),
      note: String(row[16 + off] || '').trim(),
      subType: String(row[17 + off] || '').trim(),
      qa: String(row[18 + off] || '').trim(),
      actionDate: formatValue(row[19 + off]),
      action: String(row[20 + off] || '').trim(),
      status: String(row[21 + off] || '').trim(),
      editGroup: String(row[22 + off] || '').trim(),
      editDetail: String(row[23 + off] || '').trim(),
      reviewReceiveDate: formatValue(row[24 + off]),
      reviewProvider: String(row[25 + off] || '').trim(),
      reviewActionDate: formatValue(row[26 + off]),
      reviewStatus: String(row[27 + off] || '').trim(),
      reviewEditType: String(row[28 + off] || '').trim(),
      reviewEditDetail: String(row[29 + off] || '').trim(),
      financeReceiveDate: formatValue(row[30 + off]),
      financePaymentType: String(row[31 + off] || '').trim(),
      financePreparer: String(row[32 + off] || '').trim(),
      financeUrgentCheck: String(row[33 + off] || '').trim(),
      financeActionDate: formatValue(row[34 + off]),
      financeReviewDate: formatValue(row[35 + off]),
      disbursementDate: formatValue(row[36 + off]),
      disbursementPayer: String(row[37 + off] || '').trim(),
      disbursementNotifyDate: formatValue(row[38 + off]),
      disbursementActivityStartDate: formatValue(row[39 + off]),
      disbursementActivityEndDate: formatValue(row[40 + off]),
      financeIssueDate: formatValue(row[41 + off]),
      financeIssueDetail: String(row[42 + off] || '').trim(),
      department: detectDepartment(row)
    });
  }

  return rows;
}

/**
 * อัปเดตข้อมูลงานสอบทานเฉพาะคอลัมน์ Z ถึง AE (คอลัมน์ 25 ถึง 30 + off)
 */
function updateReviewRecord(item) {
  const sheet = getSheet();
  let rowId = parseInt(item.rowId, 10);
  const data = sheet.getDataRange().getValues();

  let targetRow = 0;
  if (rowId && rowId >= 3 && rowId <= data.length) {
    const r = data[rowId - 1];
    const matchDocNo = item.docNo && String(r[7]).trim() === String(item.docNo).trim();
    const matchRecvNo = item.receiveNo && String(r[2]).trim() === String(item.receiveNo).trim();
    if (matchDocNo || matchRecvNo) {
      targetRow = rowId;
    }
  }

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

  if (!targetRow && rowId >= 3) {
    targetRow = rowId;
  }

  if (!targetRow || targetRow < 3) {
    throw new Error('ไม่พบแถวในชีท DATA สำหรับเอกสาร ' + (item.docNo || item.receiveNo || ''));
  }
  rowId = targetRow;

  const hasEmail = data[1] && (String(data[1][5] || '').indexOf('เมล') !== -1 || data[1].length >= 52);
  const off = hasEmail ? 1 : 0;

  if (item.reviewReceiveDate !== undefined) sheet.getRange(rowId, 25 + off).setValue(item.reviewReceiveDate); // Z
  if (item.reviewProvider !== undefined) sheet.getRange(rowId, 26 + off).setValue(item.reviewProvider);       // AA
  if (item.reviewActionDate !== undefined) sheet.getRange(rowId, 27 + off).setValue(item.reviewActionDate);   // AB
  if (item.reviewStatus !== undefined) sheet.getRange(rowId, 28 + off).setValue(item.reviewStatus);           // AC
  if (item.reviewEditType !== undefined) sheet.getRange(rowId, 29 + off).setValue(item.reviewEditType);       // AD
  if (item.reviewEditDetail !== undefined) sheet.getRange(rowId, 30 + off).setValue(item.reviewEditDetail);   // AE

  return { rowId: rowId, docNo: item.docNo };
}

/**
 * อัปเดตข้อมูลงานงบประมาณเฉพาะคอลัมน์ AS ถึง AZ (คอลัมน์ 44 ถึง 51 + off)
 */
function updateBudgetRecord(item) {
  const sheet = getSheet();
  let rowId = parseInt(item.rowId, 10);
  const data = sheet.getDataRange().getValues();

  let targetRow = 0;
  if (rowId && rowId >= 3 && rowId <= data.length) {
    const r = data[rowId - 1];
    const matchDocNo = item.docNo && String(r[7]).trim() === String(item.docNo).trim();
    const matchRecvNo = item.receiveNo && String(r[2]).trim() === String(item.receiveNo).trim();
    if (matchDocNo || matchRecvNo) {
      targetRow = rowId;
    }
  }

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

  if (!targetRow && rowId >= 3) {
    targetRow = rowId;
  }

  if (!targetRow || targetRow < 3) {
    throw new Error('ไม่พบแถวในชีท DATA สำหรับเอกสาร ' + (item.docNo || item.receiveNo || ''));
  }
  rowId = targetRow;

  const hasEmail = data[1] && (String(data[1][5] || '').indexOf('เมล') !== -1 || data[1].length >= 52);
  const off = hasEmail ? 1 : 0;

  if (item.budgetActionDate !== undefined) sheet.getRange(rowId, 44 + off).setValue(item.budgetActionDate); // AS
  if (item.budgetFR !== undefined) sheet.getRange(rowId, 45 + off).setValue(item.budgetFR);                 // AT
  if (item.budgetFC !== undefined) sheet.getRange(rowId, 46 + off).setValue(item.budgetFC);                 // AU
  if (item.budgetPR !== undefined) sheet.getRange(rowId, 47 + off).setValue(item.budgetPR);                 // AV
  if (item.budgetStatus !== undefined) sheet.getRange(rowId, 48 + off).setValue(item.budgetStatus);         // AW
  if (item.budgetReceiveDate !== undefined) sheet.getRange(rowId, 49 + off).setValue(item.budgetReceiveDate); // AX
  if (item.budgetCoverDate !== undefined) sheet.getRange(rowId, 50 + off).setValue(item.budgetCoverDate);   // AY
  if (item.budgetDocSetDate !== undefined) sheet.getRange(rowId, 51 + off).setValue(item.budgetDocSetDate); // AZ

  return { rowId: rowId, docNo: item.docNo };
}

/**
 * อัปเดตข้อมูลงานการเงินเฉพาะคอลัมน์ AF ถึง AR (คอลัมน์ 31 ถึง 43 + off)
 */
function updateFinanceRecord(item) {
  const sheet = getSheet();
  let rowId = parseInt(item.rowId, 10);
  const data = sheet.getDataRange().getValues();

  let targetRow = 0;
  if (rowId && rowId >= 3 && rowId <= data.length) {
    const r = data[rowId - 1];
    const matchDocNo = item.docNo && String(r[7]).trim() === String(item.docNo).trim();
    const matchRecvNo = item.receiveNo && String(r[2]).trim() === String(item.receiveNo).trim();
    if (matchDocNo || matchRecvNo) {
      targetRow = rowId;
    }
  }

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

  if (!targetRow && rowId >= 3) {
    targetRow = rowId;
  }

  if (!targetRow || targetRow < 3) {
    throw new Error('ไม่พบแถวในชีท DATA สำหรับเอกสาร ' + (item.docNo || item.receiveNo || ''));
  }
  rowId = targetRow;

  const hasEmail = data[1] && (String(data[1][5] || '').indexOf('เมล') !== -1 || data[1].length >= 52);
  const off = hasEmail ? 1 : 0;

  if (item.financeReceiveDate !== undefined) sheet.getRange(rowId, 31 + off).setValue(item.financeReceiveDate); // AF
  if (item.financePaymentType !== undefined) sheet.getRange(rowId, 32 + off).setValue(item.financePaymentType); // AG
  if (item.financePreparer !== undefined) sheet.getRange(rowId, 33 + off).setValue(item.financePreparer);       // AH
  if (item.financeUrgentCheck !== undefined) sheet.getRange(rowId, 34 + off).setValue(item.financeUrgentCheck); // AI
  if (item.financeActionDate !== undefined) sheet.getRange(rowId, 35 + off).setValue(item.financeActionDate);   // AJ
  if (item.financeReviewDate !== undefined) sheet.getRange(rowId, 36 + off).setValue(item.financeReviewDate);   // AK
  if (item.disbursementDate !== undefined) sheet.getRange(rowId, 37 + off).setValue(item.disbursementDate);     // AL
  if (item.disbursementPayer !== undefined) sheet.getRange(rowId, 38 + off).setValue(item.disbursementPayer);   // AM
  if (item.disbursementNotifyDate !== undefined) sheet.getRange(rowId, 39 + off).setValue(item.disbursementNotifyDate); // AN
  if (item.disbursementActivityStartDate !== undefined) sheet.getRange(rowId, 40 + off).setValue(item.disbursementActivityStartDate); // AO
  if (item.disbursementActivityEndDate !== undefined) sheet.getRange(rowId, 41 + off).setValue(item.disbursementActivityEndDate);     // AP
  if (item.financeIssueDate !== undefined) sheet.getRange(rowId, 42 + off).setValue(item.financeIssueDate);     // AQ
  if (item.financeIssueDetail !== undefined) sheet.getRange(rowId, 43 + off).setValue(item.financeIssueDetail); // AR

  return { rowId: rowId, docNo: item.docNo };
}

/**
 * อัปเดตข้อมูลเอกสารในแถวเดิม (งานตรวจจ่าย S:Y และ N)
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

  const hasEmail = data[1] && (String(data[1][5] || '').indexOf('เมล') !== -1 || data[1].length >= 52);
  const off = hasEmail ? 1 : 0;

  // 1. บันทึกผลงานตรวจจ่าย (คอลัมน์ S ถึง Y: คอลัมน์ที่ 19 ถึง 25 ในชีท 52 คอลัมน์)
  const hasInspectionData = Boolean(
    (item.actionDate && String(item.actionDate).trim() !== '') ||
    (item.action && String(item.action).trim() !== '') ||
    (item.status && String(item.status).trim() !== '') ||
    (item.qa && String(item.qa).trim() !== '') ||
    (item.subType && String(item.subType).trim() !== '') ||
    (item.editGroup && String(item.editGroup).trim() !== '') ||
    (item.editDetail && String(item.editDetail).trim() !== '')
  );

  if (hasInspectionData) {
    if (item.subType !== undefined) sheet.getRange(rowId, 18 + off).setValue(item.subType);       // S: ประเภทเอกสารย่อย
    if (item.qa !== undefined) sheet.getRange(rowId, 19 + off).setValue(item.qa);                 // T: QA.
    if (item.actionDate !== undefined) sheet.getRange(rowId, 20 + off).setValue(item.actionDate); // U: วันที่ดำเนินการ
    if (item.action !== undefined) sheet.getRange(rowId, 21 + off).setValue(item.action);         // V: การดำเนินการ
    if (item.status !== undefined) sheet.getRange(rowId, 22 + off).setValue(item.status);         // W: สถานะ
    if (item.editGroup !== undefined) sheet.getRange(rowId, 23 + off).setValue(item.editGroup);   // X: Group-กรณีแก้ไข
    if (item.editDetail !== undefined) sheet.getRange(rowId, 24 + off).setValue(item.editDetail); // Y: รายละเอียดกรณีแก้ไข
  }

  // 2. กรณีแก้ไขข้อมูลเอกสารทั่วไปจาก EditDocumentModal (เฉพาะเมื่อไม่ได้เป็นการบันทึกผลงานตรวจจ่าย)
  if (item.agency && item.docRef && item.docNo && !hasInspectionData) {
    if (item.ep !== undefined) sheet.getRange(rowId, 1).setValue(item.ep);
    if (item.no !== undefined) sheet.getRange(rowId, 2).setValue(item.no);
    if (item.receiveNo !== undefined) sheet.getRange(rowId, 3).setValue(item.receiveNo);
    if (item.sender !== undefined) sheet.getRange(rowId, 4).setValue(item.sender);
    if (item.phone !== undefined) sheet.getRange(rowId, 5).setValue(item.phone);
    if (off && item.email !== undefined) sheet.getRange(rowId, 6).setValue(item.email);
    if (item.docRef !== undefined) sheet.getRange(rowId, 6 + off).setValue(item.docRef);
    if (item.agency !== undefined) sheet.getRange(rowId, 7 + off).setValue(item.agency);
    if (item.docNo !== undefined) sheet.getRange(rowId, 8 + off).setValue(item.docNo);
    if (item.docType !== undefined) sheet.getRange(rowId, 9 + off).setValue(item.docType);
    if (item.dateReceive !== undefined) sheet.getRange(rowId, 10 + off).setValue(item.dateReceive);
    if (item.dateDesk !== undefined) sheet.getRange(rowId, 11 + off).setValue(item.dateDesk);
    if (item.dateReturn !== undefined) sheet.getRange(rowId, 12 + off).setValue(item.dateReturn);
    if (item.providerAuto !== undefined) sheet.getRange(rowId, 14 + off).setValue(item.providerAuto);
    if (item.providerChange !== undefined) sheet.getRange(rowId, 15 + off).setValue(item.providerChange);
    if (item.providerFinal !== undefined) sheet.getRange(rowId, 16 + off).setValue(item.providerFinal);
    if (item.note !== undefined) sheet.getRange(rowId, 17 + off).setValue(item.note);
  }

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
