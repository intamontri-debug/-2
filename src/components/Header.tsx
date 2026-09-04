import React from 'react';
import { 
  FileSpreadsheet, 
  Menu, 
  X,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Student, AttendanceSession, GradeLevel } from '../types';
import { calculateStudentSummary } from '../utils/storage';
import { exportAttendanceToExcel } from '../utils/excelExport';

interface HeaderProps {
  activeTab: 'check' | 'dashboard' | 'register' | 'export' | 'students';
  setActiveTab: (tab: 'check' | 'dashboard' | 'register' | 'export' | 'students') => void;
  students: Student[];
  sessions: AttendanceSession[];
  selectedGrade: GradeLevel;
  selectedRoom: string;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  students,
  sessions,
  selectedGrade,
  selectedRoom,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen
}) => {
  // Global quick metrics
  const totalStudents = students.length;
  const summaries = students.map(s => calculateStudentSummary(s, sessions));
  const avgAttendance = totalStudents > 0
    ? Math.round(summaries.reduce((a, b) => a + b.attendanceRate, 0) / totalStudents)
    : 100;
  const atRiskCount = summaries.filter(s => s.isAtRisk).length;

  // Compute page title based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 'check':
        return `บันทึกการเข้าเรียน ${selectedGrade}/${selectedRoom}`;
      case 'dashboard':
        return 'แดชบอร์ดสรุปผลการเข้าเรียน';
      case 'register':
        return `สมุดบันทึกเวลาเรียน 20 สัปดาห์ ${selectedGrade}/${selectedRoom}`;
      case 'export':
        return 'ศูนย์ส่งออกรายงาน (Excel & Google Sheets)';
      case 'students':
        return `จัดการข้อมูลนักเรียน ${selectedGrade}/${selectedRoom}`;
      default:
        return 'ระบบบันทึกเวลาเรียนวิชาแนะแนว';
    }
  };

  // Quick Excel Export handler
  const handleQuickExcel = () => {
    exportAttendanceToExcel(students, sessions, {
      gradeFilter: selectedGrade,
      roomFilter: activeTab === 'check' || activeTab === 'register' || activeTab === 'students' ? selectedRoom : undefined
    });
  };

  // Current Thai Date string (e.g. 25 พฤษภาคม 2567 / วันปัจจุบัน)
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const now = new Date();
  const currentThaiDate = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile hamburger & View Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          id="btn-toggle-mobile-sidebar"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md font-medium border border-slate-200">
            ภาคเรียนที่ 1/2569
          </span>
        </div>
      </div>

      {/* Right: Quick Stats, Excel Export button, and Thai Date */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Stat Badges */}
        <div className="hidden xl:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>นักเรียน {totalStudents} คน</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span>เข้าเรียน {avgAttendance}%</span>
          </div>

          {atRiskCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>เสี่ยง {atRiskCount} คน</span>
            </div>
          )}
        </div>

        {/* Quick Excel Export Action */}
        <button
          id="btn-header-quick-excel"
          onClick={handleQuickExcel}
          className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-md shadow-xs flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer"
          title="ดาวน์โหลดรายงาน Excel ทันที"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">ส่งออกรายงาน (Excel)</span>
          <span className="sm:hidden">Excel</span>
        </button>

        {/* Thai Date Display */}
        <div className="hidden md:block text-slate-400 text-xs sm:text-sm font-medium border-l border-slate-200 pl-3">
          {currentThaiDate}
        </div>
      </div>
    </header>
  );
};
