import React from 'react';
import { RefreshCw, LogOut, BarChart3, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onRefresh: () => void;
  isLoading: boolean;
  onOpenGasModal?: () => void;
  onOpenNewDocModal: () => void;
  onOpenSettingsModal: () => void;
  userEmail?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
  onLogout?: () => void;
  onOpenReport?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: (theme: 'light' | 'dark') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefresh,
  isLoading,
  userEmail,
  userName,
  userAvatar,
  onLogout,
  onOpenReport,
  theme = 'light',
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  return (
    <header className={`${isDark ? 'bg-[#0f172a] border-sky-900/60 text-white' : 'bg-white border-sky-100 text-slate-900'} border-b sticky top-0 z-30 shadow-xs transition-colors duration-200`}>
      <div className="h-1 bg-gradient-to-r from-blue-700 via-sky-500 to-blue-600 w-full" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3.5">
            {/* MFU Logo */}
            <div className="h-12 w-10 flex items-center justify-center shrink-0">
              <img
                src="/mfu_logo.png"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('MFU_logo_highres.png')) {
                    target.src = '/MFU_logo_highres.png';
                  }
                }}
                alt="มหาวิทยาลัยแม่ฟ้าหลวง"
                className="h-12 w-auto object-contain drop-shadow-xs"
              />
            </div>
            <div>
              <h1 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-tight font-['Prompt','Sarabun',sans-serif]`}>
                ระบบติดตามเอกสารการเบิกจ่าย ส่วนการเงินและบัญชี มหาวิทยาลัยแม่ฟ้าหลวง
              </h1>
            </div>
          </div>

          {/* Right Area: Actions & User Profile Card */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Report / Dashboard Navigation Button */}
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif]"
                title="เปิดหน้ารายงาน MONITOR Dashboard"
              >
                <BarChart3 className="w-4 h-4" />
                <span>หน้ารายงาน MONITOR</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={() => onToggleTheme(isDark ? 'light' : 'dark')}
                title={isDark ? 'เปลี่ยนเป็นธีมสว่าง (ขาว-น้ำเงิน)' : 'เปลี่ยนเป็นธีมมืด (น้ำเงินกรม-ฟ้าสว่าง)'}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'text-amber-400 hover:bg-sky-950 border-sky-900'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50 border-slate-200'
                }`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Refresh live data */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="ดึงข้อมูลล่าสุด"
              className={`p-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-sky-300 hover:bg-slate-800'
                  : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
            </button>

            {/* Profile Card from Image 3 */}
            {userEmail && (
              <div className={`flex items-center gap-3 px-3 py-1.5 border rounded-2xl shadow-xs transition-all ${
                isDark
                  ? 'border-sky-900/80 bg-[#111e42] text-white hover:border-sky-700'
                  : 'border-sky-100 bg-white hover:border-sky-300 text-slate-800'
              }`}>
                <div className="text-right hidden md:block">
                  <div className="text-xs font-semibold leading-tight font-['Prompt','Sarabun',sans-serif]">
                    {userName || 'Shongwut Tabunsom'}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    {userEmail}
                  </div>
                </div>

                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName || 'User'}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {(userName || 'ST').slice(0, 2).toUpperCase()}
                  </div>
                )}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="ออกจากระบบ"
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

