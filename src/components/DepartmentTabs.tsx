import React, { useState, useRef, useEffect } from 'react';
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
  Calendar,
  FileText,
  ChevronDown,
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
  workStatusFilter?: 'ALL' | 'PENDING' | 'COMPLETED' | 'RECEIVED';
  onWorkStatusChange?: (status: 'ALL' | 'PENDING' | 'COMPLETED' | 'RECEIVED') => void;
  workStatusCounts?: { all: number; pending: number; completed: number; received?: number };
  onOpenReport?: () => void;
  timeFilter?: 'ALL' | 'TODAY' | 'THIS_MONTH' | 'CUSTOM';
  onTimeFilterChange?: (filter: 'ALL' | 'TODAY' | 'THIS_MONTH' | 'CUSTOM') => void;
  customDate?: string;
  onCustomDateChange?: (date: string) => void;
  selectedDocTypes?: string[];
  onSelectedDocTypesChange?: (docTypes: string[]) => void;
  availableDocTypes?: string[];
  theme?: 'light' | 'dark';
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
  onOpenReport,
  timeFilter = 'ALL',
  onTimeFilterChange,
  customDate = '',
  onCustomDateChange,
  selectedDocTypes = [],
  onSelectedDocTypesChange,
  availableDocTypes = [],
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [isDocTypeDropdownOpen, setIsDocTypeDropdownOpen] = useState(false);
  const docTypeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (docTypeDropdownRef.current && !docTypeDropdownRef.current.contains(event.target as Node)) {
        setIsDocTypeDropdownOpen(false);
      }
    };
    if (isDocTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDocTypeDropdownOpen]);

  const handleToggleDocType = (type: string) => {
    if (!onSelectedDocTypesChange) return;
    if (selectedDocTypes.includes(type)) {
      onSelectedDocTypesChange(selectedDocTypes.filter((t) => t !== type));
    } else {
      onSelectedDocTypesChange([...selectedDocTypes, type]);
    }
  };

  const handleSelectAllDocTypes = () => {
    if (!onSelectedDocTypesChange) return;
    onSelectedDocTypesChange([...availableDocTypes]);
  };

  const handleClearDocTypes = () => {
    if (!onSelectedDocTypesChange) return;
    onSelectedDocTypesChange([]);
  };

  const tabs: {
    id: DepartmentType | 'ALL';
    label: string;
    subLabel: string;
    icon: React.ReactNode;
    colorTheme: {
      activeGradient: string;
      activeShadow: string;
      activeRing: string;
      inactiveBorder: string;
      inactiveHoverBg: string;
      inactiveIconBg: string;
      inactiveBadge: string;
      topBarColor: string;
      dotColor: string;
    };
  }[] = [
    {
      id: 'งานตรวจจ่าย',
      label: 'งานตรวจสอบและบันทึกบัญชี',
      subLabel: 'สถานะการตรวจสอบเอกสารและการบันทึกบัญชี',
      icon: <FolderGit2 className="w-5 h-5" />,
      colorTheme: {
        activeGradient: 'bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white',
        activeShadow: 'shadow-xl shadow-blue-500/25',
        activeRing: 'ring-2 ring-sky-300 ring-offset-2 ring-offset-white',
        inactiveBorder: 'border-slate-200/90 hover:border-sky-400',
        inactiveHoverBg: 'hover:bg-gradient-to-b hover:from-sky-50/60 hover:to-white',
        inactiveIconBg: 'bg-sky-50 text-sky-600 group-hover:bg-sky-100 group-hover:scale-105',
        inactiveBadge: 'bg-sky-50 text-sky-700 border border-sky-200/80',
        topBarColor: 'bg-sky-500',
        dotColor: 'bg-sky-400',
      },
    },
    {
      id: 'งานสอบทาน',
      label: 'งานสอบทาน',
      subLabel: 'สอบทานความถูกต้อง & แก้ไข',
      icon: <CheckCircle2 className="w-5 h-5" />,
      colorTheme: {
        activeGradient: 'bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 text-white',
        activeShadow: 'shadow-xl shadow-rose-500/25',
        activeRing: 'ring-2 ring-rose-300 ring-offset-2 ring-offset-white',
        inactiveBorder: 'border-slate-200/90 hover:border-rose-400',
        inactiveHoverBg: 'hover:bg-gradient-to-b hover:from-rose-50/60 hover:to-white',
        inactiveIconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100 group-hover:scale-105',
        inactiveBadge: 'bg-rose-50 text-rose-700 border border-rose-200/80',
        topBarColor: 'bg-rose-500',
        dotColor: 'bg-rose-400',
      },
    },
    {
      id: 'งานการเงิน',
      label: 'งานการเงิน',
      subLabel: 'เบิกจ่าย & ออกเช็คการเงิน',
      icon: <DollarSign className="w-5 h-5" />,
      colorTheme: {
        activeGradient: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white',
        activeShadow: 'shadow-xl shadow-emerald-500/25',
        activeRing: 'ring-2 ring-emerald-300 ring-offset-2 ring-offset-white',
        inactiveBorder: 'border-slate-200/90 hover:border-emerald-400',
        inactiveHoverBg: 'hover:bg-gradient-to-b hover:from-emerald-50/60 hover:to-white',
        inactiveIconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:scale-105',
        inactiveBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        topBarColor: 'bg-emerald-500',
        dotColor: 'bg-emerald-400',
      },
    },
    {
      id: 'งานงบประมาณ',
      label: 'งานงบประมาณ',
      subLabel: 'จัดสรร & ควบคุมงบประมาณ',
      icon: <PieChart className="w-5 h-5" />,
      colorTheme: {
        activeGradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 text-white',
        activeShadow: 'shadow-xl shadow-orange-500/25',
        activeRing: 'ring-2 ring-orange-300 ring-offset-2 ring-offset-white',
        inactiveBorder: 'border-slate-200/90 hover:border-orange-400',
        inactiveHoverBg: 'hover:bg-gradient-to-b hover:from-orange-50/60 hover:to-white',
        inactiveIconBg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:scale-105',
        inactiveBadge: 'bg-amber-50 text-amber-700 border border-amber-200/80',
        topBarColor: 'bg-orange-500',
        dotColor: 'bg-orange-400',
      },
    },
    {
      id: 'ALL',
      label: 'งานทั้งหมด',
      subLabel: 'รวมเอกสารทุกฝ่ายงาน',
      icon: <Layers className="w-5 h-5" />,
      colorTheme: {
        activeGradient: 'bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-800 text-white',
        activeShadow: 'shadow-xl shadow-purple-500/25',
        activeRing: 'ring-2 ring-purple-300 ring-offset-2 ring-offset-white',
        inactiveBorder: 'border-slate-200/90 hover:border-purple-400',
        inactiveHoverBg: 'hover:bg-gradient-to-b hover:from-purple-50/60 hover:to-white',
        inactiveIconBg: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:scale-105',
        inactiveBadge: 'bg-purple-50 text-purple-700 border border-purple-200/80',
        topBarColor: 'bg-purple-600',
        dotColor: 'bg-purple-400',
      },
    },
  ];

  return (
    <div className={`rounded-3xl border p-5 sm:p-6 shadow-sm mb-6 space-y-5 transition-colors duration-200 ${
      isDark
        ? 'bg-[#0b1426] border-sky-900/80 shadow-xl text-white'
        : 'bg-white border-sky-100/80 shadow-sm text-slate-800'
    }`}>
      {/* 1. เมนูหน้าแยกตามฝ่ายงาน ดีไซน์หรูหรา */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border shadow-2xs ${
              isDark
                ? 'bg-sky-950/80 text-sky-400 border-sky-800/80'
                : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              <FolderGit2 className="w-4 h-4" />
            </span>
            <div>
              <h2 className={`text-xs sm:text-sm font-bold uppercase tracking-wider font-['Prompt','Sarabun',sans-serif] flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>
                <span>เลือกหน้าฝ่ายงานที่ต้องการปฏิบัติงาน</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              </h2>
              <p className={`text-[11px] font-medium ${isDark ? 'text-sky-300/70' : 'text-slate-400'}`}>
                คลิกเลือกฝ่ายงานเพื่อกรองงานเฉพาะฝ่าย หรือเลือกงานทั้งหมด
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {tabs.map((tab) => {
            const isActive = currentDept === tab.id;
            const count = counts[tab.id] || 0;
            const theme = tab.colorTheme;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectDept(tab.id)}
                className={`group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl transition-all duration-200 cursor-pointer text-left font-['Prompt','Sarabun',sans-serif] relative overflow-hidden border ${
                  isActive
                    ? `${theme.activeGradient} ${theme.activeShadow} ${theme.activeRing} scale-[1.02] z-10`
                    : isDark
                    ? `bg-[#111e3b] text-slate-100 border-sky-800/60 hover:bg-[#16274e] hover:border-sky-500 shadow-2xs hover:shadow-md hover:-translate-y-1`
                    : `bg-white text-slate-800 ${theme.inactiveBorder} ${theme.inactiveHoverBg} shadow-2xs hover:shadow-md hover:-translate-y-1`
                }`}
              >
                {/* Top Accent Strip for inactive buttons */}
                {!isActive && (
                  <div className={`absolute top-0 left-0 right-0 h-1 ${theme.topBarColor} opacity-70 group-hover:opacity-100 transition-opacity`} />
                )}

                {/* Header Row: Icon & Count Badge */}
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 backdrop-blur-md text-white ring-1 ring-white/30 shadow-inner'
                        : isDark
                        ? 'bg-sky-950/90 text-sky-300 ring-1 ring-sky-800/60 group-hover:scale-105'
                        : theme.inactiveIconBg
                    }`}
                  >
                    {tab.icon}
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 transition-all ${
                      isActive
                        ? 'bg-white/25 text-white backdrop-blur-xs ring-1 ring-white/30 shadow-xs'
                        : isDark
                        ? 'bg-sky-950 text-sky-200 border border-sky-800/80'
                        : theme.inactiveBadge
                    }`}
                  >
                    <span>{count.toLocaleString()}</span>
                    <span className="text-[10px] font-normal opacity-85">ฉบับ</span>
                  </div>
                </div>

                {/* Text Labels & Status Indicator */}
                <div className="space-y-0.5">
                  <div className="font-bold text-sm sm:text-base leading-snug tracking-tight">
                    {tab.label}
                  </div>
                  <div
                    className={`text-[11px] leading-tight line-clamp-1 ${
                      isActive ? 'text-white/85 font-normal' : isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-600'
                    }`}
                  >
                    {tab.subLabel}
                  </div>
                </div>

                {/* Active Indicator Footer */}
                <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-[10px]">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-white font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                      <span>กำลังเลือกอยู่</span>
                    </span>
                  ) : (
                    <span className={`${isDark ? 'text-sky-400/80 group-hover:text-sky-300' : 'text-slate-400 group-hover:text-slate-600'} font-medium flex items-center gap-1 transition-colors`}>
                      <span>คลิกเพื่อเปิดหน้างาน</span>
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ส่วนตัวกรอง (Filters) ย้ายมาอยู่ด้านบนของช่องค้นหา */}
      <div className={`pt-3.5 border-t space-y-3.5 ${isDark ? 'border-sky-900/60' : 'border-slate-100'}`}>
        {/* Dropdown Filter Bar: ช่วงเวลา, ผู้ให้บริการ, สถานะส่งคืน, ประเภทเอกสาร */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Time Period Filter (ช่วงเวลา) */}
            <div className="flex items-center gap-1.5">
              <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-slate-400'}`} />
              <span className={`font-medium ${isDark ? 'text-sky-200' : 'text-slate-600'}`}>ช่วงเวลา:</span>
              <select
                value={timeFilter}
                onChange={(e) => onTimeFilterChange?.(e.target.value as any)}
                className={`text-xs border rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                  isDark
                    ? 'bg-[#111e3b] border-sky-800 text-slate-200 focus:bg-[#16274e]'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="ALL">ช่วงเวลา: ทั้งหมด</option>
                <option value="TODAY">วันนี้</option>
                <option value="THIS_MONTH">เดือนนี้</option>
                <option value="CUSTOM">เลือกวันที่...</option>
              </select>
            </div>

            {/* Custom Date Picker (when timeFilter === 'CUSTOM') */}
            {timeFilter === 'CUSTOM' && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => onCustomDateChange?.(e.target.value)}
                  className={`text-xs border rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                    isDark
                      ? 'bg-[#111e3b] border-sky-800 text-slate-200 focus:bg-[#16274e]'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                />
                {customDate && (
                  <button
                    onClick={() => onCustomDateChange?.('')}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                    title="ล้างวันที่"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Provider Filter */}
            <div className="flex items-center gap-1.5">
              <UserCheck className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-slate-400'}`} />
              <span className={`font-medium ${isDark ? 'text-sky-200' : 'text-slate-600'}`}>ผู้ให้บริการ:</span>
              <select
                value={selectedProvider}
                onChange={(e) => onProviderChange?.(e.target.value)}
                className={`text-xs border rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[170px] sm:max-w-[240px] truncate ${
                  isDark
                    ? 'bg-[#111e3b] border-sky-800 text-slate-200 focus:bg-[#16274e]'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
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
              <Filter className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-slate-400'}`} />
              <span className={`font-medium ${isDark ? 'text-sky-200' : 'text-slate-600'}`}>สถานะส่งคืน:</span>
              <select
                value={returnStatusFilter}
                onChange={(e) => onReturnStatusChange(e.target.value)}
                className={`text-xs border rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                  isDark
                    ? 'bg-[#111e3b] border-sky-800 text-slate-200 focus:bg-[#16274e]'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="ส่งต่อจ่ายทั่วไป">ส่งต่อจ่ายทั่วไป</option>
                <option value="ติดต่อรับคืน">ติดต่อรับคืน</option>
                <option value="ส่งต่อเคาท์เตอร์จ่าย">ส่งต่อเคาท์เตอร์จ่าย</option>
                <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                <option value="ส่งคืนแล้ว">ส่งคืนแล้ว</option>
              </select>
            </div>

            {/* Multi-Select DocType Filter (เลือกได้หลายประเภท) */}
            <div className="relative" ref={docTypeDropdownRef}>
              <div className="flex items-center gap-1.5">
                <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-slate-400'}`} />
                <span className={`font-medium ${isDark ? 'text-sky-200' : 'text-slate-600'}`}>ประเภท:</span>
                <button
                  type="button"
                  onClick={() => setIsDocTypeDropdownOpen(!isDocTypeDropdownOpen)}
                  className={`text-xs flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                    selectedDocTypes.length > 0
                      ? isDark
                        ? 'border-sky-400 bg-sky-950/80 text-sky-200 font-bold'
                        : 'border-blue-500 bg-blue-50/80 text-blue-700 font-bold'
                      : isDark
                      ? 'bg-[#111e3b] border-sky-800 text-slate-200 hover:border-sky-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="max-w-[130px] sm:max-w-[190px] truncate">
                    {selectedDocTypes.length === 0
                      ? `ประเภททั้งหมด (${availableDocTypes.length})`
                      : `เลือกแล้ว (${selectedDocTypes.length}) ประเภท`}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDocTypeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {selectedDocTypes.length > 0 && (
                  <button
                    onClick={handleClearDocTypes}
                    className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                    title="ล้างตัวกรองประเภทเอกสาร"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Multi-Select Popover Menu */}
              {isDocTypeDropdownOpen && (
                <div className={`absolute left-0 top-full mt-1.5 w-72 rounded-xl shadow-2xl border p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isDark
                    ? 'bg-[#0f172a] border-sky-800 text-white'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className={`flex items-center justify-between px-2 py-1.5 border-b mb-1 text-xs ${
                    isDark ? 'border-sky-900/80' : 'border-slate-100'
                  }`}>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      ประเภทเอกสาร ({availableDocTypes.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllDocTypes}
                        className="text-[11px] font-medium text-blue-500 hover:underline cursor-pointer"
                      >
                        เลือกทั้งหมด
                      </button>
                      <span className="text-slate-400">|</span>
                      <button
                        type="button"
                        onClick={handleClearDocTypes}
                        className="text-[11px] font-medium text-rose-500 hover:underline cursor-pointer"
                      >
                        ล้าง
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-0.5 p-1">
                    {availableDocTypes.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">ไม่พบประเภทเอกสาร</div>
                    ) : (
                      availableDocTypes.map((dt) => {
                        const isChecked = selectedDocTypes.includes(dt);
                        return (
                          <label
                            key={dt}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? isDark
                                  ? 'bg-sky-950 text-sky-200 font-bold'
                                  : 'bg-blue-50 text-blue-900 font-bold'
                                : isDark
                                ? 'text-slate-300 hover:bg-sky-950/50'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleDocType(dt)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="truncate flex-1" title={dt}>
                              {dt}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>

                  <div className={`pt-2 border-t flex items-center justify-between px-1 ${
                    isDark ? 'border-sky-900/80' : 'border-slate-100'
                  }`}>
                    <span className="text-[11px] text-slate-400">
                      เลือกแล้ว: {selectedDocTypes.length} / {availableDocTypes.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDocTypeDropdownOpen(false)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md transition-colors cursor-pointer"
                    >
                      ตกลง
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. ช่องค้นหาโดดเด่นสะดุดตา (Prominent Search Bar) */}
        <div className="relative w-full pt-1">
          <div className={`relative flex items-center rounded-2xl transition-all duration-200 shadow-md ${
            isDark
              ? 'bg-[#101e42] border-2 border-sky-500/70 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-500/20 shadow-sky-950/50'
              : 'bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80 border-2 border-blue-500/90 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/15 shadow-blue-500/10'
          }`}>
            <div className="pl-3.5 pr-2 flex items-center pointer-events-none">
              <span className={`p-2 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-sky-500 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs'
              }`}>
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="🔍 ค้นหาเอกสารด่วน: เลขที่เอกสาร, ชื่อหน่วยงาน, เลขทะเบียนรับ, เลขที่ อว, ผู้ส่ง, ประเภท..."
              className={`w-full py-3 sm:py-3.5 pr-12 text-xs sm:text-sm font-semibold bg-transparent focus:outline-none ${
                isDark ? 'text-white placeholder-sky-300/50' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100/50 transition-colors cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
