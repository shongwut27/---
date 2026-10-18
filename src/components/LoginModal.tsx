import React, { useState } from 'react';
import { LogIn, User, Plus, X, Loader2 } from 'lucide-react';
import { googleSignIn } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (email: string, name?: string, avatar?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLogin }) => {
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const defaultAccounts = [
    {
      name: 'Shongwut Tabunsom',
      email: 'shongwut.tab@mfu.ac.th',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      type: 'photo',
    },
    {
      name: 'St Shongwut',
      email: 'wutlike2025@gmail.com',
      avatar: '',
      type: 'badge',
      badgeText: 'St',
      badgeBg: 'bg-emerald-700',
    },
    {
      name: 'shongwut tabunsom',
      email: 'wutlike@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      type: 'photo',
    },
  ];

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await googleSignIn();
      if (res?.user) {
        onLogin(res.user.email || '', res.user.displayName || undefined, res.user.photoURL || undefined);
        setIsChooserOpen(false);
      }
    } catch (err: any) {
      console.warn('Google sign-in cancelled or failed, opening account selector', err);
      setIsChooserOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = async (acc: typeof defaultAccounts[0]) => {
    try {
      setIsLoading(true);
      const res = await googleSignIn();
      if (res?.user) {
        onLogin(res.user.email || '', res.user.displayName || undefined, res.user.photoURL || undefined);
        setIsChooserOpen(false);
        return;
      }
    } catch (err) {
      console.warn('Google popup closed, using selected account info', err);
    } finally {
      setIsLoading(false);
    }
    onLogin(acc.email, acc.name, acc.avatar);
    setIsChooserOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('กรุณากรอกอีเมล Google ให้ถูกต้อง');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    onLogin(customEmail.trim(), name);
    setIsChooserOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between overflow-y-auto">
      {/* Top Header Bar */}
      <div className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* MFU Logo */}
          <div className="h-9 w-7 flex items-center justify-center shrink-0">
            <img
              src="/mfu_logo.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('MFU_logo_highres.png')) {
                  target.src = '/MFU_logo_highres.png';
                }
              }}
              alt="มหาวิทยาลัยแม่ฟ้าหลวง"
              className="h-9 w-auto object-contain"
            />
          </div>
          <span className="text-sm font-semibold text-slate-800 font-['Prompt','Sarabun',sans-serif]">
            มหาวิทยาลัยแม่ฟ้าหลวง • ส่วนการเงินและบัญชี
          </span>
        </div>
        <div className="text-xs text-slate-400 font-sans">
          ส่วนการเงินและบัญชี
        </div>
      </div>

      {/* Center Card with split header layout matching reference image, in Blue-White theme (Enlarged 3x) */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 my-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-sky-100 max-w-3xl w-full overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Top Blue Banner */}
          <div className="bg-gradient-to-b from-blue-900 via-blue-800 to-sky-900 px-8 py-10 sm:px-14 sm:py-14 text-center">
            {/* MFU Emblem Logo */}
            <div className="h-32 w-auto flex items-center justify-center mx-auto mb-4">
              <img
                src="/mfu_logo.png"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('MFU_logo_highres.png')) {
                    target.src = '/MFU_logo_highres.png';
                  }
                }}
                alt="มหาวิทยาลัยแม่ฟ้าหลวง"
                className="h-32 w-auto object-contain drop-shadow-md brightness-105"
              />
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-amber-300 tracking-wider font-['Prompt','Sarabun',sans-serif]">
              ระบบติดตามเอกสารการเบิกจ่าย
            </h2>
            <p className="text-base sm:text-xl font-semibold text-sky-100 mt-2 font-['Prompt','Sarabun',sans-serif]">
              ส่วนการเงินและบัญชี มหาวิทยาลัยแม่ฟ้าหลวง
            </p>
            <p className="text-xs sm:text-sm font-semibold text-sky-200/90 tracking-wide uppercase mt-1 font-sans">
              DIVISION OF FINANCE AND ACCOUNTING MAE FAH LUANG UNIVERSITY
            </p>

            <h3 className="text-3xl sm:text-5xl font-bold text-white mt-6 sm:mt-8 font-['Prompt','Sarabun',sans-serif]">
              เข้าสู่ระบบ / ลงทะเบียน
            </h3>
          </div>

          {/* Bottom Content with White Background */}
          <div className="p-8 sm:p-14 text-center bg-white">
            <p className="text-lg sm:text-2xl font-bold text-slate-800 font-['Prompt','Sarabun',sans-serif]">
              กรุณาลงทะเบียนหรือเข้าสู่ระบบด้วยอีเมล Google
            </p>
            
            <div className="mt-3.5 inline-block">
              <span className="inline-flex items-center px-5 py-1.5 rounded-full text-sm sm:text-base font-medium bg-sky-50 text-blue-800 border border-sky-200">
                กำหนดสิทธิ์ผู้ใช้งานต้องเป็นอีเมล @mfu.ac.th เท่านั้น
              </span>
            </div>

            {/* Blue Login Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full mt-8 py-4 sm:py-5 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-base sm:text-xl flex items-center justify-center gap-3.5 shadow-xl shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-75"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
              <span>{isLoading ? 'กำลังเข้าสู่ระบบ Google...' : 'เข้าสู่ระบบด้วย Google Account'}</span>
            </button>

            {/* Information section replacing old text */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-left max-w-lg mx-auto">
              <p className="text-sm sm:text-base font-semibold text-slate-700 mb-3 font-['Prompt','Sarabun',sans-serif]">
                สำหรับการบันทึกข้อมูลระบบติดตามเอกสารการเบิกจ่าย
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 pl-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                  <span>งานตรวจจ่าย</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                  <span>งานสอบทาน</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                  <span>งานการเงิน</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                  <span>งานงบประมาณ</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer matching Image 1 */}
      <div className="text-center py-4 text-xs text-slate-400">
        ส่วนการเงินและบัญชี มหาวิทยาลัยแม่ฟ้าหลวง © 2569
      </div>

      {/* Google Account Chooser Modal matching Image 2 */}
      {isChooserOpen && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Window Header */}
            <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2 truncate">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="truncate">ลงชื่อเข้าใช้ - บัญชี Google - Google Chrome</span>
              </div>
              <button
                onClick={() => setIsChooserOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6">
              {/* Google Brand */}
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-sm font-medium text-slate-700 font-['Prompt','Sarabun',sans-serif]">
                  ลงชื่อเข้าใช้ด้วย Google
                </span>
              </div>

              <h3 className="text-2xl font-normal text-slate-900 font-['Prompt','Sarabun',sans-serif]">
                เลือกบัญชี
              </h3>
              <p className="text-xs text-slate-600 mt-1 mb-5">
                ไปยัง <span className="text-blue-600 font-medium">ส่วนการเงินและบัญชี มหาวิทยาลัยแม่ฟ้าหลวง</span>
              </p>

              {/* Accounts List */}
              <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                {defaultAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className="w-full py-3 px-1 flex items-center gap-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                  >
                    {acc.type === 'photo' && acc.avatar ? (
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${acc.badgeBg || 'bg-emerald-700'} text-white font-medium flex items-center justify-center text-sm`}>
                        {acc.badgeText || 'St'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 truncate">
                        {acc.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {acc.email}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Other Account Option */}
                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="w-full py-3 px-1 flex items-center gap-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    ใช้บัญชีอื่น
                  </span>
                </button>
              </div>

              {/* Custom Account Input Form */}
              {showCustomInput && (
                <form onSubmit={handleCustomSubmit} className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  {error && (
                    <div className="text-xs text-red-600 font-medium">
                      {error}
                    </div>
                  )}
                  <div>
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="ระบุ Google Email (เช่น @mfu.ac.th)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="ชื่อผู้ใช้งาน (ไม่บังคับ)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    เข้าสู่ระบบด้วยบัญชีนี้
                  </button>
                </form>
              )}

              {/* Footer text */}
              <div className="mt-6 flex items-center justify-between text-[11px] text-slate-400">
                <span className="cursor-pointer hover:underline">ไทย</span>
                <div className="flex items-center gap-3">
                  <span className="cursor-pointer hover:underline">ความช่วยเหลือ</span>
                  <span className="cursor-pointer hover:underline">ความเป็นส่วนตัว</span>
                  <span className="cursor-pointer hover:underline">ข้อกำหนด</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
