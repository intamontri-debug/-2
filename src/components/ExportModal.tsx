import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  School,
  Layers
} from 'lucide-react';
import { Student, AttendanceSession, GradeLevel } from '../types';
import { exportAttendanceToExcel } from '../utils/excelExport';
import { exportToGoogleSheets, isGoogleConnected } from '../utils/googleSheetsExport';

interface ExportModalProps {
  students: Student[];
  sessions: AttendanceSession[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  students,
  sessions
}) => {
  const [gradeFilter, setGradeFilter] = useState<GradeLevel | 'ALL'>('ALL');
  const [academicYear, setAcademicYear] = useState('2569');
  const [semester, setSemester] = useState('1');
  const [schoolName, setSchoolName] = useState('โรงเรียนมัธยมศึกษา');

  // Status states
  const [excelDownloading, setExcelDownloading] = useState(false);
  const [excelSuccessFile, setExcelSuccessFile] = useState<string | null>(null);

  const [sheetsSyncing, setSheetsSyncing] = useState(false);
  const [sheetsResult, setSheetsResult] = useState<{ url: string; title: string } | null>(null);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  const grades: (GradeLevel | 'ALL')[] = ['ALL', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

  // Handle Excel (.xlsx) Download
  const handleDownloadExcel = () => {
    try {
      setExcelDownloading(true);
      setExcelSuccessFile(null);

      const fileName = exportAttendanceToExcel(students, sessions, {
        gradeFilter,
        academicYear,
        semester,
        schoolName
      });

      setExcelSuccessFile(fileName);
    } catch (err: any) {
      console.error('Export Excel failed:', err);
    } finally {
      setExcelDownloading(false);
    }
  };

  // Handle Google Sheets Export
  const handleExportGoogleSheets = async () => {
    try {
      setSheetsSyncing(true);
      setSheetsError(null);
      setSheetsResult(null);

      const res = await exportToGoogleSheets(students, sessions, {
        gradeFilter,
        academicYear,
        semester
      });

      setSheetsResult({ url: res.url, title: res.title });
    } catch (err: any) {
      console.error('Export Google Sheets error:', err);
      setSheetsError(err.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSheetsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              ศูนย์ส่งออกรายงานผลการเข้าเรียน (Excel & Google Sheets)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              สร้างไฟล์รายงานสรุปเวลาเรียน 20 สัปดาห์ พร้อมผลการประเมิน ผ./มผ. ตามเกณฑ์กระทรวงศึกษาธิการ
            </p>
          </div>
        </div>
      </div>

      {/* Export Settings Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <School className="w-4 h-4 text-indigo-600" />
          กำหนดค่าข้อมูลรายงาน
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ระดับชั้นที่ต้องการส่งออก
            </label>
            <select
              id="select-export-grade"
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">ม.1 - ม.6 (ทุกระดับชั้น)</option>
              <option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option>
              <option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option>
              <option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option>
              <option value="ม.4">มัธยมศึกษาปีที่ 4 (ม.4)</option>
              <option value="ม.5">มัธยมศึกษาปีที่ 5 (ม.5)</option>
              <option value="ม.6">มัธยมศึกษาปีที่ 6 (ม.6)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ภาคเรียนที่ (Semester)
            </label>
            <select
              id="select-export-semester"
              value={semester}
              onChange={e => setSemester(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="1">ภาคเรียนที่ 1</option>
              <option value="2">ภาคเรียนที่ 2</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ปีการศึกษา (พ.ศ.)
            </label>
            <input
              id="input-export-year"
              type="text"
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              placeholder="เช่น 2569"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ชื่อสถานศึกษา / โรงเรียน
            </label>
            <input
              id="input-export-school"
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              placeholder="เช่น โรงเรียนสาธิต..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Two Export Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Channel 1: Excel (.xlsx) Download */}
        <div className="bg-white rounded-xl border-2 border-emerald-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                ดาวน์โหลดไฟล์ทันที
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              ส่งออกเป็นไฟล์ Microsoft Excel (.xlsx)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              สร้างไฟล์สเปรดชีต Excel มาตรฐาน สามารถเปิดใช้งานใน Microsoft Excel, LibreOffice หรือ Numbers ได้ทันที มี 3 ชีตในไฟล์เดียว:
            </p>

            <ul className="space-y-2 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>ชีต 1: สรุปผลเวลาเรียน</strong> - สถิติ มา/สาย/ลา/ขาด, % เวลาเรียน, ผล ผ./มผ.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>ชีต 2: บันทึกรายสัปดาห์</strong> - ตารางเช็คชื่อครบ 20 สัปดาห์ (พร้อมสัญลักษณ์)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>ชีต 3: กลุ่มเสี่ยง มผ.</strong> - บัญชีรายชื่อนักเรียนที่ต้องติดตามแนะแนว</span>
              </li>
            </ul>
          </div>

          <div>
            <button
              id="btn-export-excel-file"
              onClick={handleDownloadExcel}
              disabled={excelDownloading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{excelDownloading ? 'กำลังสร้างไฟล์ Excel...' : 'ดาวน์โหลดรายงาน Excel (.xlsx) อัตโนมัติ'}</span>
            </button>

            {excelSuccessFile && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ดาวน์โหลดสำเร็จ: <strong>{excelSuccessFile}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Channel 2: Google Sheets Sync */}
        <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Google Workspace
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              ส่งออกไปยัง Google Sheets อัตโนมัติ
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              สร้าง Google Spreadsheet ใน Google Drive ของคุณโดยอัตโนมัติ ซิงค์ข้อมูลพร้อมเข้าถึงและแชร์กับคุณครูท่านอื่นผ่านออนไลน์ได้ตลอดเวลา:
            </p>

            <ul className="space-y-2 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>สร้างไฟล์ใหม่บน Google Drive โดยตรง</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>เชื่อมต่อผ่าน Google Identity Services (OAuth) ปลอดภัย 100%</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>คลิกครั้งเดียวเปิดแก้ไขและแชร์ลิงก์ได้ทันที</span>
              </li>
            </ul>
          </div>

          <div>
            <button
              id="btn-export-google-sheets"
              onClick={handleExportGoogleSheets}
              disabled={sheetsSyncing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{sheetsSyncing ? 'กำลังสร้าง Google Sheets...' : 'ส่งออกไปยัง Google Sheets'}</span>
            </button>

            {sheetsResult && (
              <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>สร้าง Google Sheets เรียบร้อยแล้ว!</span>
                </div>
                <p className="text-[11px] text-emerald-700 mb-2">
                  ชื่อไฟล์: {sheetsResult.title}
                </p>
                <a
                  id="link-open-created-google-sheet"
                  href={sheetsResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors"
                >
                  <span>เปิดดูใน Google Sheets ทันที</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {sheetsError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{sheetsError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
