import React from 'react';
import { DepartmentType } from '../types';
import { FileText, RotateCcw, CheckCircle2, Clock, Layers } from 'lucide-react';

interface StatsBarProps {
  currentDept: DepartmentType | 'ALL';
  totalDocs: number;
  totalRounds: number;
  multiRoundDocs: number;
  returnedDocs: number;
  pendingDocs: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  currentDept,
  totalDocs,
  totalRounds,
  multiRoundDocs,
  returnedDocs,
  pendingDocs,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-xs text-slate-500 font-medium block truncate">
            เอกสารทั้งหมด {currentDept !== 'ALL' ? `(${currentDept})` : ''}
          </span>
          <span className="text-xl font-bold text-slate-800 leading-normal font-['Prompt','Sarabun',sans-serif]">
            {totalDocs} <span className="text-xs font-normal text-slate-500">ฉบับ</span>
          </span>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-xs text-slate-500 font-medium block truncate">
            เข้า-ออกหลายรอบ
          </span>
          <span className="text-xl font-bold text-indigo-700 leading-normal font-['Prompt','Sarabun',sans-serif]">
            {multiRoundDocs} <span className="text-xs font-normal text-slate-500">ฉบับ</span>
          </span>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-xs text-slate-500 font-medium block truncate">
            งานที่ทำเสร็จ
          </span>
          <span className="text-xl font-bold text-emerald-700 leading-normal font-['Prompt','Sarabun',sans-serif]">
            {returnedDocs} <span className="text-xs font-normal text-slate-500">ฉบับ</span>
          </span>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-xs text-slate-500 font-medium block truncate">
            งานที่ค้างในมือ
          </span>
          <span className="text-xl font-bold text-amber-700 leading-normal font-['Prompt','Sarabun',sans-serif]">
            {pendingDocs} <span className="text-xs font-normal text-slate-500">ฉบับ</span>
          </span>
        </div>
      </div>
    </div>
  );
};
