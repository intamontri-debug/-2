import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileSpreadsheet, 
  BarChart, 
  ChevronRight,
  Filter,
  Check,
  Clock,
  CalendarCheck,
  UserX,
  Award
} from 'lucide-react';
import { Student, AttendanceSession, GradeLevel } from '../types';
import { calculateStudentSummary, calculateGradeStats } from '../utils/storage';
import { exportAttendanceToExcel } from '../utils/excelExport';

interface DashboardProps {
  students: Student[];
  sessions: AttendanceSession[];
  onNavigateToRegister: () => void;
  onNavigateToExport: () => void;
  onSelectStudentGuidance?: (student: Student) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  sessions,
  onNavigateToRegister,
  onNavigateToExport
}) => {
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<GradeLevel | 'ALL'>('ALL');

  // Filter students based on selection
  const filteredStudents = students.filter(s => {
    if (selectedGradeFilter !== 'ALL' && s.grade !== selectedGradeFilter) return false;
    return true;
  });

  const studentSummaries = filteredStudents.map(s => calculateStudentSummary(s, sessions));

  // High-level KPI calculations
  const totalStudents = filteredStudents.length;
  const totalPassed = studentSummaries.filter(s => s.passed).length;
  const atRiskStudents = studentSummaries.filter(s => s.isAtRisk || !s.passed);
  const avgAttendance = totalStudents > 0
    ? Math.round(studentSummaries.reduce((a, b) => a + b.attendanceRate, 0) / totalStudents)
    : 100;

  // Breakdown counts across all sessions
  const relevantSessions = sessions.filter(sess => {
    if (selectedGradeFilter !== 'ALL' && sess.grade !== selectedGradeFilter) return false;
    return true;
  });

  let totalPresentCount = 0;
  let totalLateCount = 0;
  let totalLeaveCount = 0;
  let totalAbsentCount = 0;
  let totalActivityCount = 0;

  studentSummaries.forEach(s => {
    totalPresentCount += s.presentCount;
    totalLateCount += s.lateCount;
    totalLeaveCount += s.leaveCount;
    totalAbsentCount += s.absentCount;
    totalActivityCount += s.activityCount;
  });

  const totalLogs = totalPresentCount + totalLateCount + totalLeaveCount + totalAbsentCount + totalActivityCount;

  // Grade-by-grade stats
  const allGrades: GradeLevel[] = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
  const gradeStats = allGrades.map(g => calculateGradeStats(g, students, sessions));

  // Weekly Trend calculation (Weeks 1 - 20)
  const weeklyTrends = Array.from({ length: 20 }, (_, i) => {
    const week = i + 1;
    const weekSessions = relevantSessions.filter(s => s.weekNumber === week);
    if (weekSessions.length === 0) return { week, rate: null, count: 0 };

    let presentLike = 0;
    let totalMarks = 0;

    weekSessions.forEach(s => {
      Object.values(s.records).forEach(status => {
        totalMarks++;
        if (status === 'present' || status === 'activity') presentLike += 1;
        else if (status === 'late') presentLike += 0.8;
      });
    });

    const rate = totalMarks > 0 ? Math.round((presentLike / totalMarks) * 100) : 100;
    return { week, rate, count: totalMarks };
  });

  // Direct Excel Export handler
  const handleQuickExcelExport = () => {
    exportAttendanceToExcel(students, sessions, {
      gradeFilter: selectedGradeFilter
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Filter and Export CTA */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-indigo-600" />
            แดชบอร์ดสรุปผลการเข้าเรียน รายวิชาแนะแนว
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ภาพรวมสถิติการเข้าเรียน สัดส่วนเวลาเรียน และระบบติดตามนักเรียนกลุ่มเสี่ยง มผ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Grade filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <button
              id="filter-grade-all"
              onClick={() => setSelectedGradeFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedGradeFilter === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ม.1-ม.6 ทั้งหมด
            </button>
            {allGrades.map(g => (
              <button
                key={g}
                id={`filter-grade-${g}`}
                onClick={() => setSelectedGradeFilter(g)}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedGradeFilter === g
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Quick Export Button */}
          <button
            id="btn-dashboard-quick-excel"
            onClick={handleQuickExcelExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>โหลด Excel ทันที</span>
          </button>

          <button
            id="btn-dashboard-go-export"
            onClick={onNavigateToExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก Google Sheets</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid with Professional Polish border-l-4 style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Attendance Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              อัตราการเข้าเรียนเฉลี่ย
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{avgAttendance}%</span>
            <span className={`text-xs font-medium ${avgAttendance >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {avgAttendance >= 80 ? 'ผ่านเกณฑ์ (≥80%)' : 'ต่ำกว่าเกณฑ์'}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                avgAttendance >= 80 ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${avgAttendance}%` }}
            />
          </div>
        </div>

        {/* Card 2: Total Students */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              จำนวนนักเรียนทั้งหมด
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-500">คน (ม.1 - ม.6)</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            บันทึกคาบเรียนแล้ว {relevantSessions.length} คาบ
          </p>
        </div>

        {/* Card 3: Passed (ผ.) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ผ่านเกณฑ์เวลาเรียน (ผ.)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">{totalPassed}</span>
            <span className="text-xs text-slate-500">
              ({totalStudents > 0 ? Math.round((totalPassed / totalStudents) * 100) : 100}%)
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            เวลาเข้าร่วมกิจกรรมพัฒนาผู้เรียน ≥ 80%
          </p>
        </div>

        {/* Card 4: At Risk Warning (เสี่ยง มผ.) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              กลุ่มเสี่ยงไม่ผ่าน (มผ.)
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              atRiskStudents.length > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${
              atRiskStudents.length > 0 ? 'text-red-600' : 'text-slate-900'
            }`}>
              {atRiskStudents.length}
            </span>
            <span className="text-xs text-slate-500">คน</span>
          </div>
          <p className="mt-3 text-xs text-red-700 font-medium">
            {atRiskStudents.length > 0 ? 'ต้องนัดหมายให้คำปรึกษาแนะแนว' : 'ไม่มีนักเรียนเสี่ยงในขณะนี้'}
          </p>
        </div>
      </div>

      {/* Breakdown and Grade Comparison Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            สัดส่วนการมาเรียนรวม ({totalLogs} ครั้ง)
          </h3>

          <div className="space-y-3">
            {/* มา */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Check className="w-3.5 h-3.5" /> มาเรียน
                </span>
                <span>{totalPresentCount} ครั้ง ({totalLogs > 0 ? Math.round((totalPresentCount / totalLogs) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${totalLogs > 0 ? (totalPresentCount / totalLogs) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* สาย */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <Clock className="w-3.5 h-3.5" /> มาสาย
                </span>
                <span>{totalLateCount} ครั้ง ({totalLogs > 0 ? Math.round((totalLateCount / totalLogs) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full"
                  style={{ width: `${totalLogs > 0 ? (totalLateCount / totalLogs) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* ลา */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 text-sky-700 font-semibold">
                  <CalendarCheck className="w-3.5 h-3.5" /> ลาป่วย/ลากิจ
                </span>
                <span>{totalLeaveCount} ครั้ง ({totalLogs > 0 ? Math.round((totalLeaveCount / totalLogs) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-sky-500 h-2 rounded-full"
                  style={{ width: `${totalLogs > 0 ? (totalLeaveCount / totalLogs) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* ขาด */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                  <UserX className="w-3.5 h-3.5" /> ขาดเรียน
                </span>
                <span>{totalAbsentCount} ครั้ง ({totalLogs > 0 ? Math.round((totalAbsentCount / totalLogs) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-rose-500 h-2 rounded-full"
                  style={{ width: `${totalLogs > 0 ? (totalAbsentCount / totalLogs) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* กิจกรรม */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 text-purple-700 font-semibold">
                  <Award className="w-3.5 h-3.5" /> กิจกรรม/ภารกิจ
                </span>
                <span>{totalActivityCount} ครั้ง ({totalLogs > 0 ? Math.round((totalActivityCount / totalLogs) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${totalLogs > 0 ? (totalActivityCount / totalLogs) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>กิจกรรมแนะแนว รหัสกิจกรรมพัฒนาผู้เรียน</span>
            <button
              id="btn-dashboard-view-matrix"
              onClick={onNavigateToRegister}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              ดูสมุดเวลาเรียน <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Grade-by-Grade Comparison (ม.1 ถึง ม.6) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            เปรียบเทียบอัตราการเข้าเรียนตามระดับชั้น (ม.1 - ม.6)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gradeStats.map(stat => (
              <div
                key={stat.grade}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">{stat.grade}</span>
                  <span className="text-xs text-slate-500">{stat.totalStudents} คน</span>
                </div>

                <div className="flex items-baseline gap-1 my-1.5">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {stat.avgAttendanceRate}%
                  </span>
                  <span className="text-xs text-slate-500">เวลาเรียน</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full ${
                      stat.avgAttendanceRate >= 80 ? 'bg-indigo-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${stat.avgAttendanceRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>คาบที่บันทึก: {stat.totalSessions}</span>
                  {stat.atRiskCount > 0 ? (
                    <span className="text-amber-700 font-semibold">
                      เสี่ยง {stat.atRiskCount} คน
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">ปกติ</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Guidance Evaluation Criteria Note */}
          <div className="mt-4 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
            <span className="font-bold shrink-0">เกณฑ์ประเมิน:</span>
            <span>
              ตามระเบียบกระทรวงศึกษาธิการ กิจกรรมแนะแนวตัดสินผลเป็น <strong>"ผ่าน (ผ.)"</strong> เมื่อนักเรียนมีเวลาเข้าร่วมไม่น้อยกว่า 80% ของเวลาเรียนทั้งหมด (16 จาก 20 สัปดาห์) และผ่านจุดประสงค์สำคัญ
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Trend Bar Visualization */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              แนวโน้มอัตราการเข้าเรียนรายสัปดาห์ (สัปดาห์ที่ 1 - 20)
            </h3>
            <p className="text-xs text-slate-500">
              กราฟแสดงร้อยละการเข้าเรียนในแต่ละสัปดาห์ของภาคเรียน
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
            เส้นประ = เกณฑ์ผ่าน 80%
          </span>
        </div>

        <div className="h-44 flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-slate-200 relative">
          {/* 80% threshold guideline */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500/60 pointer-events-none z-10"
            style={{ bottom: '80%' }}
          >
            <span className="absolute right-0 -top-4 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
              เกณฑ์ 80%
            </span>
          </div>

          {weeklyTrends.map(item => {
            const hasData = item.rate !== null;
            const rate = item.rate ?? 0;
            const isPassing = rate >= 80;

            return (
              <div
                key={item.week}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Tooltip on hover */}
                {hasData && (
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-9 bg-slate-800 text-white text-[11px] px-2 py-1 rounded shadow-lg pointer-events-none transition-opacity whitespace-nowrap z-20">
                    สัปดาห์ที่ {item.week}: {rate}% ({item.count} คน)
                  </div>
                )}

                {hasData ? (
                  <div
                    className={`w-full max-w-[28px] rounded-t-sm transition-all ${
                      isPassing ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                    style={{ height: `${rate}%` }}
                  />
                ) : (
                  <div className="w-full max-w-[28px] h-1 bg-slate-200 rounded-t-sm" />
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis week labels */}
        <div className="flex gap-1 sm:gap-2 mt-2 text-[10px] text-slate-400 font-mono">
          {weeklyTrends.map(item => (
            <div key={item.week} className="flex-1 text-center">
              W{item.week}
            </div>
          ))}
        </div>
      </div>

      {/* Early Warning / At Risk Student Monitoring List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                ระบบเฝ้าระวังกลุ่มเสี่ยง มผ. (At-Risk Early Warning)
              </h3>
              <p className="text-xs text-slate-500">
                นักเรียนที่มีเวลาเรียนต่ำกว่า 80% หรือขาดเรียนเกินเกณฑ์ที่ต้องได้รับการแนะแนวช่วยเหลือ
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
            พบ {atRiskStudents.length} รายการ
          </span>
        </div>

        {atRiskStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800">ยอดเยี่ยม! ไม่มีนักเรียนกลุ่มเสี่ยง มผ.</p>
            <p className="text-xs text-slate-400 mt-1">นักเรียนทุกคนมีเวลาเข้าร่วมกิจกรรมแนะแนวผ่านเกณฑ์ 80%</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ระดับชั้น/ห้อง</th>
                  <th className="py-3 px-4">เลขที่</th>
                  <th className="py-3 px-4">รหัส</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4 text-center">ขาดเรียน</th>
                  <th className="py-3 px-4 text-center">มาสาย</th>
                  <th className="py-3 px-4 text-center">% เวลาเรียน</th>
                  <th className="py-3 px-4">บันทึกข้อมูลแนะแนว / สาเหตุ</th>
                  <th className="py-3 px-4 text-right">แนวทางช่วยเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atRiskStudents.map(({ student, absentCount, lateCount, attendanceRate }) => (
                  <tr key={student.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {student.grade}/{student.room}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{student.number}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{student.studentCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {student.prefix}{student.firstName} {student.lastName}
                      {student.nickname && <span className="text-slate-500 ml-1">({student.nickname})</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">
                      {absentCount} ครั้ง
                    </td>
                    <td className="py-3 px-4 text-center text-amber-600">
                      {lateCount} ครั้ง
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">
                      {attendanceRate}%
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {student.guidanceNote || 'ยังไม่มีบันทึกสาเหตุ'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-medium">
                        นัดหมายให้คำปรึกษา / ทำงานชดเชย
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
