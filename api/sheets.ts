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
        data.email ?? '',
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
        data.reviewReceiveDate ?? '',
        data.reviewProvider ?? '',
        data.reviewActionDate ?? '',
        data.reviewStatus ?? '',
        data.reviewEditType ?? '',
        data.reviewEditDetail ?? '',
        data.financeReceiveDate ?? '',
        data.financePaymentType ?? '',
        data.financePreparer ?? '',
        data.financeUrgentCheck ?? '',
        data.financeActionDate ?? '',
        data.financeReviewDate ?? '',
        data.disbursementDate ?? '',
        data.disbursementPayer ?? '',
        data.disbursementNotifyDate ?? '',
        data.disbursementActivityStartDate ?? '',
        data.disbursementActivityEndDate ?? '',
        data.financeIssueDate ?? '',
        data.financeIssueDetail ?? '',
        data.budgetActionDate ?? '',
        data.budgetFR ?? '',
        data.budgetFC ?? '',
        data.budgetPR ?? '',
        data.budgetStatus ?? '',
        data.budgetReceiveDate ?? '',
        data.budgetCoverDate ?? '',
        data.budgetDocSetDate ?? '',
      ];

      try {
        if (action === 'updateBudget' && data.rowId && Number(data.rowId) >= 3) {
          const budgetRange = `${sheetName}!AS${data.rowId}:AZ${data.rowId}`;
          const budgetValues = [
            data.budgetActionDate ?? '',
            data.budgetFR ?? '',
            data.budgetFC ?? '',
            data.budgetPR ?? '',
            data.budgetStatus ?? '',
            data.budgetReceiveDate ?? '',
            data.budgetCoverDate ?? '',
            data.budgetDocSetDate ?? '',
          ];
          const sheetRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(budgetRange)}?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                range: budgetRange,
                majorDimension: 'ROWS',
                values: [budgetValues],
              }),
            }
          );
          if (sheetRes.ok) {
            return res.status(200).json({
              success: true,
              action,
              message: 'บันทึกข้อมูลงานงบประมาณลง Google Sheet (DATA ช่อง AS:AZ) สำเร็จ',
              data,
            });
          }
        } else if (action === 'updateFinance' && data.rowId && Number(data.rowId) >= 3) {
          const financeRange = `${sheetName}!AF${data.rowId}:AR${data.rowId}`;
          const financeValues = [
            data.financeReceiveDate ?? '',
            data.financePaymentType ?? '',
            data.financePreparer ?? '',
            data.financeUrgentCheck ?? '',
            data.financeActionDate ?? '',
            data.financeReviewDate ?? '',
            data.disbursementDate ?? '',
            data.disbursementPayer ?? '',
            data.disbursementNotifyDate ?? '',
            data.disbursementActivityStartDate ?? '',
            data.disbursementActivityEndDate ?? '',
            data.financeIssueDate ?? '',
            data.financeIssueDetail ?? '',
          ];
          const sheetRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(financeRange)}?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                range: financeRange,
                majorDimension: 'ROWS',
                values: [financeValues],
              }),
            }
          );
          if (sheetRes.ok) {
            return res.status(200).json({
              success: true,
              action,
              message: 'บันทึกข้อมูลงานการเงินลง Google Sheet (DATA ช่อง AF:AR) สำเร็จ',
              data,
            });
          }
        } else if (action === 'updateReview' && data.rowId && Number(data.rowId) >= 3) {
          const reviewRange = `${sheetName}!Z${data.rowId}:AE${data.rowId}`;
          const reviewValues = [
            data.reviewReceiveDate ?? '',
            data.reviewProvider ?? '',
            data.reviewActionDate ?? '',
            data.reviewStatus ?? '',
            data.reviewEditType ?? '',
            data.reviewEditDetail ?? '',
          ];
          const sheetRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(reviewRange)}?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                range: reviewRange,
                majorDimension: 'ROWS',
                values: [reviewValues],
              }),
            }
          );
          if (sheetRes.ok) {
            return res.status(200).json({
              success: true,
              action,
              message: 'บันทึกข้อมูลงานสอบทานลง Google Sheet (DATA ช่อง Z:AE) สำเร็จ',
              data,
            });
          }
        } else if (action === 'updateDocument' && data.rowId && Number(data.rowId) >= 3) {
          const hasInspectionData = Boolean(
            (data.actionDate && String(data.actionDate).trim() !== '') ||
            (data.action && String(data.action).trim() !== '') ||
            (data.status && String(data.status).trim() !== '') ||
            (data.qa && String(data.qa).trim() !== '') ||
            (data.subType && String(data.subType).trim() !== '') ||
            (data.editGroup && String(data.editGroup).trim() !== '') ||
            (data.editDetail && String(data.editDetail).trim() !== '')
          );

          if (hasInspectionData) {
            // บันทึกข้อมูลงานตรวจจ่ายลงคอลัมน์ S:Y (ประเภทเอกสารย่อย ถึง รายละเอียดกรณีแก้ไข)
            const inspectRange = `${sheetName}!S${data.rowId}:Y${data.rowId}`;
            const inspectValues = [
              data.subType ?? '',
              data.qa ?? '',
              data.actionDate ?? '',
              data.action ?? '',
              data.status ?? '',
              data.editGroup ?? '',
              data.editDetail ?? '',
            ];
            const sheetRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(inspectRange)}?valueInputOption=USER_ENTERED`,
              {
                method: 'PUT',
                headers: {
                  Authorization: authHeader,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  range: inspectRange,
                  majorDimension: 'ROWS',
                  values: [inspectValues],
                }),
              }
            );

            if (sheetRes.ok) {
              return res.status(200).json({
                success: true,
                action,
                message: 'บันทึกข้อมูลลง Google Sheet (DATA ช่อง S:Y) สำเร็จ',
                data,
              });
            }
          } else if (data.agency && data.docRef && data.docNo) {
            // กรณีแก้ไขข้อมูลทั่วไปจาก EditDocumentModal ให้อัปเดตเฉพาะช่วง A ถึง R
            const arRange = `${sheetName}!A${data.rowId}:R${data.rowId}`;
            const arValues = rowValues.slice(0, 18);
            const sheetRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(arRange)}?valueInputOption=USER_ENTERED`,
              {
                method: 'PUT',
                headers: {
                  Authorization: authHeader,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  range: arRange,
                  majorDimension: 'ROWS',
                  values: [arValues],
                }),
              }
            );
            if (sheetRes.ok) {
              return res.status(200).json({
                success: true,
                action,
                message: 'บันทึกแก้ไขข้อมูลเอกสารทั่วไป (DATA ช่อง A:R) สำเร็จ',
                data,
              });
            }
          }
        } else {
          const range = `${sheetName}!A:AZ`;
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
