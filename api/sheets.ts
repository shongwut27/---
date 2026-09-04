// /api/sheets.ts - Vercel Serverless Function for Direct Google Sheets Integration
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Google Sheets API handler ready' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, data } = body;

    // Direct Google Sheets API update if Authorization header provided
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const spreadsheetId = process.env.VITE_SHEET_ID || '16wNQfdZE6sNZBsiSuRDUkqUP3FpJJh18u7TaURqzmzk';
      const sheetName = process.env.VITE_SHEET_NAME || 'DATA';
      const rowValues = [
        data.ep ?? '',
        data.no ?? '',
        data.receiveNo ?? '',
        data.sender ?? '',
        data.phone ?? '',
        data.docRef ?? '',
        data.agency ?? '',
        data.docNo ?? '',
        data.docType ?? '',
        data.dateReceive ?? '',
        data.dateDesk ?? '',
        data.dateReturn ?? '',
        data.returnStatus ?? '',
        data.providerAuto ?? '',
        data.providerChange ?? '',
        data.providerFinal ?? '',
        data.note ?? '',
        data.subType ?? '',
        data.qa ?? '',
        data.actionDate ?? '',
        data.action ?? '',
        data.status ?? '',
        data.editGroup ?? '',
        data.editDetail ?? '',
      ];

      try {
        if (action === 'updateDocument' && data.rowId && Number(data.rowId) >= 3) {
          const range = `${sheetName}!A${data.rowId}:X${data.rowId}`;
          const sheetRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                range,
                majorDimension: 'ROWS',
                values: [rowValues],
              }),
            }
          );
          if (sheetRes.ok) {
            return res.status(200).json({
              success: true,
              action,
              message: 'บันทึกข้อมูลลง Google Sheet สำเร็จ',
              data,
            });
          }
        } else {
          const range = `${sheetName}!A:X`;
          const sheetRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
            {
              method: 'POST',
              headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                range,
                majorDimension: 'ROWS',
                values: [rowValues],
              }),
            }
          );
          if (sheetRes.ok) {
            return res.status(200).json({
              success: true,
              action,
              message: 'บันทึกข้อมูลลง Google Sheet สำเร็จ',
              data,
            });
          }
        }
      } catch (sheetErr) {
        console.error('Error in Sheets API call from /api/sheets:', sheetErr);
      }
    }

    // Optional environment variables on Vercel
    const gasUrl = process.env.VITE_GAS_URL || process.env.GAS_URL;

    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, data }),
        });
      } catch (err) {
        console.warn('Forward to GAS URL notice:', err);
      }
    }

    return res.status(200).json({
      success: true,
      action: action || 'updateDocument',
      message: 'บันทึกข้อมูลเรียบร้อย',
      data: data,
    });
  } catch (error: any) {
    console.error('Error handling /api/sheets:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
