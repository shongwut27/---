import React from 'react';
import { RefreshCw, Code2, LogOut } from 'lucide-react';

interface NavbarProps {
  onRefresh: () => void;
  isLoading: boolean;
  onOpenGasModal: () => void;
  onOpenNewDocModal: () => void;
  onOpenSettingsModal: () => void;
  userEmail?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefresh,
  isLoading,
  onOpenGasModal,
  userEmail,
  userName,
  userAvatar,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name matching Image 3 */}
          <div className="flex items-center gap-3">
            {/* Green Google Sheets Icon */}
            <div className="w-11 h-11 rounded-xl bg-[#00a651] flex items-center justify-center text-white shadow-xs shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight font-['Prompt','Sarabun',sans-serif]">
                ระบบติดตามเอกสารการเบิกจ่าย ส่วนการเงินและบัญชี มหาวิทยาลัยแม่ฟ้าหลวง
              </h1>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                เชื่อมต่อฐานข้อมูล Google Sheets เป็นฐานข้อมูลแบบ Realtime
              </p>
            </div>
          </div>

          {/* Right Area: User Profile Card (matching Image 3 red box) */}
          <div className="flex items-center gap-2.5">
            {/* Optional Utility Buttons */}
            <button
              onClick={onOpenGasModal}
              title="ตั้งค่าเชื่อมต่อ Google Sheets"
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="ดึงข้อมูลล่าสุด"
              className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Profile Card from Image 3 */}
            {userEmail && (
              <div className="flex items-center gap-3 px-3.5 py-1.5 border border-slate-200 rounded-2xl bg-white shadow-2xs hover:border-slate-300 transition-all">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 leading-tight font-['Prompt','Sarabun',sans-serif]">
                    {userName || 'Shongwut Tabunsom'}
                  </div>
                  <div className="text-xs text-slate-400 leading-tight mt-0.5">
                    {userEmail}
                  </div>
                </div>

                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName || 'User'}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
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
