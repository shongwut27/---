import React from 'react';
import { DepartmentType } from '../types';
import {
  Search,
  FolderGit2,
  CheckCircle2,
  DollarSign,
  PieChart,
  Layers,
  X,
  Filter,
  UserCheck,
  Clock,
} from 'lucide-react';

interface DepartmentTabsProps {
  currentDept: DepartmentType | 'ALL';
  onSelectDept: (dept: DepartmentType | 'ALL') => void;
  counts: Record<string, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  returnStatusFilter: string;
  onReturnStatusChange: (status: string) => void;
  multiRoundOnly: boolean;
  onMultiRoundToggle: (val: boolean) => void;
  selectedProvider?: string;
  onProviderChange?: (provider: string) => void;
  availableProviders?: string[];
  workStatusFilter?: 'ALL' | 'PENDING' | 'COMPLETED';
  onWorkStatusChange?: (status: 'ALL' | 'PENDING' | 'COMPLETED') => void;
  workStatusCounts?: { all: number; pending: number; completed: number };
}

export const DepartmentTabs: React.FC<DepartmentTabsProps> = ({
  currentDept,
  onSelectDept,
  counts,
  searchQuery,
  onSearchChange,
  returnStatusFilter,
  onReturnStatusChange,
  multiRoundOnly,
  onMultiRoundToggle,
  selectedProvider = 'ALL',
  onProviderChange,
  availableProviders = [],
  workStatusFilter = 'ALL',
  onWorkStatusChange,
  workStatusCounts,
}) => {
  const tabs: {
    id: DepartmentType | 'ALL';
    label: string;
    icon: React.ReactNode;
    activeClasses: string;
    inactiveClasses: string;
    activeBadge: string;
    inactiveBadge: string;
  }[] = [
    {
      id: 'งานตรวจจ่าย',
      label: 'งานตรวจจ่าย',
      icon: <FolderGit2 className="w-4 h-4" />,
      // สีฟ้า
      activeClasses: 'bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-100 ring-2 ring-sky-300 font-semibold',
      inactiveClasses: 'bg-sky-50/80 text-sky-800 hover:bg-sky-100 border border-sky-200/80',
      activeBadge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-sky-100 text-sky-800',
    },
    {
      id: 'งานสอบทาน',
      label: 'งานสอบทาน',
      icon: <CheckCircle2 className="w-4 h-4" />,
      // สีชมพู
      activeClasses: 'bg-pink-500 hover:bg-pink-600 text-white shadow-md shadow-pink-100 ring-2 ring-pink-300 font-semibold',
      inactiveClasses: 'bg-pink-50/80 text-pink-800 hover:bg-pink-100 border border-pink-200/80',
      activeBadge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-pink-100 text-pink-800',
    },
    {
      id: 'งานการเงิน',
      label: 'งานการเงิน',
      icon: <DollarSign className="w-4 h-4" />,
      // สีเขียว
      activeClasses: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 ring-2 ring-emerald-300 font-semibold',
      inactiveClasses: 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80',
      activeBadge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'งานงบประมาณ',
      label: 'งานงบประมาณ',
      icon: <PieChart className="w-4 h-4" />,
      // สีส้ม
      activeClasses: 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-100 ring-2 ring-orange-300 font-semibold',
      inactiveClasses: 'bg-orange-50/80 text-orange-800 hover:bg-orange-100 border border-orange-200/80',
      activeBadge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-orange-100 text-orange-800',
    },
    {
      id: 'ALL',
      label: 'ทุกฝ่าย',
      icon: <Layers className="w-4 h-4" />,
      activeClasses: 'bg-slate-700 hover:bg-slate-800 text-white shadow-md shadow-slate-200 ring-2 ring-slate-400 font-semibold',
      inactiveClasses: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
      activeBadge: 'bg-white/25 text-white',
      inactiveBadge: 'bg-slate-200 text-slate-700',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6 space-y-4">
      {/* 1. เมนูหน้าแยกตามฝ่ายงาน (อยู่ก่อนตัวกรองทั้งหมด ชัดเจนพร้อมสีประจำฝ่าย) */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-['Prompt','Sarabun',sans-serif]">
            📁 เลือกหน้าฝ่ายงาน:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {tabs.map((tab) => {
            const isActive = currentDept === tab.id;
            const count = counts[tab.id] || 0;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectDept(tab.id)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] ${
                  isActive ? tab.activeClasses : tab.inactiveClasses
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate font-semibold">{tab.label}</span>
                </div>
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ml-1.5 ${
                    isActive ? tab.activeBadge : tab.inactiveBadge
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ส่วนตัวกรอง (Filters) อยู่ถัดลงมาจากเมนูหน้า */}
      <div className="pt-3.5 border-t border-slate-100 space-y-3">
        {/* Search & Work Status Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Real-time search */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาเลขที่เอกสาร, ชื่อหน่วยงาน, เลขทะเบียนรับ, เลขที่ อว, ผู้ส่ง..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Work Status Filter (1.งานที่ค้างในมือ / 2.งานที่ทำเสร็จ / 3.งานทั้งหมด) */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl shrink-0 overflow-x-auto border border-slate-200/50">
            {/* 1. งานที่ค้างในมือ - คืองานที่ส่งเข้ามาลงโต๊ะนี้แล้วยังไม่มีการลงสถานะ */}
            <button
              onClick={() => onWorkStatusChange?.('PENDING')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                workStatusFilter === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-2xs font-semibold'
                  : 'text-slate-700 hover:text-amber-800'
              }`}
              title="งานที่ค้างในมือ: คืองานที่ส่งเข้ามาลงโต๊ะนี้แล้วยังไม่มีการลงสถานะ"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>งานที่ค้างในมือ</span>
              {workStatusCounts ? (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    workStatusFilter === 'PENDING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {workStatusCounts.pending}
                </span>
              ) : null}
            </button>

            {/* 2. งานที่ทำเสร็จ - คืองานทั้งหมดที่ลงข้อมูลแล้ว */}
            <button
              onClick={() => onWorkStatusChange?.('COMPLETED')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                workStatusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-700 hover:text-emerald-800'
              }`}
              title="งานที่ทำเสร็จ: คืองานทั้งหมดที่ลงข้อมูลแล้ว"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>งานที่ทำเสร็จ</span>
              {workStatusCounts ? (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    workStatusFilter === 'COMPLETED'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {workStatusCounts.completed}
                </span>
              ) : null}
            </button>

            {/* 3. งานทั้งหมด - คืองานที่เข้ามาของคนนี้ทั้งหมด */}
            <button
              onClick={() => onWorkStatusChange?.('ALL')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                workStatusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="งานทั้งหมด: คืองานที่เข้ามาของคนนี้ทั้งหมด"
            >
              <span>งานทั้งหมด</span>
              {workStatusCounts ? (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    workStatusFilter === 'ALL'
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {workStatusCounts.all}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Secondary Dropdown Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Provider Filter */}
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 font-medium">ผู้ให้บริการ:</span>
              <select
                value={selectedProvider}
                onChange={(e) => onProviderChange?.(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[170px] sm:max-w-[240px] truncate"
              >
                <option value="ALL">ผู้ให้บริการทั้งหมด ({availableProviders.length})</option>
                {availableProviders.map((p, idx) => (
                  <option key={`${p}-${idx}`} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 font-medium">สถานะส่งคืน:</span>
              <select
                value={returnStatusFilter}
                onChange={(e) => onReturnStatusChange(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="ส่งต่อจ่ายทั่วไป">ส่งต่อจ่ายทั่วไป</option>
                <option value="ติดต่อรับคืน">ติดต่อรับคืน</option>
                <option value="ส่งต่อเคาท์เตอร์จ่าย">ส่งต่อเคาท์เตอร์จ่าย</option>
                <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                <option value="ส่งคืนแล้ว">ส่งคืนแล้ว</option>
              </select>
            </div>
          </div>

          {/* Toggle multi-round */}
          <button
            onClick={() => onMultiRoundToggle(!multiRoundOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              multiRoundOnly
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🔄 เฉพาะหลายรอบ</span>
            {counts['multiRound'] > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  multiRoundOnly ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {counts['multiRound']}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
