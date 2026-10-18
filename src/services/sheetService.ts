import { DocumentItem, DepartmentType } from '../types';
import { INITIAL_DOCUMENTS, INITIAL_SHEET_ID, INITIAL_SHEET_NAME } from '../data/initialData';
import { getAccessToken, googleSignIn, setCachedAccessToken } from './authService';

const LOCAL_STORAGE_KEY = 'doc_tracking_data_v2';
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
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: DocumentItem) => ({
          ...item,
          department: 'งานตรวจจ่าย' as DepartmentType,
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

/**
 * Fetch live data from Google Sheets (Primary Source of Truth)
 */
export async function fetchFromGoogleSheet(sheetId = INITIAL_SHEET_ID, sheetName = INITIAL_SHEET_NAME): Promise<DocumentItem[]> {
  // If user is authenticated with Google, read directly from Google Sheets REST API v4 for guaranteed instant freshness
  try {
    const token = await getAccessToken();
    if (token) {
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A1:AZ?valueRenderOption=FORMATTED_VALUE`;
      const apiRes = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (apiRes.ok) {
        const json = await apiRes.json();
        const allRows: string[][] = json.values || [];
        const headerCount = 2; // Row 1 (Category Header) and Row 2 (Column Labels), data starts from Row 3
        const dataRows = allRows.slice(headerCount);
        const docRounds: Record<string, number> = {};
        const items: DocumentItem[] = [];

        // ตรวจสอบว่ามีคอลัมน์ "อีเมล" (Column F) หรือไม่
        const hasEmailCol = allRows[1] ? String(allRows[1][5] || '').includes('เมล') : (allRows[0]?.length >= 52 || allRows[1]?.length >= 52 || (allRows[2] && allRows[2].length >= 52));
        const off = hasEmailCol ? 1 : 0;

        dataRows.forEach((row, idx) => {
          const val = (i: number): string => (row && row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : '');
          const isRowEmpty = !row || row.every((c) => !c || String(c).trim() === '');
          if (isRowEmpty) return;

          const receiveNo = val(2);
          const email = off ? val(5) : '';
          const docRef = val(5 + off);
          const agency = val(6 + off);
          const docNo = val(7 + off);
          const docType = val(8 + off);

          // Defensive: Skip any accidental header rows
          if (receiveNo === 'เลขทะเบียนรับ' || val(1) === 'N/O' || docNo === 'เลขที่เอกสาร') {
            return;
          }

          const sheetRow = idx + 3; // Data row starts from Row 3 in Google Sheets

          // Document round identifier: Priority docNo -> receiveNo -> docRef -> rowId
          const docKey = (docNo && docNo !== '')
            ? docNo
            : (receiveNo && receiveNo !== '')
              ? `REC-${receiveNo}`
              : (docRef && docRef !== '')
                ? `REF-${docRef}`
                : `ROW-${sheetRow}`;

          docRounds[docKey] = (docRounds[docKey] || 0) + 1;
          const currentRound = docRounds[docKey];

          const pFinal = val(15 + off);
          const pAuto = val(13 + off);
          const dType = docType;
          let sType = val(17 + off);
          let qVal = val(18 + off);

          const isPrakaymas = pFinal.includes('ประกายมาศ') || pAuto.includes('ประกายมาศ');
          if (!isPrakaymas && !qVal && sType) {
            qVal = sType;
            sType = '';
          }

          const combined = `${pFinal} ${pAuto} ${dType} ${sType}`.toLowerCase();

          const department: DepartmentType = 'งานตรวจจ่าย';

          items.push({
            id: `doc-row-${sheetRow}`,
            rowId: sheetRow,
            ep: val(0),
            no: val(1),
            receiveNo: receiveNo,
            sender: val(3),
            phone: val(4),
            email: email,
            docRef: docRef,
            agency: agency,
            docNo: docNo,
            docType: docType,
            dateReceive: val(9 + off),
            dateDesk: val(10 + off),
            dateReturn: val(11 + off),
            returnStatus: val(12 + off),
            providerAuto: val(13 + off),
            providerChange: val(14 + off),
            providerFinal: val(15 + off),
            note: val(16 + off),
            subType: sType,
            qa: qVal,
            actionDate: val(19 + off),
            action: val(20 + off),
            status: val(21 + off),
            editGroup: val(22 + off),
            editDetail: val(23 + off),
            reviewReceiveDate: val(24 + off),
            reviewProvider: val(25 + off),
            reviewActionDate: val(26 + off),
            reviewStatus: val(27 + off),
            reviewEditType: val(28 + off),
            reviewEditDetail: val(29 + off),
            financeReceiveDate: val(30 + off),
            financePaymentType: val(31 + off),
            financePreparer: val(32 + off),
            financeUrgentCheck: val(33 + off),
            financeActionDate: val(34 + off),
            financeReviewDate: val(35 + off),
            disbursementDate: val(36 + off),
            disbursementPayer: val(37 + off),
            disbursementNotifyDate: val(38 + off),
            disbursementActivityStartDate: val(39 + off),
            disbursementActivityEndDate: val(40 + off),
            financeIssueDate: val(41 + off),
            financeIssueDetail: val(42 + off),
            budgetActionDate: val(43 + off),
            budgetFR: val(44 + off),
            budgetFC: val(45 + off),
            budgetPR: val(46 + off),
            budgetStatus: val(47 + off),
            budgetReceiveDate: val(48 + off),
            budgetCoverDate: val(49 + off),
            budgetDocSetDate: val(50 + off),
            department: department,
            round: currentRound,
          });
        });

        return items;
      } else if (apiRes.status === 401) {
        setCachedAccessToken(null);
      }
    }
  } catch (apiErr) {
    console.warn('Google Sheets API v4 fetch fallback to direct fetch:', apiErr);
  }

  // Primary live fetch: Google Sheets Direct CSV Export (instant, real-time, zero Google CDN cache delay)
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encodeURIComponent(sheetName)}&_t=${Date.now()}`;
    const csvRes = await fetch(csvUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (csvRes.ok) {
      const csvText = await csvRes.text();
      if (csvText && csvText.length > 50) {
        const rows: string[][] = [];
        let row: string[] = [];
        let cur = '';
        let inQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
          const ch = csvText[i];
          if (ch === '"' && inQuotes && csvText[i + 1] === '"') {
            cur += '"';
            i++;
          } else if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            row.push(cur.trim());
            cur = '';
          } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
            if (ch === '\r' && csvText[i + 1] === '\n') i++;
            row.push(cur.trim());
            rows.push(row);
            row = [];
            cur = '';
          } else {
            cur += ch;
          }
        }
        if (cur !== '' || row.length > 0) {
          row.push(cur.trim());
          rows.push(row);
        }

        if (rows.length >= 3) {
          const dataRows = rows.slice(2);
          const docRounds: Record<string, number> = {};
          const items: DocumentItem[] = [];

          // ตรวจสอบว่ามีคอลัมน์ "อีเมล" (Column F) หรือไม่
          const hasEmailCol = rows[1] ? String(rows[1][5] || '').includes('เมล') : (rows[0]?.length >= 52 || rows[1]?.length >= 52 || (rows[2] && rows[2].length >= 52));
          const off = hasEmailCol ? 1 : 0;

          dataRows.forEach((r, idx) => {
            const val = (i: number): string => (r && r[i] !== undefined && r[i] !== null ? String(r[i]).trim() : '');
            const isRowEmpty = !r || r.every((c) => !c || String(c).trim() === '');
            if (isRowEmpty) return;

            const receiveNo = val(2);
            const email = off ? val(5) : '';
            const docRef = val(5 + off);
            const agency = val(6 + off);
            const docNo = val(7 + off);
            const docType = val(8 + off);

            if (receiveNo === 'เลขทะเบียนรับ' || val(1) === 'N/O' || docNo === 'เลขที่เอกสาร') {
              return;
            }

            const sheetRow = idx + 3;
            const docKey = (docNo && docNo !== '')
              ? docNo
              : (receiveNo && receiveNo !== '')
                ? `REC-${receiveNo}`
                : (docRef && docRef !== '')
                  ? `REF-${docRef}`
                  : `ROW-${sheetRow}`;

            docRounds[docKey] = (docRounds[docKey] || 0) + 1;
            const currentRound = docRounds[docKey];

            const pFinal = val(15 + off);
            const pAuto = val(13 + off);
            const dType = docType;
            let sType = val(17 + off);
            let qVal = val(18 + off);

            const isPrakaymas = pFinal.includes('ประกายมาศ') || pAuto.includes('ประกายมาศ');
            if (!isPrakaymas && !qVal && sType) {
              qVal = sType;
              sType = '';
            }

            const department: DepartmentType = 'งานตรวจจ่าย';

            items.push({
              id: `doc-row-${sheetRow}`,
              rowId: sheetRow,
              ep: val(0),
              no: val(1),
              receiveNo: receiveNo,
              sender: val(3),
              phone: val(4),
              email: email,
              docRef: docRef,
              agency: agency,
              docNo: docNo,
              docType: docType,
              dateReceive: val(9 + off),
              dateDesk: val(10 + off),
              dateReturn: val(11 + off),
              returnStatus: val(12 + off),
              providerAuto: val(13 + off),
              providerChange: val(14 + off),
              providerFinal: val(15 + off),
              note: val(16 + off),
              subType: sType,
              qa: qVal,
              actionDate: val(19 + off),
              action: val(20 + off),
              status: val(21 + off),
              editGroup: val(22 + off),
              editDetail: val(23 + off),
              reviewReceiveDate: val(24 + off),
              reviewProvider: val(25 + off),
              reviewActionDate: val(26 + off),
              reviewStatus: val(27 + off),
              reviewEditType: val(28 + off),
              reviewEditDetail: val(29 + off),
              financeReceiveDate: val(30 + off),
              financePaymentType: val(31 + off),
              financePreparer: val(32 + off),
              financeUrgentCheck: val(33 + off),
              financeActionDate: val(34 + off),
              financeReviewDate: val(35 + off),
              disbursementDate: val(36 + off),
              disbursementPayer: val(37 + off),
              disbursementNotifyDate: val(38 + off),
              disbursementActivityStartDate: val(39 + off),
              disbursementActivityEndDate: val(40 + off),
              financeIssueDate: val(41 + off),
              financeIssueDetail: val(42 + off),
              budgetActionDate: val(43 + off),
              budgetFR: val(44 + off),
              budgetFC: val(45 + off),
              budgetPR: val(46 + off),
              budgetStatus: val(47 + off),
              budgetReceiveDate: val(48 + off),
              budgetCoverDate: val(49 + off),
              budgetDocSetDate: val(50 + off),
              department: department,
              round: currentRound,
            });
          });

          if (items.length > 0) {
            return items;
          }
        }
      }
    }
  } catch (csvErr) {
    console.warn('Direct CSV export fetch failed, trying GViz fallback:', csvErr);
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

  // ตรวจสอบว่ามีคอลัมน์ "อีเมล" (Column F) หรือไม่จากโครงสร้าง table cols
  const cols = json.table?.cols || [];
  const hasEmailCol = (cols[5] && String(cols[5].label || '').includes('เมล')) || (cols.length >= 52);
  const off = hasEmailCol ? 1 : 0;

  rows.forEach((r: any, idx: number) => {
    const val = (i: number): string => {
      const cell = r.c && r.c[i];
      if (!cell) return '';
      if (cell.f !== undefined && cell.f !== null) return String(cell.f).trim();
      if (cell.v !== undefined && cell.v !== null) return String(cell.v).trim();
      return '';
    };

    const receiveNo = val(2);
    const email = off ? val(5) : '';
    const docRef = val(5 + off);
    const agency = val(6 + off);
    const docNo = val(7 + off);
    const docType = val(8 + off);

    // Skip completely empty rows (if all cells are blank)
    const isRowEmpty = !r.c || r.c.every((c: any) => !c || (c.v === null && c.v === undefined && c.f === null && c.f === undefined) || (String(c.v ?? c.f ?? '').trim() === ''));
    if (isRowEmpty) {
      return;
    }

    // Defensive: Skip any accidental header rows
    if (receiveNo === 'เลขทะเบียนรับ' || val(1) === 'N/O' || docNo === 'เลขที่เอกสาร') {
      return;
    }

    // Since GViz already excludes header rows, idx 0 corresponds to Sheet Row 3
    const sheetRow = idx + 3; // Data row starts from Row 3 in Google Sheets
    const docKey = (docNo && docNo.trim() !== '')
      ? docNo.trim()
      : (receiveNo && receiveNo.trim() !== '')
        ? `REC-${receiveNo.trim()}`
        : (docRef && docRef.trim() !== '')
          ? `REF-${docRef.trim()}`
          : `ROW-${sheetRow}`;
    docRounds[docKey] = (docRounds[docKey] || 0) + 1;
    const currentRound = docRounds[docKey];

    const pFinal = val(15 + off);
    const pAuto = val(13 + off);
    const dType = docType;
    let sType = val(17 + off);
    let qVal = val(18 + off);

    const isPrakaymas = pFinal.includes('ประกายมาศ') || pAuto.includes('ประกายมาศ');
    if (!isPrakaymas && !qVal && sType) {
      qVal = sType;
      sType = '';
    }

    const department: DepartmentType = 'งานตรวจจ่าย';

    items.push({
      id: `doc-row-${sheetRow}`,
      rowId: sheetRow, // Exact row in Google Sheets (Row 3 onwards)
      ep: val(0),
      no: val(1),
      receiveNo: receiveNo,
      sender: val(3),
      phone: val(4),
      email: email,
      docRef: docRef,
      agency: agency,
      docNo: docNo,
      docType: docType,
      dateReceive: val(9 + off),
      dateDesk: val(10 + off),
      dateReturn: val(11 + off),
      returnStatus: val(12 + off),
      providerAuto: val(13 + off),
      providerChange: val(14 + off),
      providerFinal: val(15 + off),
      note: val(16 + off),
      subType: sType,
      qa: qVal,
      actionDate: val(19 + off),
      action: val(20 + off),
      status: val(21 + off),
      editGroup: val(22 + off),
      editDetail: val(23 + off),
      reviewReceiveDate: val(24 + off),
      reviewProvider: val(25 + off),
      reviewActionDate: val(26 + off),
      reviewStatus: val(27 + off),
      reviewEditType: val(28 + off),
      reviewEditDetail: val(29 + off),
      financeReceiveDate: val(30 + off),
      financePaymentType: val(31 + off),
      financePreparer: val(32 + off),
      financeUrgentCheck: val(33 + off),
      financeActionDate: val(34 + off),
      financeReviewDate: val(35 + off),
      disbursementDate: val(36 + off),
      disbursementPayer: val(37 + off),
      disbursementNotifyDate: val(38 + off),
      disbursementActivityStartDate: val(39 + off),
      disbursementActivityEndDate: val(40 + off),
      financeIssueDate: val(41 + off),
      financeIssueDetail: val(42 + off),
      budgetActionDate: val(43 + off),
      budgetFR: val(44 + off),
      budgetFC: val(45 + off),
      budgetPR: val(46 + off),
      budgetStatus: val(47 + off),
      budgetReceiveDate: val(48 + off),
      budgetCoverDate: val(49 + off),
      budgetDocSetDate: val(50 + off),
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
  action: 'updateDocument' | 'addRound' | 'createDocument' | 'updateReview' | 'updateFinance' | 'updateBudget',
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
      } catch (e) {
        console.warn('Google sign-in attempt for Sheets token notice:', e);
      }
    }

    if (!token) {
      return {
        success: false,
        error: 'ไม่มี Google OAuth access token สำหรับการบันทึกข้อมูลลง Google Sheet โดยตรง',
      };
    }

    // บันทึกเฉพาะงานสอบทาน (คอลัมน์ Y ถึง AD ในชีท DATA)
    if (action === 'updateReview') {
      let targetRow = item.rowId ? Number(item.rowId) : 0;

      // หากไม่มี rowId ให้ค้นหาแถวที่ถูกต้องในชีท DATA จากเลขทะเบียนรับ (receiveNo) หรือเลขที่เอกสาร (docNo)
      if (targetRow < 3 && (item.receiveNo || item.docNo)) {
        try {
          const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!C1:I?valueRenderOption=FORMATTED_VALUE`;
          const checkRes = await fetch(checkUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            const rows: string[][] = checkJson.values || [];
            for (let i = 2; i < rows.length; i++) {
              const r = rows[i];
              const recvMatch = item.receiveNo && r && r[0] && String(r[0]).trim() === String(item.receiveNo).trim();
              const docMatch = item.docNo && r && ((r[6] && String(r[6]).trim() === String(item.docNo).trim()) || (r[5] && String(r[5]).trim() === String(item.docNo).trim()));
              if (recvMatch || docMatch) {
                targetRow = i + 1;
                break;
              }
            }
          }
        } catch (findErr) {
          console.warn('Could not query sheet to locate row for updateReview:', targetRow, findErr);
        }
      }

      if (targetRow >= 3) {
        const range = `${sheetName}!Z${targetRow}:AE${targetRow}`;
        const reviewValues = [
          item.reviewReceiveDate ?? '',
          item.reviewProvider ?? '',
          item.reviewActionDate ?? '',
          item.reviewStatus ?? '',
          item.reviewEditType ?? '',
          item.reviewEditDetail ?? '',
        ];
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
        let res = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range,
            majorDimension: 'ROWS',
            values: [reviewValues],
          }),
        });

        if (res.status === 401) {
          try {
            const authRes = await googleSignIn();
            if (authRes?.accessToken) {
              token = authRes.accessToken;
              res = await fetch(url, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  range,
                  majorDimension: 'ROWS',
                  values: [reviewValues],
                }),
              });
            }
          } catch (reAuthErr) {
            console.error('Re-auth error (updateReview):', reAuthErr);
          }
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson?.error?.message || `Google Sheets API error ${res.status}`);
        }
        return { success: true };
      }
    }

    // บันทึกเฉพาะงานการเงิน (คอลัมน์ AE ถึง AQ ในชีท DATA)
    if (action === 'updateFinance') {
      let targetRow = item.rowId ? Number(item.rowId) : 0;

      // หากไม่มี rowId ให้ค้นหาแถวที่ถูกต้องในชีท DATA จากเลขทะเบียนรับ (receiveNo) หรือเลขที่เอกสาร (docNo)
      if (targetRow < 3 && (item.receiveNo || item.docNo)) {
        try {
          const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!C1:I?valueRenderOption=FORMATTED_VALUE`;
          const checkRes = await fetch(checkUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            const rows: string[][] = checkJson.values || [];
            for (let i = 2; i < rows.length; i++) {
              const r = rows[i];
              const recvMatch = item.receiveNo && r && r[0] && String(r[0]).trim() === String(item.receiveNo).trim();
              const docMatch = item.docNo && r && ((r[6] && String(r[6]).trim() === String(item.docNo).trim()) || (r[5] && String(r[5]).trim() === String(item.docNo).trim()));
              if (recvMatch || docMatch) {
                targetRow = i + 1;
                break;
              }
            }
          }
        } catch (findErr) {
          console.warn('Could not query sheet to locate row for updateFinance:', targetRow, findErr);
        }
      }

      if (targetRow >= 3) {
        const range = `${sheetName}!AF${targetRow}:AR${targetRow}`;
        const financeValues = [
          item.financeReceiveDate ?? '',
          item.financePaymentType ?? '',
          item.financePreparer ?? '',
          item.financeUrgentCheck ?? '',
          item.financeActionDate ?? '',
          item.financeReviewDate ?? '',
          item.disbursementDate ?? '',
          item.disbursementPayer ?? '',
          item.disbursementNotifyDate ?? '',
          item.disbursementActivityStartDate ?? '',
          item.disbursementActivityEndDate ?? '',
          item.financeIssueDate ?? '',
          item.financeIssueDetail ?? '',
        ];
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
        let res = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range,
            majorDimension: 'ROWS',
            values: [financeValues],
          }),
        });

        if (res.status === 401) {
          try {
            const authRes = await googleSignIn();
            if (authRes?.accessToken) {
              token = authRes.accessToken;
              res = await fetch(url, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  range,
                  majorDimension: 'ROWS',
                  values: [financeValues],
                }),
              });
            }
          } catch (reAuthErr) {
            console.error('Re-auth error (updateFinance):', reAuthErr);
          }
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson?.error?.message || `Google Sheets API error ${res.status}`);
        }
        return { success: true };
      }
    }

    // บันทึกเฉพาะงานงบประมาณ (คอลัมน์ AR ถึง AY ในชีท DATA)
    if (action === 'updateBudget') {
      let targetRow = item.rowId ? Number(item.rowId) : 0;

      if (targetRow < 3 && (item.receiveNo || item.docNo)) {
        try {
          const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!C1:I?valueRenderOption=FORMATTED_VALUE`;
          const checkRes = await fetch(checkUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            const rows: string[][] = checkJson.values || [];
            for (let i = 2; i < rows.length; i++) {
              const r = rows[i];
              const recvMatch = item.receiveNo && r && r[0] && String(r[0]).trim() === String(item.receiveNo).trim();
              const docMatch = item.docNo && r && ((r[6] && String(r[6]).trim() === String(item.docNo).trim()) || (r[5] && String(r[5]).trim() === String(item.docNo).trim()));
              if (recvMatch || docMatch) {
                targetRow = i + 1;
                break;
              }
            }
          }
        } catch (findErr) {
          console.warn('Could not query sheet to locate row for updateBudget:', targetRow, findErr);
        }
      }

      if (targetRow >= 3) {
        const range = `${sheetName}!AS${targetRow}:AZ${targetRow}`;
        const budgetValues = [
          item.budgetActionDate ?? '',
          item.budgetFR ?? '',
          item.budgetFC ?? '',
          item.budgetPR ?? '',
          item.budgetStatus ?? '',
          item.budgetReceiveDate ?? '',
          item.budgetCoverDate ?? '',
          item.budgetDocSetDate ?? '',
        ];
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
        let res = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range,
            majorDimension: 'ROWS',
            values: [budgetValues],
          }),
        });

        if (res.status === 401) {
          try {
            const authRes = await googleSignIn();
            if (authRes?.accessToken) {
              token = authRes.accessToken;
              res = await fetch(url, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  range,
                  majorDimension: 'ROWS',
                  values: [budgetValues],
                }),
              });
            }
          } catch (reAuthErr) {
            console.error('Re-auth error (updateBudget):', reAuthErr);
          }
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson?.error?.message || `Google Sheets API error ${res.status}`);
        }
        return { success: true };
      }
    }

    const rowValues = [
      item.ep ?? '',
      item.no ?? '',
      item.receiveNo ?? '',
      item.sender ?? '',
      item.phone ?? '',
      item.email ?? '',
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
      item.reviewReceiveDate ?? '',
      item.reviewProvider ?? '',
      item.reviewActionDate ?? '',
      item.reviewStatus ?? '',
      item.reviewEditType ?? '',
      item.reviewEditDetail ?? '',
      item.financeReceiveDate ?? '',
      item.financePaymentType ?? '',
      item.financePreparer ?? '',
      item.financeUrgentCheck ?? '',
      item.financeActionDate ?? '',
      item.financeReviewDate ?? '',
      item.disbursementDate ?? '',
      item.disbursementPayer ?? '',
      item.disbursementNotifyDate ?? '',
      item.disbursementActivityStartDate ?? '',
      item.disbursementActivityEndDate ?? '',
      item.financeIssueDate ?? '',
      item.financeIssueDetail ?? '',
      item.budgetActionDate ?? '',
      item.budgetFR ?? '',
      item.budgetFC ?? '',
      item.budgetPR ?? '',
      item.budgetStatus ?? '',
      item.budgetReceiveDate ?? '',
      item.budgetCoverDate ?? '',
      item.budgetDocSetDate ?? '',
    ];

    if (action === 'updateDocument') {
      let targetRow = item.rowId ? Number(item.rowId) : 0;

      // หากไม่มี rowId ให้ค้นหาแถวที่ถูกต้องในชีท DATA จากเลขทะเบียนรับ (receiveNo) หรือเลขที่เอกสาร (docNo)
      if (targetRow < 3 && (item.receiveNo || item.docNo)) {
        try {
          const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!C1:I?valueRenderOption=FORMATTED_VALUE`;
          const checkRes = await fetch(checkUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            const rows: string[][] = checkJson.values || [];
            // เริ่มหาจากแถวที่ 3 (index 2) ข้าม Header 2 แถวแรก
            for (let i = 2; i < rows.length; i++) {
              const r = rows[i];
              const recvMatch = item.receiveNo && r && r[0] && String(r[0]).trim() === String(item.receiveNo).trim();
              const docMatch = item.docNo && r && ((r[6] && String(r[6]).trim() === String(item.docNo).trim()) || (r[5] && String(r[5]).trim() === String(item.docNo).trim()));
              if (recvMatch || docMatch) {
                targetRow = i + 1; // Google Sheets row number (1-based)
                break;
              }
            }
          }
        } catch (findErr) {
          console.warn('Could not query sheet to locate row, using targetRow:', targetRow, findErr);
        }
      }

      if (targetRow >= 3) {
        let isSuccess = false;

        // 1. บันทึกข้อมูลงานตรวจจ่ายลงคอลัมน์ S ถึง Y (เฉพาะเมื่อมีข้อมูลการตรวจจ่ายอย่างน้อย 1 ฟิลด์ ป้องกันการเขียนทับด้วยค่าว่าง)
        const hasInspectionData = Boolean(
          (item.actionDate && item.actionDate.trim() !== '') ||
          (item.action && item.action.trim() !== '') ||
          (item.status && item.status.trim() !== '') ||
          (item.qa && item.qa.trim() !== '') ||
          (item.subType && item.subType.trim() !== '') ||
          (item.editGroup && item.editGroup.trim() !== '') ||
          (item.editDetail && item.editDetail.trim() !== '')
        );

        if (hasInspectionData) {
          const rxRange = `${sheetName}!S${targetRow}:Y${targetRow}`;
          const rxValues = [
            item.subType ?? '',
            item.qa ?? '',
            item.actionDate ?? '',
            item.action ?? '',
            item.status ?? '',
            item.editGroup ?? '',
            item.editDetail ?? '',
          ];
          const rxUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(rxRange)}?valueInputOption=USER_ENTERED`;
          let res = await fetch(rxUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: rxRange,
              majorDimension: 'ROWS',
              values: [rxValues],
            }),
          });

          if (res.status === 401) {
            try {
              const authRes = await googleSignIn();
              if (authRes?.accessToken) {
                token = authRes.accessToken;
                res = await fetch(rxUrl, {
                  method: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    range: rxRange,
                    majorDimension: 'ROWS',
                    values: [rxValues],
                  }),
                });
              }
            } catch (reAuthErr) {
              console.error('Re-auth error (updateDocument rx):', reAuthErr);
            }
          }

          if (res.ok) {
            isSuccess = true;
          }
        }

        // 2. หากเป็นการแก้ไขข้อมูลทั่วไปจาก EditDocumentModal ให้อัปเดตเฉพาะช่วง A ถึง R (ไม่แตะต้องคอลัมน์ S ถึง Y ของงานตรวจจ่าย)
        if (item.agency && item.docRef && item.docNo && !hasInspectionData) {
          const arRange = `${sheetName}!A${targetRow}:R${targetRow}`;
          const arValues = rowValues.slice(0, 18);
          const arUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(arRange)}?valueInputOption=USER_ENTERED`;
          const arRes = await fetch(arUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: arRange,
              majorDimension: 'ROWS',
              values: [arValues],
            }),
          });
          if (arRes.ok) {
            isSuccess = true;
          }
        }

        if (isSuccess) {
          return { success: true };
        }
      }
    }

    // Append row for addRound or createDocument (หรือกรณีไม่พบแถวเดิม)
    const range = `${sheetName}!A:AZ`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    let res = await fetch(url, {
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

    if (res.status === 401) {
      try {
        const authRes = await googleSignIn();
        if (authRes?.accessToken) {
          token = authRes.accessToken;
          res = await fetch(url, {
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
        }
      } catch (reAuthErr) {
        console.error('Re-auth error on append:', reAuthErr);
      }
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Google Sheets API error ${res.status}`);
    }
    return { success: true };
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
export async function syncToGas(
  action: 'updateDocument' | 'addRound' | 'createDocument' | 'updateReview' | 'updateFinance' | 'updateBudget',
  data: any
): Promise<boolean> {
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

/**
 * บันทึกข้อมูลหลายรายการลง Google Sheet พร้อมกัน (Batch Update)
 */
export async function batchSaveToGoogleSheet(
  items: DocumentItem[],
  onProgress?: (done: number, total: number) => void,
  sheetId = INITIAL_SHEET_ID,
  sheetName = INITIAL_SHEET_NAME
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  if (!items || items.length === 0) {
    return { success: true, updatedCount: 0 };
  }

  // พยายามใช้ Google Sheets REST API v4 batchUpdate หากมี token
  try {
    let token = await getAccessToken();
    if (token) {
      const dataEntries: { range: string; values: any[][] }[] = [];

      for (const item of items) {
        const targetRow = item.rowId ? Number(item.rowId) : 0;
        if (targetRow >= 3) {
          // บันทึกเฉพาะข้อมูลรับเอกสารงานสอบทาน (คอลัมน์ Z และ AA) เพื่อป้องกันการเขียนทับคอลัมน์อื่น
          dataEntries.push({
            range: `${sheetName}!Z${targetRow}:AA${targetRow}`,
            values: [[item.reviewReceiveDate ?? '', item.reviewProvider ?? '']],
          });
        }
      }

      if (dataEntries.length > 0) {
        const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;
        let batchRes = await fetch(batchUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            valueInputOption: 'USER_ENTERED',
            data: dataEntries,
          }),
        });

        if (batchRes.status === 401) {
          try {
            const authRes = await googleSignIn();
            if (authRes?.accessToken) {
              token = authRes.accessToken;
              batchRes = await fetch(batchUrl, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  valueInputOption: 'USER_ENTERED',
                  data: dataEntries,
                }),
              });
            }
          } catch (reAuthErr) {
            console.error('Re-auth error in batchSaveToGoogleSheet:', reAuthErr);
          }
        }

        if (batchRes.ok) {
          if (onProgress) onProgress(items.length, items.length);
          return { success: true, updatedCount: items.length };
        }
      }
    }
  } catch (directBatchErr) {
    console.warn('Direct batch update fallback to sequential sync:', directBatchErr);
  }

  // Fallback: อัปเดตทีละรายการผ่าน syncToGas พร้อมนับ progress (สำหรับรับเอกสารงานสอบทาน)
  let successCount = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const ok = await syncToGas('updateReview', item);
      if (ok) successCount++;
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
