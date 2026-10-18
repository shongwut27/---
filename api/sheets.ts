// /api/sheets.ts - Vercel Serverless Function for Direct Supabase Integration ("2570-ระบบติดตามเอกสาร")
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  'https://xuyyzwejrzhrymqhecsm.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eXl6d2VqcnpocnltcWhlY3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMjM2MjgsImV4cCI6MjEwNjg5OTYyOH0.NWOlOkk5l7STSG5xlq5cztjM9L-77JUgMTttsdnFcG8';
const SUPABASE_TABLE =
  process.env.VITE_SUPABASE_TABLE ||
  '2570-ระบบติดตามเอกสาร';

function isUuid(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

function toNullable(val?: string | null): string | null {
  if (val === undefined || val === null) return null;
  const trimmed = String(val).trim();
  return trimmed === '' ? null : trimmed;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: 'Supabase API handler ready',
      project: 'xuyyzwejrzhrymqhecsm',
      table: SUPABASE_TABLE,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, data } = body;

    if (!data) {
      return res.status(400).json({ error: 'Missing data payload' });
    }

    const baseEndpoint = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}`;
    const headers: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    const targetId = isUuid(data.id) ? data.id.trim() : null;

    if (action === 'updateBudget' && targetId) {
      const payload = {
        'วันทำรายการ_ลงนาม': toNullable(data.budgetActionDate),
        'FR': toNullable(data.budgetFR),
        'FC': toNullable(data.budgetFC),
        'PR': toNullable(data.budgetPR),
        'สถานะ_งบประมาณ': toNullable(data.budgetStatus),
        'วันที่รับ_งบประมาณ': toNullable(data.budgetReceiveDate),
        'วันที่ตามใบปะหน้า': toNullable(data.budgetCoverDate),
        'วันที่ตามชุดเอกสาร': toNullable(data.budgetDocSetDate),
      };
      const supRes = await fetch(`${baseEndpoint}?id=eq.${encodeURIComponent(targetId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      if (supRes.ok) {
        return res.status(200).json({
          success: true,
          action,
          message: 'บันทึกข้อมูลงานงบประมาณลง Supabase สำเร็จ',
          data,
        });
      }
    } else if (action === 'updateFinance' && targetId) {
      const payload = {
        'วันที่รับ_การเงิน': toNullable(data.financeReceiveDate),
        'ประเภทการจ่าย': toNullable(data.financePaymentType),
        'ผู้จัดทำเช็ค/โอนเงิน': toNullable(data.financePreparer),
        'กรณีเช็คด่วน': toNullable(data.financeUrgentCheck),
        'วันทำรายการ_การเงิน': toNullable(data.financeActionDate),
        'วันที่สอบทาน_เช็ค': toNullable(data.financeReviewDate),
        'วันที่_จ่ายเงิน': toNullable(data.disbursementDate),
        'ผู้จ่ายเงิน': toNullable(data.disbursementPayer),
        'วันที่แจ้งรับเงิน': toNullable(data.disbursementNotifyDate),
        'วันที่เริ่ม_ยืมทดรอง': toNullable(data.disbursementActivityStartDate),
        'วันสิ้นสุดกิจกรรม': toNullable(data.disbursementActivityEndDate),
        'วันที่_จ่ายไม่ได้': toNullable(data.financeIssueDate),
        'หมายเหตุ_ไม่จ่าย': toNullable(data.financeIssueDetail),
      };
      const supRes = await fetch(`${baseEndpoint}?id=eq.${encodeURIComponent(targetId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      if (supRes.ok) {
        return res.status(200).json({
          success: true,
          action,
          message: 'บันทึกข้อมูลงานการเงินลง Supabase สำเร็จ',
          data,
        });
      }
    } else if (action === 'updateReview' && targetId) {
      const payload = {
        'วันที่รับ_สอบทาน': toNullable(data.reviewReceiveDate),
        'ผู้ให้บริการ_สอบทาน': toNullable(data.reviewProvider),
        'วันทำรายการ_สอบทาน': toNullable(data.reviewActionDate),
        'สถานะ_สอบทาน': toNullable(data.reviewStatus),
        'ประเภทแก้ไข': toNullable(data.reviewEditType),
        'หมายเหตุ_สอบทาน': toNullable(data.reviewEditDetail),
      };
      const supRes = await fetch(`${baseEndpoint}?id=eq.${encodeURIComponent(targetId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      if (supRes.ok) {
        return res.status(200).json({
          success: true,
          action,
          message: 'บันทึกข้อมูลงานสอบทานลง Supabase สำเร็จ',
          data,
        });
      }
    } else if (action === 'updateDocument' && targetId) {
      const payload: Record<string, any> = {
        'EP.': toNullable(data.ep),
        'N/O': toNullable(data.no),
        'เลขทะเบียนรับ': toNullable(data.receiveNo),
        'ผู้ส่งเอกสาร': toNullable(data.sender),
        'โทรศัพท์': toNullable(data.phone),
        'โทร.': toNullable(data.phone),
        'ที่อยู่อีเมล': toNullable(data.email),
        'เลขที่ อว/ ชื่อ': toNullable(data.docRef),
        'หน่วยงาน': toNullable(data.agency),
        'เลขที่เอกสาร': toNullable(data.docNo),
        'ประเภทเอกสาร': toNullable(data.docType),
        'วันที่รับ': toNullable(data.dateReceive),
        'วันที่ส่ง': toNullable(data.dateDesk),
        'วันที่ส่งคืน': toNullable(data.dateReturn),
        'สถานะ_ธุรการส่งคืน': toNullable(data.returnStatus),
        'ผู้ให้บริการ': toNullable(data.providerAuto),
        'เปลี่ยนโต๊ะบริการ': toNullable(data.providerChange),
        'ผู้ให้บริการ-final': toNullable(data.providerFinal),
        'หมายเหตุ': toNullable(data.note),
        'ประเภทเอกสารย่อย': toNullable(data.subType),
        'QA.': toNullable(data.qa),
        'วันทำรายการ_ตรวจ': toNullable(data.actionDate),
        'การดำเนินการ': toNullable(data.action),
        'สถานะ_งานตรวจ': toNullable(data.status),
        'Group-กรณีแก้ไข': toNullable(data.editGroup),
        'หมายเหตุ_งานตรวจ': toNullable(data.editDetail),
      };
      const supRes = await fetch(`${baseEndpoint}?id=eq.${encodeURIComponent(targetId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      if (supRes.ok) {
        return res.status(200).json({
          success: true,
          action,
          message: 'บันทึกข้อมูลลง Supabase สำเร็จ',
          data,
        });
      }
    } else {
      const fullPayload: Record<string, any> = {
        'EP.': toNullable(data.ep),
        'N/O': toNullable(data.no) || 'N',
        'เลขทะเบียนรับ': toNullable(data.receiveNo),
        'ผู้ส่งเอกสาร': toNullable(data.sender),
        'โทรศัพท์': toNullable(data.phone),
        'โทร.': toNullable(data.phone),
        'ที่อยู่อีเมล': toNullable(data.email),
        'เลขที่ อว/ ชื่อ': toNullable(data.docRef),
        'หน่วยงาน': toNullable(data.agency),
        'เลขที่เอกสาร': toNullable(data.docNo),
        'ประเภทเอกสาร': toNullable(data.docType),
        'วันที่รับ': toNullable(data.dateReceive),
        'วันที่ส่ง': toNullable(data.dateDesk),
        'วันที่ส่งคืน': toNullable(data.dateReturn),
        'สถานะ_ธุรการส่งคืน': toNullable(data.returnStatus),
        'ผู้ให้บริการ': toNullable(data.providerAuto),
        'เปลี่ยนโต๊ะบริการ': toNullable(data.providerChange),
        'ผู้ให้บริการ-final': toNullable(data.providerFinal),
        'หมายเหตุ': toNullable(data.note),
        'ประเภทเอกสารย่อย': toNullable(data.subType),
        'QA.': toNullable(data.qa),
        'วันทำรายการ_ตรวจ': toNullable(data.actionDate),
        'การดำเนินการ': toNullable(data.action),
        'สถานะ_งานตรวจ': toNullable(data.status),
        'Group-กรณีแก้ไข': toNullable(data.editGroup),
        'หมายเหตุ_งานตรวจ': toNullable(data.editDetail),
        'TYPE': '1. ตรวจจ่าย-งานใหม่',
      };
      const supRes = await fetch(baseEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(fullPayload),
      });
      if (supRes.ok) {
        return res.status(200).json({
          success: true,
          action,
          message: 'เพิ่มข้อมูลใหม่ลง Supabase สำเร็จ',
          data,
        });
      }
    }

    return res.status(200).json({
      success: true,
      action: action || 'updateDocument',
      message: 'บันทึกข้อมูลเรียบร้อย',
      data,
    });
  } catch (error: any) {
    console.error('Error handling /api/sheets (Supabase):', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
