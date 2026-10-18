import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-sheets-dev-plugin',
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
                    const authHeader = req.headers.authorization;

                    if (authHeader && data) {
                      const spreadsheetId = '16wNQfdZE6sNZBsiSuRDUkqUP3FpJJh18u7TaURqzmzk';
                      const sheetName = 'DATA';
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
                        // งานสอบทาน (คอลัมน์ Y ถึง AD ในหน้า DATA)
                        data.reviewReceiveDate ?? '',
                        data.reviewProvider ?? '',
                        data.reviewActionDate ?? '',
                        data.reviewStatus ?? '',
                        data.reviewEditType ?? '',
                        data.reviewEditDetail ?? '',
                      ];

                      if (action === 'updateReview' && data.rowId && Number(data.rowId) >= 3) {
                        // บันทึกเฉพาะช่อง Y:AD สำหรับงานสอบทาน ในชีท DATA
                        const reviewRange = `${sheetName}!Y${data.rowId}:AD${data.rowId}`;
                        const reviewValues = [
                          data.reviewReceiveDate ?? '',
                          data.reviewProvider ?? '',
                          data.reviewActionDate ?? '',
                          data.reviewStatus ?? '',
                          data.reviewEditType ?? '',
                          data.reviewEditDetail ?? '',
                        ];
                        await fetch(
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
                        ).catch((e) => console.error('Dev proxy sheet error (updateReview):', e));
                      } else if (action === 'updateDocument' && data.rowId && Number(data.rowId) >= 3) {
                        const range = `${sheetName}!A${data.rowId}:AD${data.rowId}`;
                        await fetch(
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
                        ).catch((e) => console.error('Dev proxy sheet error:', e));
                      } else {
                        const range = `${sheetName}!A:AD`;
                        await fetch(
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
                        ).catch((e) => console.error('Dev proxy sheet error:', e));
                      }
                    }

                    res.writeHead(200, {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    });
                    res.end(JSON.stringify({ success: true, message: 'Updated', data: parsed.data }));
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
              return res.end(JSON.stringify({ status: 'ok' }));
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
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
