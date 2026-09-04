/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  CheckSquare, 
  BarChart3, 
  Calendar, 
  FileSpreadsheet, 
  Users, 
  ChevronRight,
  Database,
  LogIn,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Student, AttendanceSession, GradeLevel } from './types';
import { 
  connectGoogleAccount, 
  disconnectGoogleAccount, 
  getValidAccessToken, 
  getOrCreateDatabaseSpreadsheet,
  getSpreadsheetById,
  loadDataFromGoogleSheets, 
  saveSessionToGoogleSheets, 
  saveStudentsToGoogleSheets, 
  GoogleSheetsDbInfo 
} from './services/googleSheetsDatabase';
import { INITIAL_STUDENTS, INITIAL_SESSIONS } from './data/initialData';
import { Header } from './components/Header';
import { AttendanceCheck } from './components/AttendanceCheck';
import { Dashboard } from './components/Dashboard';
import { FullTermRegister } from './components/FullTermRegister';
import { ExportModal } from './components/ExportModal';
import { StudentManager } from './components/StudentManager';
import { GoogleSheetsConnectionBar } from './components/GoogleSheetsConnectionBar';

const SPREADSHEET_ID_STORAGE_KEY = 'guidance_active_spreadsheet_id';

export default function App() {
  // Primary state strictly hydrated from Google Sheets
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  
  // Google Sheets database connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbInfo, setDbInfo] = useState<GoogleSheetsDbInfo | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // Navigation and filters
  const [activeTab, setActiveTab] = useState<'check' | 'dashboard' | 'register' | 'export' | 'students'>('check');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('ม.4');
  const [selectedRoom, setSelectedRoom] = useState<string>('1');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const grades: { level: GradeLevel; label: string }[] = [
    { level: 'ม.1', label: 'มัธยมศึกษาปีที่ 1' },
    { level: 'ม.2', label: 'มัธยมศึกษาปีที่ 2' },
    { level: 'ม.3', label: 'มัธยมศึกษาปีที่ 3' },
    { level: 'ม.4', label: 'มัธยมศึกษาปีที่ 4' },
    { level: 'ม.5', label: 'มัธยมศึกษาปีที่ 5' },
    { level: 'ม.6', label: 'มัธยมศึกษาปีที่ 6' },
  ];

  // Connect to Google Sheets and load database
  const handleConnectGoogle = async (customSpreadsheetId?: string) => {
    try {
      setIsConnecting(true);
      setDbError(null);

      // 1. Get OAuth access token for Google Sheets and Google Drive
      const { token } = await connectGoogleAccount(true);

      // 2. Either use specified spreadsheet ID or find/create the Guidance Database
      let targetDb: GoogleSheetsDbInfo;
      if (customSpreadsheetId) {
        targetDb = await getSpreadsheetById(token, customSpreadsheetId);
      } else {
        const savedId = localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY);
        if (savedId) {
          try {
            targetDb = await getSpreadsheetById(token, savedId);
          } catch {
            targetDb = await getOrCreateDatabaseSpreadsheet(token);
          }
        } else {
          targetDb = await getOrCreateDatabaseSpreadsheet(token);
        }
      }

      setDbInfo(targetDb);
      localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, targetDb.spreadsheetId);

      // 3. Hydrate live data from Google Sheets
      setIsSyncing(true);
      const data = await loadDataFromGoogleSheets(token, targetDb.spreadsheetId);
      setStudents(data.students);
      setSessions(data.sessions);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Failed to connect Google Sheets database:', err);
      setDbError(err.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้ กรุณาลองใหม่อีกครั้ง');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
      setIsSyncing(false);
    }
  };

  // Sync / Refresh data from Google Sheets
  const handleSyncGoogleSheets = async () => {
    if (!dbInfo) {
      handleConnectGoogle();
      return;
    }

    try {
      setIsSyncing(true);
      setDbError(null);
      const { token } = await connectGoogleAccount(false);
      const data = await loadDataFromGoogleSheets(token, dbInfo.spreadsheetId);
      setStudents(data.students);
      setSessions(data.sessions);
    } catch (err: any) {
      console.error('Error syncing Google Sheets:', err);
      setDbError('ซิงค์ข้อมูลล้มเหลว: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Disconnect Google Account
  const handleDisconnect = () => {
    disconnectGoogleAccount();
    setIsConnected(false);
    setDbInfo(null);
    setStudents([]);
    setSessions([]);
  };

  // Save session directly to Google Sheets with duplicate prevention
  const handleSaveSession = async (newSession: AttendanceSession) => {
    if (!isConnected || !dbInfo) {
      await handleConnectGoogle();
      throw new Error('กรุณาเข้าสู่ระบบ Google เพื่อเชื่อมต่อ Google Sheets ฐานข้อมูลหลักก่อนทำการบันทึก');
    }

    try {
      const result = await saveSessionToGoogleSheets(newSession, dbInfo.spreadsheetId);
      
      // Update local state with the confirmed saved session
      setSessions(prev => {
        const index = prev.findIndex(
          s => s.id === newSession.id || 
          (s.grade === newSession.grade && s.room === newSession.room && s.weekNumber === newSession.weekNumber)
        );
        if (index >= 0) {
          const next = [...prev];
          next[index] = newSession;
          return next;
        }
        return [...prev, newSession];
      });

      return result;
    } catch (err: any) {
      console.error('Failed to save session to Google Sheets:', err);
      throw err;
    }
  };

  // Save students directly to Google Sheets
  const handleSaveStudents = async (updatedStudents: Student[]) => {
    if (!isConnected || !dbInfo) {
      await handleConnectGoogle();
      throw new Error('กรุณาเข้าสู่ระบบ Google เพื่อเชื่อมต่อ Google Sheets ฐานข้อมูลหลักก่อนทำการบันทึก');
    }

    try {
      await saveStudentsToGoogleSheets(updatedStudents, dbInfo.spreadsheetId);
      setStudents(updatedStudents);
    } catch (err: any) {
      console.error('Failed to save students to Google Sheets:', err);
      throw err;
    }
  };

  // Reset to initial sample data into Google Sheets
  const handleResetDefaults = async () => {
    if (!isConnected || !dbInfo) {
      await handleConnectGoogle();
      return;
    }

    try {
      setIsSyncing(true);
      await saveStudentsToGoogleSheets(INITIAL_STUDENTS, dbInfo.spreadsheetId);
      for (const s of INITIAL_SESSIONS) {
        await saveSessionToGoogleSheets(s, dbInfo.spreadsheetId);
      }
      setStudents(INITIAL_STUDENTS);
      setSessions(INITIAL_SESSIONS);
    } catch (err: any) {
      alert('รีเซ็ตข้อมูลไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems = [
    { id: 'check' as const, label: 'บันทึกการเข้าเรียน', icon: CheckSquare },
    { id: 'dashboard' as const, label: 'แดชบอร์ดสรุปสถิติ', icon: BarChart3 },
    { id: 'register' as const, label: 'สมุดเวลาเรียน 20 สัปดาห์', icon: Calendar },
    { id: 'export' as const, label: 'ส่งออกรายงาน (Excel/Sheets)', icon: FileSpreadsheet },
    { id: 'students' as const, label: 'จัดการข้อมูลนักเรียน', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Professional Polish Dark Sidebar */}
      <aside 
        className={`w-64 bg-slate-900 flex flex-col shrink-0 z-40 fixed inset-y-0 left-0 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 overflow-y-auto flex-1 scrollbar-none">
          {/* Logo & App Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center text-white font-bold text-base shadow-sm">
              G
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg tracking-tight leading-none">
                Guidance App
              </h1>
              <p className="text-slate-500 text-xs mt-1">วิชาแนะแนว ม.1 - ม.6</p>
            </div>
          </div>

          {/* Main Navigation Section */}
          <nav className="space-y-1 mb-8">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2.5 px-3">
              เมนูการทำงาน
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Grade Level Selector Section */}
          <div className="space-y-1">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2.5 px-3">
              ระดับชั้น
            </div>
            {grades.map(g => {
              const isSelected = selectedGrade === g.level;
              return (
                <button
                  key={g.level}
                  id={`sidebar-grade-${g.level}`}
                  onClick={() => {
                    setSelectedGrade(g.level);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span>{g.label}</span>
                  {isSelected && <ChevronRight className="w-4 h-4 text-white/80" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Teacher Profile Footer Card & Database Status */}
        <div className="mt-auto p-5 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium text-sm shrink-0">
              ครู
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">อ. วีรภัทร ใจดี</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <p className="text-xs text-slate-400 truncate">
                  {isConnected ? 'เชื่อมต่อ Google Sheets แล้ว' : 'ยังไม่เชื่อมต่อ Sheets'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          students={students}
          sessions={sessions}
          selectedGrade={selectedGrade}
          selectedRoom={selectedRoom}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />

        {/* Google Sheets Primary Database Connection Bar */}
        <GoogleSheetsConnectionBar
          isConnected={isConnected}
          isConnecting={isConnecting}
          isSyncing={isSyncing}
          dbInfo={dbInfo}
          error={dbError}
          onConnect={() => handleConnectGoogle()}
          onDisconnect={handleDisconnect}
          onSync={handleSyncGoogleSheets}
          onCustomSpreadsheetId={(id) => handleConnectGoogle(id)}
          totalStudents={students.length}
          totalSessions={sessions.length}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* If NOT connected: Show friendly initial callout card */}
          {!isConnected && (
            <div className="mb-6 p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      ระบบใช้งาน Google Sheets เป็นฐานข้อมูลหลักจริง
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      ข้อมูลนักเรียน ห้องเรียน การเช็คชื่อ 20 สัปดาห์ และบันทึกกิจกรรมแนะแนวทั้งหมดจะถูกบันทึกไว้ใน Google Drive ของคุณโดยตรง สามารถเปิดใช้งานได้จากอุปกรณ์อื่นได้ตลอดเวลา
                    </p>
                  </div>
                </div>

                <button
                  id="btn-main-connect-google"
                  onClick={() => handleConnectGoogle()}
                  disabled={isConnecting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>กำลังเชื่อมต่อ...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>เข้าสู่ระบบเพื่อโหลดข้อมูล</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'check' && (
            <AttendanceCheck
              students={students}
              sessions={sessions}
              onSaveSession={handleSaveSession}
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}
              isConnectedToSheets={isConnected}
              onConnectSheets={() => handleConnectGoogle()}
              spreadsheetTitle={dbInfo?.title}
              spreadsheetUrl={dbInfo?.url}
            />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              students={students}
              sessions={sessions}
              onNavigateToRegister={() => setActiveTab('register')}
              onNavigateToExport={() => setActiveTab('export')}
            />
          )}

          {activeTab === 'register' && (
            <FullTermRegister
              students={students}
              sessions={sessions}
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}
            />
          )}

          {activeTab === 'export' && (
            <ExportModal
              students={students}
              sessions={sessions}
            />
          )}

          {activeTab === 'students' && (
            <StudentManager
              students={students}
              onSaveStudents={handleSaveStudents}
              onResetDefaults={handleResetDefaults}
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}
              isConnectedToSheets={isConnected}
            />
          )}
        </main>

        {/* Bottom Status & Info Bar */}
        <footer className="border-t border-slate-200 bg-white py-3 px-6 sm:px-8 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              ระบบสารสนเทศเช็คชื่อและประเมินผลกิจกรรมแนะแนว ชั้นมัธยมศึกษาปีที่ 1 - 6
            </div>
            <div className="flex items-center gap-3">
              <span>ฐานข้อมูล: Google Sheets (Cloud Persistence)</span>
              <span>•</span>
              <span>เกณฑ์ประเมิน: ผ่าน (ผ.) เวลาเรียน ≥ 80%</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
