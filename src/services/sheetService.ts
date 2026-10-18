import { DocumentItem, DepartmentType } from '../types';
import { INITIAL_DOCUMENTS } from '../data/initialData';
import {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_TABLE,
} from './supabaseClient';
import { parseThaiDate } from '../utils/workingDays';

const LOCAL_STORAGE_KEY = 'doc_tracking_data_v2';
const GAS_URL_KEY = 'doc_tracking_gas_url';

export function getStoredGasUrl(): string {
  return localStorage.getItem(GAS_URL_KEY) || SUPABASE_URL;
}

export function setStoredGasUrl(url: string): void {
  localStorage.setItem(GAS_URL_KEY, url.trim());
}

export function getLocalDocuments(): DocumentItem[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: DocumentItem) => ({
          ...item,
          department: (item.department || 'งานตรวจจ่าย') as DepartmentType,
        }));
      }
    }
  } catch (e) {
    console.error('Error reading local documents', e);
  }
  return INITIAL_DOCUMENTS;
}

export function saveLocalDocuments(docs: DocumentItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error('Error saving local documents', e);
  }
}

export function resetToInitialData(): DocumentItem[] {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  return INITIAL_DOCUMENTS;
}

function isUuid(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toNullable(val?: string | null): string | null {
  if (val === undefined || val === null) return null;
  const trimmed = String(val).trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Map a row from Supabase table "2570-ระบบติดตามเอกสาร" to DocumentItem
 */
export function mapSupabaseRowToDocumentItem(
  row: Record<string, any>,
  sheetRow: number,
  currentRound: number
): DocumentItem {
  const val = (key: string): string => {
    const v = row[key];
    return v !== undefined && v !== null ? String(v).trim() : '';
  };

  const receiveNo = val('เลขทะเบียนรับ');
  const email = val('ที่อยู่อีเมล');
  const docRef = val('เลขที่ อว/ ชื่อ');
  const agency = val('หน่วยงาน');
  const docNo = val('เลขที่เอกสาร');
  const docType = val('ประเภทเอกสาร');
  const phone = val('โทรศัพท์') || val('โทร.');

  const pAuto = val('ผู้ให้บริการ');
  const pChange = val('เปลี่ยนโต๊ะบริการ');
  const pFinal = val('ผู้ให้บริการ-final') || pChange || pAuto;

  let sType = val('ประเภทเอกสารย่อย');
  let qVal = val('QA.');

  const isPrakaymas = pFinal.includes('ประกายมาศ') || pAuto.includes('ประกายมาศ');
  if (!isPrakaymas && !qVal && sType) {
    qVal = sType;
    sType = '';
  }

  const department: DepartmentType = 'งานตรวจจ่าย';

  return {
    id: val('id') || `doc-row-${sheetRow}`,
    rowId: sheetRow,
    ep: val('EP.'),
    no: val('N/O'),
    receiveNo,
    sender: val('ผู้ส่งเอกสาร'),
    phone,
    email,
    docRef,
    agency,
    docNo,
    docType,
    dateReceive: val('วันที่รับ'),
    dateDesk: val('วันที่ส่ง'),
    dateReturn: val('วันที่ส่งคืน'),
    returnStatus: val('สถานะ_ธุรการส่งคืน'),
    providerAuto: pAuto,
    providerChange: pChange,
    providerFinal: pFinal,
    note: val('หมายเหตุ'),
    subType: sType,
    qa: qVal,
    actionDate: val('วันทำรายการ_ตรวจ'),
    action: val('การดำเนินการ'),
    status: val('สถานะ_งานตรวจ'),
    editGroup: val('Group-กรณีแก้ไข'),
    editDetail: val('หมายเหตุ_งานตรวจ'),
    reviewReceiveDate: val('วันที่รับ_สอบทาน'),
    reviewProvider: val('ผู้ให้บริการ_สอบทาน'),
    reviewActionDate: val('วันทำรายการ_สอบทาน'),
    reviewStatus: val('สถานะ_สอบทาน'),
    reviewEditType: val('ประเภทแก้ไข'),
    reviewEditDetail: val('หมายเหตุ_สอบทาน'),
    financeReceiveDate: val('วันที่รับ_การเงิน'),
    financePaymentType: val('ประเภทการจ่าย'),
    financePreparer: val('ผู้จัดทำเช็ค/โอนเงิน'),
    financeUrgentCheck: val('กรณีเช็คด่วน'),
    financeActionDate: val('วันทำรายการ_การเงิน'),
    financeReviewDate: val('วันที่สอบทาน_เช็ค'),
    disbursementDate: val('วันที่_จ่ายเงิน'),
    disbursementPayer: val('ผู้จ่ายเงิน'),
    disbursementNotifyDate: val('วันที่แจ้งรับเงิน'),
    disbursementActivityStartDate: val('วันที่เริ่ม_ยืมทดรอง'),
    disbursementActivityEndDate: val('วันสิ้นสุดกิจกรรม'),
    financeIssueDate: val('วันที่_จ่ายไม่ได้'),
    financeIssueDetail: val('หมายเหตุ_ไม่จ่าย'),
    budgetActionDate: val('วันทำรายการ_ลงนาม'),
    budgetFR: val('FR'),
    budgetFC: val('FC'),
    budgetPR: val('PR'),
    budgetStatus: val('สถานะ_งบประมาณ'),
    budgetReceiveDate: val('วันที่รับ_งบประมาณ'),
    budgetCoverDate: val('วันที่ตามใบปะหน้า'),
    budgetDocSetDate: val('วันที่ตามชุดเอกสาร'),
    department,
    round: currentRound,
  };
}

/**
 * Fetch live data from Supabase table "2570-ระบบติดตามเอกสาร" (Primary Source of Truth)
 */
export async function fetchFromSupabase(tableName = SUPABASE_TABLE): Promise<DocumentItem[]> {
  let allRows: Record<string, any>[] = [];

  try {
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, from + pageSize - 1);

      if (error) {
        throw error;
      }
      if (!data || data.length === 0) {
        break;
      }
      allRows = allRows.concat(data);
      if (data.length < pageSize) {
        break;
      }
      from += pageSize;
    }
  } catch (sdkErr) {
    console.warn('Supabase SDK fetch fallback to direct REST API:', sdkErr);
    const url = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(tableName)}?select=*`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      },
    });
    if (!res.ok) {
      throw new Error(`Supabase HTTP Error: ${res.status}`);
    }
    allRows = await res.json();
  }

  // Sort rows chronologically by วันที่รับ / วันที่ส่ง so round numbers and latestRound are always accurate
  const indexedRows = allRows.map((r, originalIndex) => {
    const dStr = r['วันที่รับ'] || r['วันที่ส่ง'] || '';
    const parsed = parseThaiDate(dStr);
    return {
      row: r,
      originalIndex,
      timestamp: parsed ? parsed.getTime() : 0,
    };
  });

  indexedRows.sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    return a.originalIndex - b.originalIndex;
  });

  const docRounds: Record<string, number> = {};
  const items: DocumentItem[] = [];

  indexedRows.forEach(({ row }, idx) => {
    if (!row) return;
    const receiveNo = row['เลขทะเบียนรับ'] ? String(row['เลขทะเบียนรับ']).trim() : '';
    const docRef = row['เลขที่ อว/ ชื่อ'] ? String(row['เลขที่ อว/ ชื่อ']).trim() : '';
    const docNo = row['เลขที่เอกสาร'] ? String(row['เลขที่เอกสาร']).trim() : '';

    // Skip accidental header rows if any
    if (receiveNo === 'เลขทะเบียนรับ' || row['N/O'] === 'N/O' || docNo === 'เลขที่เอกสาร') {
      return;
    }

    const sheetRow = idx + 3;
    const docKey = docNo
      ? docNo
      : receiveNo
        ? `REC-${receiveNo}`
        : docRef
          ? `REF-${docRef}`
          : `ROW-${row.id || sheetRow}`;

    docRounds[docKey] = (docRounds[docKey] || 0) + 1;
    const currentRound = docRounds[docKey];

    items.push(mapSupabaseRowToDocumentItem(row, sheetRow, currentRound));
  });

  return items;
}

// Keep alias fetchFromGoogleSheet so existing imports in App.tsx work seamlessly
export async function fetchFromGoogleSheet(
  _sheetId?: string,
  _sheetName?: string
): Promise<DocumentItem[]> {
  return fetchFromSupabase(SUPABASE_TABLE);
}

/**
 * Helper to locate target row UUID in Supabase when item.id is not already a UUID
 */
async function resolveSupabaseRowId(
  item: DocumentItem,
  tableName = SUPABASE_TABLE
): Promise<string | null> {
  if (isUuid(item.id)) {
    return item.id.trim();
  }

  try {
    if (item.receiveNo && item.receiveNo.trim() !== '') {
      const { data } = await supabase
        .from(tableName)
        .select('id, "วันที่รับ"')
        .eq('เลขทะเบียนรับ', item.receiveNo.trim());
      if (data && data.length > 0) {
        return data[data.length - 1].id;
      }
    }

    if (item.docNo && item.docNo.trim() !== '') {
      const { data } = await supabase
        .from(tableName)
        .select('id, "วันที่รับ"')
        .eq('เลขที่เอกสาร', item.docNo.trim());
      if (data && data.length > 0) {
        return data[data.length - 1].id;
      }
    }
  } catch (err) {
    console.warn('Error resolving Supabase row id:', err);
  }

  return null;
}

/**
 * Save data directly to Supabase table "2570-ระบบติดตามเอกสาร"
 */
export async function saveToSupabaseDirectly(
  action: 'updateDocument' | 'addRound' | 'createDocument' | 'updateReview' | 'updateFinance' | 'updateBudget',
  item: DocumentItem,
  tableName = SUPABASE_TABLE
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. บันทึกเฉพาะงานสอบทาน
    if (action === 'updateReview') {
      const targetId = await resolveSupabaseRowId(item, tableName);
      if (!targetId) {
        return { success: false, error: 'ไม่พบรหัสอ้างอิงเอกสาร (id) ใน Supabase สำหรับบันทึกงานสอบทาน' };
      }

      const payload: Record<string, any> = {
        'วันที่รับ_สอบทาน': toNullable(item.reviewReceiveDate),
        'ผู้ให้บริการ_สอบทาน': toNullable(item.reviewProvider),
        'วันทำรายการ_สอบทาน': toNullable(item.reviewActionDate),
        'สถานะ_สอบทาน': toNullable(item.reviewStatus),
        'ประเภทแก้ไข': toNullable(item.reviewEditType),
        'หมายเหตุ_สอบทาน': toNullable(item.reviewEditDetail),
      };

      const { error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', targetId);

      if (error) throw error;
      return { success: true };
    }

    // 2. บันทึกเฉพาะงานการเงิน
    if (action === 'updateFinance') {
      const targetId = await resolveSupabaseRowId(item, tableName);
      if (!targetId) {
        return { success: false, error: 'ไม่พบรหัสอ้างอิงเอกสาร (id) ใน Supabase สำหรับบันทึกงานการเงิน' };
      }

      const payload: Record<string, any> = {
        'วันที่รับ_การเงิน': toNullable(item.financeReceiveDate),
        'ประเภทการจ่าย': toNullable(item.financePaymentType),
        'ผู้จัดทำเช็ค/โอนเงิน': toNullable(item.financePreparer),
        'กรณีเช็คด่วน': toNullable(item.financeUrgentCheck),
        'วันทำรายการ_การเงิน': toNullable(item.financeActionDate),
        'วันที่สอบทาน_เช็ค': toNullable(item.financeReviewDate),
        'วันที่_จ่ายเงิน': toNullable(item.disbursementDate),
        'ผู้จ่ายเงิน': toNullable(item.disbursementPayer),
        'วันที่แจ้งรับเงิน': toNullable(item.disbursementNotifyDate),
        'วันที่เริ่ม_ยืมทดรอง': toNullable(item.disbursementActivityStartDate),
        'วันสิ้นสุดกิจกรรม': toNullable(item.disbursementActivityEndDate),
        'วันที่_จ่ายไม่ได้': toNullable(item.financeIssueDate),
        'หมายเหตุ_ไม่จ่าย': toNullable(item.financeIssueDetail),
      };

      const { error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', targetId);

      if (error) throw error;
      return { success: true };
    }

    // 3. บันทึกเฉพาะงานงบประมาณ
    if (action === 'updateBudget') {
      const targetId = await resolveSupabaseRowId(item, tableName);
      if (!targetId) {
        return { success: false, error: 'ไม่พบรหัสอ้างอิงเอกสาร (id) ใน Supabase สำหรับบันทึกงานงบประมาณ' };
      }

      const payload: Record<string, any> = {
        'วันทำรายการ_ลงนาม': toNullable(item.budgetActionDate),
        'FR': toNullable(item.budgetFR),
        'FC': toNullable(item.budgetFC),
        'PR': toNullable(item.budgetPR),
        'สถานะ_งบประมาณ': toNullable(item.budgetStatus),
        'วันที่รับ_งบประมาณ': toNullable(item.budgetReceiveDate),
        'วันที่ตามใบปะหน้า': toNullable(item.budgetCoverDate),
        'วันที่ตามชุดเอกสาร': toNullable(item.budgetDocSetDate),
      };

      const { error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', targetId);

      if (error) throw error;
      return { success: true };
    }

    // 4. บันทึกแก้ไขข้อมูลเอกสาร หรือ งานตรวจจ่าย (updateDocument)
    if (action === 'updateDocument') {
      const targetId = await resolveSupabaseRowId(item, tableName);
      if (targetId) {
        const payload: Record<string, any> = {
          'ประเภทเอกสารย่อย': toNullable(item.subType),
          'QA.': toNullable(item.qa),
          'วันทำรายการ_ตรวจ': toNullable(item.actionDate),
          'การดำเนินการ': toNullable(item.action),
          'สถานะ_งานตรวจ': toNullable(item.status),
          'Group-กรณีแก้ไข': toNullable(item.editGroup),
          'หมายเหตุ_งานตรวจ': toNullable(item.editDetail),
        };

        if (item.agency || item.docRef || item.docNo) {
          payload['EP.'] = toNullable(item.ep);
          payload['N/O'] = toNullable(item.no);
          payload['เลขทะเบียนรับ'] = toNullable(item.receiveNo);
          payload['ผู้ส่งเอกสาร'] = toNullable(item.sender);
          payload['โทรศัพท์'] = toNullable(item.phone);
          payload['โทร.'] = toNullable(item.phone);
          if (item.email !== undefined) {
            payload['ที่อยู่อีเมล'] = toNullable(item.email);
          }
          payload['เลขที่ อว/ ชื่อ'] = toNullable(item.docRef);
          payload['หน่วยงาน'] = toNullable(item.agency);
          payload['เลขที่เอกสาร'] = toNullable(item.docNo);
          payload['ประเภทเอกสาร'] = toNullable(item.docType);
          payload['วันที่รับ'] = toNullable(item.dateReceive);
          payload['วันที่ส่ง'] = toNullable(item.dateDesk);
          payload['วันที่ส่งคืน'] = toNullable(item.dateReturn);
          payload['สถานะ_ธุรการส่งคืน'] = toNullable(item.returnStatus);
          payload['ผู้ให้บริการ'] = toNullable(item.providerAuto);
          payload['เปลี่ยนโต๊ะบริการ'] = toNullable(item.providerChange);
          payload['ผู้ให้บริการ-final'] = toNullable(item.providerFinal);
          payload['หมายเหตุ'] = toNullable(item.note);
        }

        const { error } = await supabase
          .from(tableName)
          .update(payload)
          .eq('id', targetId);

        if (error) throw error;
        return { success: true };
      }
    }

    // 5. เพิ่มเอกสารใหม่ หรือ เพิ่มรอบใหม่ (createDocument / addRound)
    const fullPayload: Record<string, any> = {
      id: isUuid(item.id) ? item.id.trim() : generateUuid(),
      'EP.': toNullable(item.ep),
      'N/O': toNullable(item.no) || 'N',
      'เลขทะเบียนรับ': toNullable(item.receiveNo),
      'ผู้ส่งเอกสาร': toNullable(item.sender),
      'โทรศัพท์': toNullable(item.phone),
      'โทร.': toNullable(item.phone),
      'ที่อยู่อีเมล': toNullable(item.email),
      'เลขที่ อว/ ชื่อ': toNullable(item.docRef),
      'หน่วยงาน': toNullable(item.agency),
      'เลขที่เอกสาร': toNullable(item.docNo),
      'ประเภทเอกสาร': toNullable(item.docType),
      'วันที่รับ': toNullable(item.dateReceive),
      'วันที่ส่ง': toNullable(item.dateDesk),
      'วันที่ส่งคืน': toNullable(item.dateReturn),
      'สถานะ_ธุรการส่งคืน': toNullable(item.returnStatus),
      'ผู้ให้บริการ': toNullable(item.providerAuto),
      'เปลี่ยนโต๊ะบริการ': toNullable(item.providerChange),
      'ผู้ให้บริการ-final': toNullable(item.providerFinal),
      'หมายเหตุ': toNullable(item.note),
      'ประเภทเอกสารย่อย': toNullable(item.subType),
      'QA.': toNullable(item.qa),
      'วันทำรายการ_ตรวจ': toNullable(item.actionDate),
      'การดำเนินการ': toNullable(item.action),
      'สถานะ_งานตรวจ': toNullable(item.status),
      'Group-กรณีแก้ไข': toNullable(item.editGroup),
      'หมายเหตุ_งานตรวจ': toNullable(item.editDetail),
      'วันที่รับ_สอบทาน': toNullable(item.reviewReceiveDate),
      'ผู้ให้บริการ_สอบทาน': toNullable(item.reviewProvider),
      'วันทำรายการ_สอบทาน': toNullable(item.reviewActionDate),
      'สถานะ_สอบทาน': toNullable(item.reviewStatus),
      'ประเภทแก้ไข': toNullable(item.reviewEditType),
      'หมายเหตุ_สอบทาน': toNullable(item.reviewEditDetail),
      'วันที่รับ_การเงิน': toNullable(item.financeReceiveDate),
      'ประเภทการจ่าย': toNullable(item.financePaymentType),
      'ผู้จัดทำเช็ค/โอนเงิน': toNullable(item.financePreparer),
      'กรณีเช็คด่วน': toNullable(item.financeUrgentCheck),
      'วันทำรายการ_การเงิน': toNullable(item.financeActionDate),
      'วันที่สอบทาน_เช็ค': toNullable(item.financeReviewDate),
      'วันที่_จ่ายเงิน': toNullable(item.disbursementDate),
      'ผู้จ่ายเงิน': toNullable(item.disbursementPayer),
      'วันที่แจ้งรับเงิน': toNullable(item.disbursementNotifyDate),
      'วันที่เริ่ม_ยืมทดรอง': toNullable(item.disbursementActivityStartDate),
      'วันสิ้นสุดกิจกรรม': toNullable(item.disbursementActivityEndDate),
      'วันที่_จ่ายไม่ได้': toNullable(item.financeIssueDate),
      'หมายเหตุ_ไม่จ่าย': toNullable(item.financeIssueDetail),
      'วันทำรายการ_ลงนาม': toNullable(item.budgetActionDate),
      'FR': toNullable(item.budgetFR),
      'FC': toNullable(item.budgetFC),
      'PR': toNullable(item.budgetPR),
      'สถานะ_งบประมาณ': toNullable(item.budgetStatus),
      'วันที่รับ_งบประมาณ': toNullable(item.budgetReceiveDate),
      'วันที่ตามใบปะหน้า': toNullable(item.budgetCoverDate),
      'วันที่ตามชุดเอกสาร': toNullable(item.budgetDocSetDate),
      'TYPE': '1. ตรวจจ่าย-งานใหม่',
    };

    const { error } = await supabase.from(tableName).insert([fullPayload]);
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error('Error saving directly to Supabase:', err);
    return {
      success: false,
      error: err?.message || 'เกิดข้อผิดพลาดในการบันทึกลง Supabase',
    };
  }
}

export async function saveToGoogleSheetDirectly(
  action: 'updateDocument' | 'addRound' | 'createDocument' | 'updateReview' | 'updateFinance' | 'updateBudget',
  item: DocumentItem,
  _sheetId?: string,
  _sheetName?: string
): Promise<{ success: boolean; error?: string }> {
  return saveToSupabaseDirectly(action, item, SUPABASE_TABLE);
}

/**
 * Send update directly to Supabase table "2570-ระบบติดตามเอกสาร"
 */
export async function syncToGas(
  action: 'updateDocument' | 'addRound' | 'createDocument' | 'updateReview' | 'updateFinance' | 'updateBudget',
  data: any
): Promise<boolean> {
  // 1. Primary: Direct Supabase SDK / REST API
  try {
    const directResult = await saveToSupabaseDirectly(action, data);
    if (directResult.success) {
      return true;
    }
  } catch (e) {
    console.warn('Direct Supabase save attempt fallback:', e);
  }

  // 2. Fallback: /api/sheets endpoint
  try {
    const res = await fetch('/api/sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });
    if (res.ok) {
      const result = await res.json().catch(() => ({}));
      if (result.success) {
        return true;
      }
    }
  } catch (apiErr) {
    console.warn('Call to /api/sheets fallback notice:', apiErr);
  }

  return false;
}

export const syncToSupabase = syncToGas;

/**
 * บันทึกข้อมูลหลายรายการลง Supabase พร้อมกัน (Batch Update สำหรับงานสอบทาน)
 */
export async function batchSaveToGoogleSheet(
  items: DocumentItem[],
  onProgress?: (done: number, total: number) => void,
  _sheetId?: string,
  _sheetName?: string
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  if (!items || items.length === 0) {
    return { success: true, updatedCount: 0 };
  }

  let successCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const targetId = await resolveSupabaseRowId(item, SUPABASE_TABLE);
      if (targetId) {
        const { error } = await supabase
          .from(SUPABASE_TABLE)
          .update({
            'วันที่รับ_สอบทาน': toNullable(item.reviewReceiveDate),
            'ผู้ให้บริการ_สอบทาน': toNullable(item.reviewProvider),
          })
          .eq('id', targetId);

        if (!error) {
          successCount++;
        } else {
          console.error('Batch update item error:', item.id, error);
        }
      }
    } catch (itemErr) {
      console.error('Error saving item in batch', item.id, itemErr);
    }

    if (onProgress) {
      onProgress(i + 1, items.length);
    }
  }

  return {
    success: successCount > 0,
    updatedCount: successCount,
  };
}

export const batchSaveToSupabase = batchSaveToGoogleSheet;
