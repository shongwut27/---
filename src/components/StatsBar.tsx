import React from 'react';
import { DepartmentType } from '../types';
import { FileText, CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';

interface StatsBarProps {
  currentDept: DepartmentType | 'ALL';
  totalDocs: number;
  totalRounds?: number;
  multiRoundDocs?: number;
  returnedDocs: number;
  pendingDocs: number;
  receivedDocs?: number;
  workStatusFilter?: 'ALL' | 'PENDING' | 'COMPLETED' | 'RECEIVED';
  onWorkStatusChange?: (status: 'ALL' | 'PENDING' | 'COMPLETED' | 'RECEIVED') => void;
  budgetCompletedToday?: number;
  budgetCompletedThisMonth?: number;
  budgetCompletedAll?: number;
  budgetCompletedPeriod?: 'today' | 'this_month' | 'all';
  onBudgetStatClick?: (period: 'today' | 'this_month' | 'all') => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  currentDept,
  totalDocs,
  returnedDocs,
  pendingDocs,
  receivedDocs = 0,
  workStatusFilter = 'ALL',
  onWorkStatusChange,
  budgetCompletedToday = 0,
  budgetCompletedThisMonth = 0,
  budgetCompletedAll = 0,
  budgetCompletedPeriod = 'today',
  onBudgetStatClick,
}) => {
  // สำหรับงานงบประมาณ: แสดงสถิติข้อมูลงานที่ทำเสร็จ (1. ข้อมูลวันนี้ 2. เดือนนี้ 3. ทั้งหมด)
  if (currentDept === 'งานงบประมาณ') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* 1. ข้อมูลวันนี้ (งานที่ทำเสร็จ) */}
        <div
          id="stat-box-budget-today"
          onClick={() => onBudgetStatClick?.('today')}
          className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none group ${
            budgetCompletedPeriod === 'today'
              ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-500/80 shadow-xs'
              : 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/80 hover:border-amber-400 shadow-2xs hover:shadow-xs'
          }`}
          title="คลิกเพื่อแสดงการ์ดข้อมูลงานที่ทำเสร็จวันนี้"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-950 font-bold block truncate font-['Prompt','Sarabun',sans-serif]">
                ข้อมูลวันนี้
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                budgetCompletedPeriod === 'today'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-200 text-amber-900'
              }`}>
                {budgetCompletedPeriod === 'today' ? 'เลือกอยู่' : 'งานที่ทำเสร็จ'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl font-bold text-amber-700 leading-tight font-['Prompt','Sarabun',sans-serif]">
                {budgetCompletedToday} <span className="text-xs font-normal text-amber-600">ฉบับ</span>
              </span>
              <span className="text-[11px] text-amber-800 font-semibold group-hover:underline">
                แสดงการ์ด &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* 2. เดือนนี้ (งานที่ทำเสร็จ) */}
        <div
          id="stat-box-budget-month"
          onClick={() => onBudgetStatClick?.('this_month')}
          className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none group ${
            budgetCompletedPeriod === 'this_month'
              ? 'bg-orange-100/90 border-orange-500 ring-2 ring-orange-500/80 shadow-xs'
              : 'bg-orange-50/70 border-orange-300 hover:bg-orange-100/80 hover:border-orange-400 shadow-2xs hover:shadow-xs'
          }`}
          title="คลิกเพื่อแสดงการ์ดข้อมูลงานที่ทำเสร็จเดือนนี้"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-orange-950 font-bold block truncate font-['Prompt','Sarabun',sans-serif]">
                เดือนนี้
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                budgetCompletedPeriod === 'this_month'
                  ? 'bg-orange-600 text-white font-bold'
                  : 'bg-orange-200 text-orange-900'
              }`}>
                {budgetCompletedPeriod === 'this_month' ? 'เลือกอยู่' : 'งานที่ทำเสร็จ'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl font-bold text-orange-700 leading-tight font-['Prompt','Sarabun',sans-serif]">
                {budgetCompletedThisMonth} <span className="text-xs font-normal text-orange-600">ฉบับ</span>
              </span>
              <span className="text-[11px] text-orange-800 font-semibold group-hover:underline">
                แสดงการ์ด &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* 3. ทั้งหมด (งานที่ทำเสร็จ) */}
        <div
          id="stat-box-budget-all"
          onClick={() => onBudgetStatClick?.('all')}
          className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none group ${
            budgetCompletedPeriod === 'all'
              ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-500/80 shadow-xs'
              : 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/80 hover:border-emerald-400 shadow-2xs hover:shadow-xs'
          }`}
          title="คลิกเพื่อแสดงการ์ดข้อมูลงานที่ทำเสร็จทั้งหมด"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-950 font-bold block truncate font-['Prompt','Sarabun',sans-serif]">
                ทั้งหมด
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                budgetCompletedPeriod === 'all'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-200 text-emerald-900'
              }`}>
                {budgetCompletedPeriod === 'all' ? 'เลือกอยู่' : 'งานที่ทำเสร็จ'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl font-bold text-emerald-700 leading-tight font-['Prompt','Sarabun',sans-serif]">
                {budgetCompletedAll} <span className="text-xs font-normal text-emerald-600">ฉบับ</span>
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold group-hover:underline">
                แสดงการ์ด &rarr;
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // สำหรับงานสอบทาน: แสดงทั้งหมด 4 กล่อง (1.เอกสารที่เข้ามาทั้งหมด 2.บันทึกรับแล้ว 3.ดำเนินการแล้ว 4.งานค้างในมือ)
  if (currentDept === 'งานสอบทาน') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* 1. เอกสารที่เข้ามาทั้งหมด - สีฟ้า */}
        <div
          id="stat-box-review-all"
          onClick={() => onWorkStatusChange?.('ALL')}
          className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none ${
            workStatusFilter === 'ALL'
              ? 'bg-blue-100/80 border-blue-400 ring-2 ring-blue-500/80 shadow-xs'
              : 'bg-blue-50/60 border-blue-200/80 hover:bg-blue-100/50 hover:border-blue-300 shadow-2xs'
          }`}
          title="คลิกเพื่อแสดงเอกสารที่เข้ามาทั้งหมด"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-900 font-semibold block truncate">
                1. เอกสารที่เข้ามาทั้งหมด
              </span>
              {workStatusFilter === 'ALL' && (
                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-medium">
                  เลือกอยู่
                </span>
              )}
            </div>
            <span className="text-2xl font-bold text-blue-700 leading-tight font-['Prompt','Sarabun',sans-serif]">
              {totalDocs} <span className="text-xs font-normal text-blue-600">ฉบับ</span>
            </span>
          </div>
        </div>

        {/* 2. บันทึกรับแล้ว - สีส้ม */}
        <div
          id="stat-box-review-received"
          onClick={() => onWorkStatusChange?.('RECEIVED')}
          className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none ${
            workStatusFilter === 'RECEIVED'
              ? 'bg-orange-100/80 border-orange-400 ring-2 ring-orange-500/80 shadow-xs'
              : 'bg-orange-50/60 border-orange-200/80 hover:bg-orange-100/50 hover:border-orange-300 shadow-2xs'
          }`}
          title="คลิกเพื่อแสดงเอกสารที่บันทึกรับแล้ว"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-orange-900 font-semibold block truncate">
                2. บันทึกรับแล้ว
              </span>
              {workStatusFilter === 'RECEIVED' && (
                <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.2 rounded-full font-medium">
                  เลือกอยู่
                </span>
              )}
            </div>
            <span className="text-2xl font-bold text-orange-600 leading-tight font-['Prompt','Sarabun',sans-serif]">
              {receivedDocs} <span className="text-xs font-normal text-orange-500">ฉบับ</span>
            </span>
          </div>
        </div>

        {/* 3. ดำเนินการแล้ว - สีเขียว */}
        <div
          id="stat-box-review-completed"
          onClick={() => onWorkStatusChange?.('COMPLETED')}
          className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none ${
            workStatusFilter === 'COMPLETED'
              ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-500/80 shadow-xs'
              : 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/50 hover:border-emerald-300 shadow-2xs'
          }`}
          title="คลิกเพื่อแสดงงานที่ดำเนินการแล้ว"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-900 font-semibold block truncate">
                3. ดำเนินการแล้ว
              </span>
              {workStatusFilter === 'COMPLETED' && (
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-medium">
                  เลือกอยู่
                </span>
              )}
            </div>
            <span className="text-2xl font-bold text-emerald-700 leading-tight font-['Prompt','Sarabun',sans-serif]">
              {returnedDocs} <span className="text-xs font-normal text-emerald-600">ฉบับ</span>
            </span>
          </div>
        </div>

        {/* 4. งานค้างในมือ - สีแดง */}
        <div
          id="stat-box-review-pending"
          onClick={() => onWorkStatusChange?.('PENDING')}
          className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none ${
            workStatusFilter === 'PENDING'
              ? 'bg-rose-100/80 border-rose-400 ring-2 ring-rose-500/80 shadow-xs'
              : 'bg-rose-50/60 border-rose-200/80 hover:bg-rose-100/50 hover:border-rose-300 shadow-2xs'
          }`}
          title="คลิกเพื่อแสดงงานค้างในมือ"
        >
          <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-900 font-semibold block truncate">
                4. งานค้างในมือ
              </span>
              {workStatusFilter === 'PENDING' && (
                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-medium">
                  เลือกอยู่
                </span>
              )}
            </div>
            <span className="text-2xl font-bold text-rose-600 leading-tight font-['Prompt','Sarabun',sans-serif]">
              {pendingDocs} <span className="text-xs font-normal text-rose-500">ฉบับ</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {/* 1. งานทั้งหมด - สีฟ้า */}
      <div
        id="stat-box-all"
        onClick={() => onWorkStatusChange?.('ALL')}
        className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none ${
          workStatusFilter === 'ALL'
            ? 'bg-blue-100/80 border-blue-400 ring-2 ring-blue-500/80 shadow-xs'
            : 'bg-blue-50/60 border-blue-200/80 hover:bg-blue-100/50 hover:border-blue-300 shadow-2xs'
        }`}
        title="คลิกเพื่อแสดงงานทั้งหมด"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-900 font-semibold block truncate">
              งานทั้งหมด {currentDept !== 'ALL' ? `(${currentDept})` : ''}
            </span>
            {workStatusFilter === 'ALL' && (
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-medium">
                เลือกอยู่
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-blue-700 leading-tight font-['Prompt','Sarabun',sans-serif]">
            {totalDocs} <span className="text-xs font-normal text-blue-600">ฉบับ</span>
          </span>
        </div>
      </div>

      {/* 2. งานที่ทำเสร็จ - สีเขียว */}
      <div
        id="stat-box-completed"
        onClick={() => onWorkStatusChange?.('COMPLETED')}
        className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none ${
          workStatusFilter === 'COMPLETED'
            ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-500/80 shadow-xs'
            : 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/50 hover:border-emerald-300 shadow-2xs'
        }`}
        title="คลิกเพื่อแสดงงานที่ทำเสร็จ"
      >
        <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-900 font-semibold block truncate">
              งานที่ทำเสร็จ
            </span>
            {workStatusFilter === 'COMPLETED' && (
              <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-medium">
                เลือกอยู่
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-emerald-700 leading-tight font-['Prompt','Sarabun',sans-serif]">
            {returnedDocs} <span className="text-xs font-normal text-emerald-600">ฉบับ</span>
          </span>
        </div>
      </div>

      {/* 3. ระหว่างทำ / งานค้างในมือ - สีส้ม */}
      <div
        id="stat-box-pending"
        onClick={() => onWorkStatusChange?.('PENDING')}
        className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none ${
          workStatusFilter === 'PENDING'
            ? 'bg-orange-100/80 border-orange-400 ring-2 ring-orange-500/80 shadow-xs'
            : 'bg-orange-50/60 border-orange-200/80 hover:bg-orange-100/50 hover:border-orange-300 shadow-2xs'
        }`}
        title="คลิกเพื่อแสดงงานค้างในมือ (ระหว่างทำ)"
      >
        <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-orange-900 font-semibold block truncate">
              งานค้างในมือ (ระหว่างทำ)
            </span>
            {workStatusFilter === 'PENDING' && (
              <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.2 rounded-full font-medium">
                เลือกอยู่
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-orange-600 leading-tight font-['Prompt','Sarabun',sans-serif]">
            {pendingDocs} <span className="text-xs font-normal text-orange-500">ฉบับ</span>
          </span>
        </div>
      </div>
    </div>
  );
};
