import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code2, FileCode, BookOpen, Settings } from 'lucide-react';
import { INITIAL_SHEET_ID } from '../data/initialData';

interface GasCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
}

export const GasCodeModal: React.FC<GasCodeModalProps> = ({
  isOpen,
  onClose,
  gasUrl,
  onSaveGasUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'codegs' | 'indexhtml' | 'guide' | 'settings'>('codegs');
  const [copied, setCopied] = useState(false);
  const [tempUrl, setTempUrl] = useState(gasUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const codeGsContent = `/**
 * Google Apps Script (GAS) สำหรับระบบติดตามเอกสาร (Document Tracking System)
 * Google Sheet ID: ${INITIAL_SHEET_ID}
 * Sheet Name: DATA
 */

const SHEET_ID = '${INITIAL_SHEET_ID}';
const SHEET_NAME = 'DATA';

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || '';

    if (action === 'getDocuments') {
      const data = getAllDocuments();
      return jsonResponse({ status: 'success', data: data });
    }

    if (action === 'updateDocument' && params.data) {
      const itemData = typeof params.data === 'string' ? JSON.parse(params.data) : params.data;
      const result = updateDocumentRecord(itemData);
      return jsonResponse({ status: 'success', message: 'อัปเดตเอกสารสำเร็จ', result: result });
    }

    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('ระบบติดตามเอกสาร - 4 ฝ่าย')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

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

function getAllDocuments() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 2) return [];

  // ข้อมูลจริงเริ่มที่แถว 3 (index 2) ข้ามแถวที่ 1 (กลุ่มงาน) และแถวที่ 2 (ชื่อคอลัมน์)
  const rows = [];
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const docNo = String(row[7] || '').trim();
    if (!docNo && !row[2]) continue;

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
      // งานตรวจจ่าย (คอลัมน์ R ถึง X: คอลัมน์ที่ 18 ถึง 24 ตามภาพในชีท DATA)
      subType: String(row[17] || '').trim(),      // R: ประเภทเอกสารย่อย
      qa: String(row[18] || '').trim(),           // S: QA.
      actionDate: formatValue(row[19]),          // T: วันที่ดำเนินการ
      action: String(row[20] || '').trim(),       // U: การดำเนินการ
      status: String(row[21] || '').trim(),       // V: สถานะ
      editGroup: String(row[22] || '').trim(),    // W: Group-กรณีแก้ไข
      editDetail: String(row[23] || '').trim()    // X: รายละเอียดกรณีแก้ไข
    });
  }
  return rows;
}

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

  // ข้อมูลทั่วไป (คอลัมน์ A ถึง Q: คอลัมน์ที่ 1 ถึง 17)
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

  // งานตรวจจ่าย (คอลัมน์ R ถึง X: คอลัมน์ที่ 18 ถึง 24 ตามภาพในชีท DATA)
  if (item.subType !== undefined) sheet.getRange(rowId, 18).setValue(item.subType);       // R: ประเภทเอกสารย่อย
  if (item.qa !== undefined) sheet.getRange(rowId, 19).setValue(item.qa);                 // S: QA.
  if (item.actionDate !== undefined) sheet.getRange(rowId, 20).setValue(item.actionDate); // T: วันที่ดำเนินการ
  if (item.action !== undefined) sheet.getRange(rowId, 21).setValue(item.action);         // U: การดำเนินการ
  if (item.status !== undefined) sheet.getRange(rowId, 22).setValue(item.status);         // V: สถานะ
  if (item.editGroup !== undefined) sheet.getRange(rowId, 23).setValue(item.editGroup);   // W: Group-กรณีแก้ไข
  if (item.editDetail !== undefined) sheet.getRange(rowId, 24).setValue(item.editDetail); // X: รายละเอียดกรณีแก้ไข

  return { rowId: rowId, docNo: item.docNo };
}

function addNewRound(item) {
  const sheet = getSheet();
  sheet.appendRow([
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
    // งานตรวจจ่าย (คอลัมน์ R ถึง X: คอลัมน์ที่ 18 ถึง 24)
    item.subType || '',      // R: ประเภทเอกสารย่อย
    item.qa || '',           // S: QA.
    item.actionDate || '',   // T: วันที่ดำเนินการ
    item.action || '',       // U: การดำเนินการ
    item.status || '',       // V: สถานะ
    item.editGroup || '',    // W: Group-กรณีแก้ไข
    item.editDetail || ''    // X: รายละเอียดกรณีแก้ไข
  ]);
  return { success: true };
}

function createNewDocument(item) {
  return addNewRound(item);
}

function formatValue(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Bangkok', 'd/M/yyyy HH:mm:ss');
  }
  return String(val).trim();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    onSaveGasUrl(tempUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                โค้ด Google Apps Script (GAS) & วิธีการติดตั้ง
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Google Sheet ID: <strong>{INITIAL_SHEET_ID}</strong> (DATA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-nav Tabs */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-4 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('codegs')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'codegs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code.gs (Backend)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ขั้นตอนการนำไปใช้งาน (Deployment Guide)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>เชื่อมต่อ URL Web App</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'codegs' && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-2">
                <span className="text-slate-600 font-medium">
                  คัดลอกโค้ดนี้ไปวางในไฟล์ <code>Code.gs</code> บน Google Apps Script:
                </span>
                <button
                  onClick={() => copyToClipboard(codeGsContent)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอก Code.gs</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[50vh]">
                {codeGsContent}
              </pre>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-slate-700 text-xs leading-relaxed">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-900 text-sm mb-1">
                  🚀 วิธีการ Deploy Web Application บน Google Apps Script (2 นาที):
                </h4>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>
                    เปิด Google Sheets ID:{' '}
                    <code className="bg-white px-1.5 py-0.5 rounded border font-mono">
                      {INITIAL_SHEET_ID}
                    </code>
                  </li>
                  <li>
                    ไปที่เมนูด้านบน คลิก <strong>ส่วนขยาย (Extensions)</strong> &gt;{' '}
                    <strong>Apps Script</strong>
                  </li>
                  <li>
                    ในแถบซ้าย นำโค้ดจากแท็บ <strong>Code.gs</strong> ไปวางแทนที่โค้ดเดิมทั้งหมด
                  </li>
                  <li>
                    หากต้องการใช้งานหน้าเว็บ HTML ให้คลิกปุ่ม <strong>+</strong> ข้างเมนู &gt;{' '}
                    <strong>HTML</strong> แล้วตั้งชื่อว่า <code>Index</code> จากนั้นนำโค้ดในไฟล์{' '}
                    <code>gas/Index.html</code> ไปวาง
                  </li>
                  <li>
                    กดปุ่ม <strong>บันทึก (Save)</strong> (ไอคอนแผ่นดิสก์)
                  </li>
                  <li>
                    คลิกปุ่มสีน้ำเงินมุมขวาบน <strong>การทำให้ใช้งานได้ (Deploy)</strong> &gt;{' '}
                    <strong>การทำให้ใช้งานได้ใหม่ (New deployment)</strong>
                  </li>
                  <li>
                    เลือกประเภทเป็น <strong>เว็บแอป (Web app)</strong>:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-600">
                      <li>คำอธิบาย: <code>ระบบติดตามเอกสาร 4 ฝ่าย v1.0</code></li>
                      <li>
                        ดำเนินการในฐานะ (Execute as): <strong>ฉัน (อีเมลของคุณ)</strong>
                      </li>
                      <li>
                        ผู้มีสิทธิ์เข้าถึง (Who has access): <strong>ทุกคน (Anyone)</strong>
                      </li>
                    </ul>
                  </li>
                  <li>
                    คลิก <strong>ทำให้ใช้งานได้ (Deploy)</strong> และคัดลอก URL ของ Web App ที่ได้
                  </li>
                  <li>
                    นำ URL ที่ได้มาใส่ในแท็บ <strong>"เชื่อมต่อ URL Web App"</strong> ของระบบนี้เพื่อเปิดการซิงก์ข้อมูลสองทางแบบเรียลไทม์!
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <h5 className="font-bold text-slate-900 mb-1">💡 โครงสร้างคอลัมน์ใน Sheet DATA:</h5>
                <p className="text-slate-600 text-[11px] mb-0">
                  ระบบรองรับคอลัมน์ A ถึง X ได้แก่: งานธุรการ EP, N/O, เลขทะเบียนรับ, ผู้ส่งเอกสาร, โทรศัพท์, เลขที่ อว, หน่วยงาน, เลขที่เอกสาร, ประเภทเอกสาร, วันที่รับ, วันที่ลงโต๊ะ, วันที่ส่งคืน, สถานะการส่งคืน, ผู้ให้บริการ (Final) ฯลฯ
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  🔗 เชื่อมต่อกับ Google Apps Script Web App URL
                </h4>
                <p className="text-slate-500 text-xs mb-3">
                  หากคุณ Deploy Web App บน Google Apps Script แล้ว สามารถนำ Web App URL มาใส่ที่นี่ เพื่อให้ระบบบันทึกและอัปเดตข้อมูลกลับไปยัง Google Sheet DATA ได้โดยตรง:
                </p>

                <div className="space-y-2">
                  <label className="block text-slate-700 font-semibold">
                    Google Apps Script Web App URL:
                  </label>
                  <input
                    type="url"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between pt-2">
                    {saveSuccess ? (
                      <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                        ✓ บันทึก URL เรียบร้อยแล้ว
                      </span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>บันทึกการตั้งค่า</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
