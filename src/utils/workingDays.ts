/**
 * Utility for calculating working days in Thailand (excluding weekends and Thai public holidays)
 */

// Known Thai Public Holidays (YYYY-MM-DD) including Buddhist holidays & observed holidays
const THAI_PUBLIC_HOLIDAYS = new Set<string>([
  // 2024
  '2024-01-01', '2024-01-02', '2024-02-26', '2024-04-08', '2024-04-13',
  '2024-04-14', '2024-04-15', '2024-04-16', '2024-05-01', '2024-05-06',
  '2024-05-22', '2024-06-03', '2024-07-20', '2024-07-22', '2024-07-28',
  '2024-07-29', '2024-08-12', '2024-10-14', '2024-10-23', '2024-12-05',
  '2024-12-10', '2024-12-31',

  // 2025
  '2025-01-01', '2025-01-02', '2025-02-12', '2025-04-06', '2025-04-07',
  '2025-04-13', '2025-04-14', '2025-04-15', '2025-04-16', '2025-05-01',
  '2025-05-05', '2025-05-12', '2025-06-03', '2025-07-10', '2025-07-11',
  '2025-07-28', '2025-08-12', '2025-10-13', '2025-10-23', '2025-12-05',
  '2025-12-10', '2025-12-31',

  // 2026 (BE 2569)
  '2026-01-01', // วันขึ้นปีใหม่
  '2026-01-02', // วันหยุดพิเศษปีใหม่
  '2026-03-03', // วันมาฆบูชา
  '2026-04-06', // วันจักรี
  '2026-04-13', // วันสงกรานต์
  '2026-04-14', // วันสงกรานต์
  '2026-04-15', // วันสงกรานต์
  '2026-04-16', // วันหยุดชดเชยวันสงกรานต์
  '2026-05-01', // วันแรงงานแห่งชาติ
  '2026-05-04', // วันฉัตรมงคล
  '2026-06-01', // วันหยุดชดเชยวันวิสาขบูชา (ตรงกับ 31 พ.ค.)
  '2026-06-03', // วันเฉลิมพระชนมพรรษา พระราชินี
  '2026-07-28', // วันเฉลิมพระชนมพรรษา ร.10
  '2026-07-29', // วันอาสาฬหบูชา
  '2026-07-30', // วันเข้าพรรษา
  '2026-08-12', // วันแม่แห่งชาติ
  '2026-10-13', // วันนวมินทรมหาราช
  '2026-10-23', // วันปิยมหาราช
  '2026-12-07', // วันหยุดชดเชยวันพ่อแห่งชาติ (ตรงกับ 5 ธ.ค.)
  '2026-12-10', // วันรัฐธรรมนูญ
  '2026-12-31', // วันสิ้นปี

  // 2027
  '2027-01-01', '2027-02-21', '2027-02-22', '2027-04-06', '2027-04-13',
  '2027-04-14', '2027-04-15', '2027-05-01', '2027-05-04', '2027-05-20',
  '2027-06-03', '2027-07-18', '2027-07-19', '2027-07-28', '2027-08-12',
  '2027-10-13', '2027-10-25', '2027-12-06', '2027-12-10', '2027-12-31',
]);

/**
 * Check if a given date is a Thai public holiday
 */
export function isThaiHoliday(date: Date): boolean {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const key = `${y}-${m}-${d}`;

  if (THAI_PUBLIC_HOLIDAYS.has(key)) return true;

  // Fixed recurring annual dates
  const md = `${m}-${d}`;
  const annualFixed = [
    '01-01', // New Year
    '04-06', // Chakri Day
    '04-13', // Songkran
    '04-14', // Songkran
    '04-15', // Songkran
    '05-01', // Labor Day
    '05-04', // Coronation Day
    '06-03', // Queen's Birthday
    '07-28', // King's Birthday (Rama X)
    '08-12', // Mother's Day
    '10-13', // Navamindra Day
    '10-23', // Chulalongkorn Day
    '12-05', // Father's Day
    '12-10', // Constitution Day
    '12-31', // New Year's Eve
  ];

  return annualFixed.includes(md);
}

/**
 * Parses Thai date string (e.g., "3/7/2569 8:30:16" or "03/07/2026" or ISO) into Date object
 */
export function parseThaiDate(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : dateStr;
  }

  const str = String(dateStr).trim();
  if (!str || str === '-' || str === 'ไม่มี') return null;

  // Check for ISO or YYYY-MM-DD
  if (str.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // Matches D/M/YYYY or D/M/YY with optional time
  const match = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    let year = parseInt(match[3], 10);

    if (year < 100) {
      year = year >= 50 ? year + 2500 : year + 2000;
    }

    // Convert Buddhist Era to Christian Era
    if (year > 2400) {
      year -= 543;
    }

    const hours = match[4] ? parseInt(match[4], 10) : 0;
    const minutes = match[5] ? parseInt(match[5], 10) : 0;
    const seconds = match[6] ? parseInt(match[6], 10) : 0;

    const parsed = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Calculates working days between two dates, excluding weekends (Sat/Sun) and Thai public holidays.
 * @param startDateStr Start date (e.g. ธุรการส่งเข้ามา: dateReceive or dateDesk)
 * @param endDateStr End date (e.g. วันที่ดำเนินการ: actionDate or วันที่ปัจจุบัน)
 * @returns number of working days or null if startDate is invalid
 */
export function calculateWorkingDays(
  startDateStr: string | Date | null | undefined,
  endDateStr?: string | Date | null | undefined
): number | null {
  const start = parseThaiDate(startDateStr);
  if (!start) return null;

  const end = endDateStr ? parseThaiDate(endDateStr) || new Date() : new Date();

  // Normalize to start of day (midnight)
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (s >= e) {
    return 0;
  }

  let workingDays = 0;
  const curr = new Date(s);
  curr.setDate(curr.getDate() + 1);

  while (curr <= e) {
    const dayOfWeek = curr.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!isWeekend && !isThaiHoliday(curr)) {
      workingDays++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  return workingDays;
}
