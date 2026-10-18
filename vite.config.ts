import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const SUPABASE_URL = 'https://xuyyzwejrzhrymqhecsm.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eXl6d2VqcnpocnltcWhlY3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMjM2MjgsImV4cCI6MjEwNjg5OTYyOH0.NWOlOkk5l7STSG5xlq5cztjM9L-77JUgMTttsdnFcG8';
const SUPABASE_TABLE = '2570-ระบบติดตามเอกสาร';

function toNullable(val?: string | null): string | null {
  if (val === undefined || val === null) return null;
  const trimmed = String(val).trim();
  return trimmed === '' ? null : trimmed;
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-supabase-dev-plugin',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/api/sheets')) {
              if (req.method === 'OPTIONS') {
                res.writeHead(200, {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                });
                return res.end();
              }
              if (req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => {
                  body += chunk;
                });
                req.on('end', async () => {
                  try {
                    const parsed = JSON.parse(body || '{}');
                    const { action, data } = parsed;
                    const baseEndpoint = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}`;
                    const headers = {
                      apikey: SUPABASE_ANON_KEY,
                      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                      'Content-Type': 'application/json',
                      Prefer: 'return=representation',
                    };

                    if (data && data.id) {
                      if (action === 'updateReview') {
                        await fetch(`${baseEndpoint}?id=eq.${encodeURIComponent(data.id)}`, {
                          method: 'PATCH',
                          headers,
                          body: JSON.stringify({
                            'วันที่รับ_สอบทาน': toNullable(data.reviewReceiveDate),
                            'ผู้ให้บริการ_สอบทาน': toNullable(data.reviewProvider),
                            'วันทำรายการ_สอบทาน': toNullable(data.reviewActionDate),
                            'สถานะ_สอบทาน': toNullable(data.reviewStatus),
                            'ประเภทแก้ไข': toNullable(data.reviewEditType),
                            'หมายเหตุ_สอบทาน': toNullable(data.reviewEditDetail),
                          }),
                        }).catch((e) => console.error('Dev proxy supabase error (updateReview):', e));
                      } else if (action === 'updateFinance') {
                        await fetch(`${baseEndpoint}?id=eq.${encodeURIComponent(data.id)}`, {
                          method: 'PATCH',
                          headers,
                          body: JSON.stringify({
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
                          }),
                        }).catch((e) => console.error('Dev proxy supabase error (updateFinance):', e));
                      } else if (action === 'updateBudget') {
                        await fetch(`${baseEndpoint}?id=eq.${encodeURIComponent(data.id)}`, {
                          method: 'PATCH',
                          headers,
                          body: JSON.stringify({
                            'วันทำรายการ_ลงนาม': toNullable(data.budgetActionDate),
                            'FR': toNullable(data.budgetFR),
                            'FC': toNullable(data.budgetFC),
                            'PR': toNullable(data.budgetPR),
                            'สถานะ_งบประมาณ': toNullable(data.budgetStatus),
                            'วันที่รับ_งบประมาณ': toNullable(data.budgetReceiveDate),
                            'วันที่ตามใบปะหน้า': toNullable(data.budgetCoverDate),
                            'วันที่ตามชุดเอกสาร': toNullable(data.budgetDocSetDate),
                          }),
                        }).catch((e) => console.error('Dev proxy supabase error (updateBudget):', e));
                      }
                    }

                    res.writeHead(200, {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    });
                    res.end(JSON.stringify({ success: true, message: 'Updated Supabase', data: parsed.data }));
                  } catch {
                    res.writeHead(200, {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    });
                    res.end(JSON.stringify({ success: true }));
                  }
                });
                return;
              }
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              return res.end(JSON.stringify({ status: 'ok', table: SUPABASE_TABLE }));
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
