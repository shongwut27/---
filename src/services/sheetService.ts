import { DocumentItem, DepartmentType } from '../types';
import { INITIAL_DOCUMENTS, INITIAL_SHEET_ID, INITIAL_SHEET_NAME } from '../data/initialData';
import { getAccessToken, googleSignIn } from './authService';

const LOCAL_STORAGE_KEY = 'doc_tracking_data_v1';
const GAS_URL_KEY = 'doc_tracking_gas_url';

export function getStoredGasUrl(): string {
  return localStorage.getItem(GAS_URL_KEY) || (import.meta as any).env?.VITE_GAS_URL || '';
}

export function setStoredGasUrl(url: string): void {
  localStorage.setItem(GAS_URL_KEY, url.trim());
}

export function getLocalDocuments(): DocumentItem[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
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

/**
 * Fetch live data from Google Sheets (Primary Source of Truth)
 */
export async function fetchFromGoogleSheet(sheetId = INITIAL_SHEET_ID, sheetName = INITIAL_SHEET_NAME): Promise<DocumentItem[]> {
  // If user is authenticated with Google, read directly from Google Sheets REST API v4 for guaranteed instant freshness
  try {
    const token = await getAccessToken();
    if (token) {
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A1:X?valueRenderOption=FORMATTED_VALUE`;
      const apiRes = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (apiRes.ok) {
        const json = await apiRes.json();
        const allRows: string[][] = json.values || [];
        const headerCount = 2; // Row 1 and Row 2 are headers
        const dataRows = allRows.slice(headerCount);
        const docRounds: Record<string, number> = {};
        const items: DocumentItem[] = [];

        dataRows.forEach((row, idx) => {
          const val = (i: number): string => (row && row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : '');
          const isRowEmpty = !row || row.every((c) => !c || String(c).trim() === '');
          if (isRowEmpty) return;

          const receiveNo = val(2);
          const docRef = val(5);
          const agency = val(6);
          const docNo = val(7);
          const docType = val(8);

          // Document round identifier: Priority docNo -> receiveNo -> docRef -> rowId
          const docKey = (docNo && docNo !== '')
            ? docNo
            : (receiveNo && receiveNo !== '')
              ? `REC-${receiveNo}`
              : (docRef && docRef !== '')
                ? `REF-${docRef}`
                : `ROW-${idx + 1 + headerCount}`;

          docRounds[docKey] = (docRounds[docKey] || 0) + 1;
          const currentRound = docRounds[docKey];

          const pFinal = val(15);
          const pAuto = val(13);
          const dType = docType;
          const sType = val(17);
          const combined = `${pFinal} ${pAuto} ${dType} ${sType}`.toLowerCase();

          let department: DepartmentType = 'งานตรวจจ่าย';
          if (combined.includes('s2') || combined.includes('สอบทาน')) {
            department = 'งานสอบทาน';
          } else if (
            combined.includes('จ่ายเงิน') ||
            combined.includes('การเงิน') ||
            combined.includes('เงินเดือน') ||
            combined.includes('ทุนการศึกษา')
          ) {
            department = 'งานการเงิน';
          } else if (combined.includes('งบประมาณ')) {
            department = 'งานงบประมาณ';
          }

          items.push({
            id: `doc-row-${idx + 1 + headerCount}`,
            rowId: idx + 1 + headerCount,
            ep: val(0),
            no: val(1),
            receiveNo: receiveNo,
            sender: val(3),
            phone: val(4),
            docRef: docRef,
            agency: agency,
            docNo: docNo,
            docType: docType,
            dateReceive: val(9),
            dateDesk: val(10),
            dateReturn: val(11),
            returnStatus: val(12),
            providerAuto: val(13),
            providerChange: val(14),
            providerFinal: val(15),
            note: val(16),
            subType: val(17),
            qa: val(18),
            actionDate: val(19),
            action: val(20),
            status: val(21),
            editGroup: val(22),
            editDetail: val(23),
            department: department,
            round: currentRound,
          });
        });

        return items;
      }
    }
  } catch (apiErr) {
    console.warn('Google Sheets API v4 fetch fallback to gviz:', apiErr);
  }

  // Fallback: Google Visualization API (public read endpoint with strict anti-cache)
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
  if (!response.ok) {
    throw new Error(`Google Sheets HTTP Error: ${response.status}`);
  }
  const text = await response.text();
  const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const json = JSON.parse(jsonStr);

  const rows = json.table.rows || [];
  const docRounds: Record<string, number> = {};
  const headerCount = (json.table && typeof json.table.parsedNumHeaders === 'number')
    ? json.table.parsedNumHeaders
    : (typeof json.parsedNumHeaders === 'number' ? json.parsedNumHeaders : 2);

  const items: DocumentItem[] = [];

  rows.forEach((r: any, idx: number) => {
    const val = (i: number): string => {
      const cell = r.c && r.c[i];
      if (!cell) return '';
      if (cell.f !== undefined && cell.f !== null) return String(cell.f).trim();
      if (cell.v !== undefined && cell.v !== null) return String(cell.v).trim();
      return '';
    };

    const receiveNo = val(2);
    const docRef = val(5);
    const agency = val(6);
    const docNo = val(7);
    const docType = val(8);

    // Skip completely empty rows (if all cells are blank)
    const isRowEmpty = !r.c || r.c.every((c: any) => !c || (c.v === null && c.v === undefined && c.f === null && c.f === undefined) || (String(c.v ?? c.f ?? '').trim() === ''));
    if (isRowEmpty) {
      return;
    }

    // Document round identifier: Priority docNo -> receiveNo -> docRef -> rowId
    const docKey = (docNo && docNo.trim() !== '')
      ? docNo.trim()
      : (receiveNo && receiveNo.trim() !== '')
        ? `REC-${receiveNo.trim()}`
        : (docRef && docRef.trim() !== '')
          ? `REF-${docRef.trim()}`
          : `ROW-${idx + 1 + headerCount}`;
    docRounds[docKey] = (docRounds[docKey] || 0) + 1;
    const currentRound = docRounds[docKey];

    const pFinal = val(15);
    const pAuto = val(13);
    const dType = docType;
    const sType = val(17);
    const combined = `${pFinal} ${pAuto} ${dType} ${sType}`.toLowerCase();

    let department: DepartmentType = 'งานตรวจจ่าย';
    if (combined.includes('s2') || combined.includes('สอบทาน')) {
      department = 'งานสอบทาน';
    } else if (
      combined.includes('จ่ายเงิน') ||
      combined.includes('การเงิน') ||
      combined.includes('เงินเดือน') ||
      combined.includes('ทุนการศึกษา')
    ) {
      department = 'งานการเงิน';
    } else if (combined.includes('งบประมาณ')) {
      department = 'งานงบประมาณ';
    }

    items.push({
      id: `doc-row-${idx + 1 + headerCount}`,
      rowId: idx + 1 + headerCount, // Row 3 onwards
      ep: val(0),
      no: val(1),
      receiveNo: receiveNo,
      sender: val(3),
      phone: val(4),
      docRef: docRef,
      agency: agency,
      docNo: docNo,
      docType: docType,
      dateReceive: val(9),
      dateDesk: val(10),
      dateReturn: val(11),
      returnStatus: val(12),
      providerAuto: val(13),
      providerChange: val(14),
      providerFinal: val(15),
      note: val(16),
      subType: val(17),
      qa: val(18),
      actionDate: val(19),
      action: val(20),
      status: val(21),
      editGroup: val(22),
      editDetail: val(23),
      department: department,
      round: currentRound,
    });
  });

  return items;
}

/**
 * Save data directly to Google Sheets using Google Sheets REST API v4
 */
export async function saveToGoogleSheetDirectly(
  action: 'updateDocument' | 'addRound' | 'createDocument',
  item: DocumentItem,
  sheetId = INITIAL_SHEET_ID,
  sheetName = INITIAL_SHEET_NAME
): Promise<{ success: boolean; error?: string }> {
  try {
    let token = await getAccessToken();
    if (!token) {
      try {
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      } catch (authErr: any) {
        console.warn('OAuth sign in needed for Google Sheets write:', authErr);
      }
    }

    if (!token) {
      return {
        success: false,
        error: 'กรุณาเข้าสู่ระบบ Google เพื่อรับสิทธิ์ในการบันทึกข้อมูลลง Google Sheet โดยตรง',
      };
    }

    const rowValues = [
      item.ep ?? '',
      item.no ?? '',
      item.receiveNo ?? '',
      item.sender ?? '',
      item.phone ?? '',
      item.docRef ?? '',
      item.agency ?? '',
      item.docNo ?? '',
      item.docType ?? '',
      item.dateReceive ?? '',
      item.dateDesk ?? '',
      item.dateReturn ?? '',
      item.returnStatus ?? '',
      item.providerAuto ?? '',
      item.providerChange ?? '',
      item.providerFinal ?? '',
      item.note ?? '',
      item.subType ?? '',
      item.qa ?? '',
      item.actionDate ?? '',
      item.action ?? '',
      item.status ?? '',
      item.editGroup ?? '',
      item.editDetail ?? '',
    ];

    if (action === 'updateDocument' && item.rowId && Number(item.rowId) >= 3) {
      const range = `${sheetName}!A${item.rowId}:X${item.rowId}`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: [rowValues],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Google Sheets API error ${res.status}`);
      }
      return { success: true };
    } else {
      // Append row for addRound or createDocument
      const range = `${sheetName}!A:X`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: [rowValues],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Google Sheets API error ${res.status}`);
      }
      return { success: true };
    }
  } catch (err: any) {
    console.error('Error saving directly to Google Sheet:', err);
    return {
      success: false,
      error: err?.message || 'เกิดข้อผิดพลาดในการบันทึกลง Google Sheet',
    };
  }
}

/**
 * Send update directly to Google Sheets REST API, /api/sheets, or Google Apps Script Web App
 */
export async function syncToGas(action: 'updateDocument' | 'addRound' | 'createDocument', data: any): Promise<boolean> {
  // 1. First priority: Direct Google Sheets REST API v4
  try {
    const directResult = await saveToGoogleSheetDirectly(action, data);
    if (directResult.success) {
      return true;
    }
  } catch (e) {
    console.warn('Direct Google Sheet API attempt fallback:', e);
  }

  // 2. Second attempt: Direct /api/sheets endpoint (available on Vercel & local server)
  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/sheets', {
      method: 'POST',
      headers,
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

  // 3. Third attempt: Direct Google Apps Script Web App URL if configured
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, data }),
        mode: 'no-cors',
      });
      return true;
    } catch (err) {
      console.warn('Failed to sync to GAS Web App with POST, trying GET fallback...', err);
      try {
        const getUrl = new URL(gasUrl);
        getUrl.searchParams.set('action', action);
        getUrl.searchParams.set('data', JSON.stringify(data));
        await fetch(getUrl.toString(), { mode: 'no-cors' });
        return true;
      } catch (getErr) {
        console.error('Failed to sync to GAS Web App', getErr);
      }
    }
  }

  return false;
}
