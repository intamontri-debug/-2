import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  LogOut, 
  Database,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { GoogleSheetsDbInfo } from '../services/googleSheetsDatabase';

interface GoogleSheetsConnectionBarProps {
  isConnected: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  dbInfo: GoogleSheetsDbInfo | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  onCustomSpreadsheetId?: (id: string) => void;
  totalStudents: number;
  totalSessions: number;
}

export const GoogleSheetsConnectionBar: React.FC<GoogleSheetsConnectionBarProps> = ({
  isConnected,
  isConnecting,
  isSyncing,
  dbInfo,
  error,
  onConnect,
  onDisconnect,
  onSync,
  onCustomSpreadsheetId,
  totalStudents,
  totalSessions
}) => {
  const [isEditingSheetId, setIsEditingSheetId] = useState(false);
  const [customIdInput, setCustomIdInput] = useState('');

  const handleSaveCustomId = () => {
    const trimmed = customIdInput.trim();
    if (!trimmed) return;
    // Extract ID from full URL if pasted
    let id = trimmed;
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      id = match[1];
    }
    if (onCustomSpreadsheetId) {
      onCustomSpreadsheetId(id);
    }
    setIsEditingSheetId(false);
    setCustomIdInput('');
  };

  return (
    <div className="bg-white border-b border-slate-200 transition-all">
      {/* If NOT connected: Show Prominent Setup Banner */}
      {!isConnected && (
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white px-4 py-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-white">
                    เชื่อมต่อ Google Sheets เป็นฐานข้อมูลหลัก
                  </h3>
                  <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-medium">
                    Google Workspace
                  </span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm mt-0.5 max-w-2xl leading-relaxed">
                  เชื่อมต่อกับบัญชี Google ของคุณ เพื่อจัดเก็บข้อมูลนักเรียน การเช็คชื่อ 20 สัปดาห์ และบันทึกกิจกรรมแนะแนวลงใน Google Sheets ของคุณจริงอย่างถาวร ใช้งานได้ต่อเนื่องจากทุกอุปกรณ์
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                id="btn-connect-google-sheets"
                onClick={onConnect}
                disabled={isConnecting}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold text-xs sm:text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>กำลังเชื่อมต่อ Google...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ Google Sheets</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsEditingSheetId(!isEditingSheetId)}
                className="px-3 py-2 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors"
                title="ระบุ Spreadsheet ID ด้วยตนเอง"
              >
                มีไฟล์อยู่แล้ว?
              </button>
            </div>
          </div>

          {/* Custom ID drawer when disconnected */}
          {isEditingSheetId && (
            <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
              <span className="text-xs text-slate-300">วาง URL หรือ Spreadsheet ID:</span>
              <input
                type="text"
                value={customIdInput}
                onChange={e => setCustomIdInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="flex-1 max-w-md bg-slate-800 text-white text-xs px-3 py-1.5 rounded border border-slate-700 focus:outline-hidden focus:border-emerald-400"
              />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSaveCustomId}
                  className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded cursor-pointer"
                >
                  ใช้ชีตนี้
                </button>
                <button
                  onClick={() => setIsEditingSheetId(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* If CONNECTED: Show Compact Sleek Status Bar */}
      {isConnected && dbInfo && (
        <div className="bg-emerald-50/70 border-b border-emerald-200/60 px-4 py-2.5 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Left: DB Name and Live Status */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold">ฐานข้อมูล Google Sheets:</span>
              </div>

              <span className="font-semibold text-slate-900 truncate max-w-[240px] sm:max-w-xs">
                {dbInfo.title}
              </span>

              <a
                id="link-open-google-sheet"
                href={dbInfo.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-100/50 px-2 py-0.5 rounded border border-emerald-300 font-medium transition-colors"
                title="เปิดดูและแก้ไขใน Google Sheets"
              >
                <span>เปิดใน Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {/* Data counts badge */}
              <span className="hidden md:inline-block text-slate-500 border-l border-emerald-200 pl-2">
                นักเรียน {totalStudents} คน • บันทึกแล้ว {totalSessions} คาบ
              </span>
            </div>

            {/* Right: Refresh & Switch Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                id="btn-sync-google-sheets"
                onClick={onSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-emerald-100/60 text-slate-700 hover:text-emerald-900 border border-emerald-300 font-medium transition-colors disabled:opacity-50 cursor-pointer"
                title="ดึงข้อมูลล่าสุดจาก Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลล่าสุด'}</span>
              </button>

              <button
                id="btn-disconnect-google-sheets"
                onClick={onDisconnect}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="ออกจากระบบ Google หรือเปลี่ยนบัญชี"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">เปลี่ยนบัญชี</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner if any */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onConnect}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium cursor-pointer"
              >
                เชื่อมต่อใหม่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
