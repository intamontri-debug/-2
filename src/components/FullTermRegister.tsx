import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Search, 
  Check, 
  Clock, 
  UserX, 
  CalendarCheck, 
  Award,
  Filter
} from 'lucide-react';
import { Student, AttendanceSession, GradeLevel } from '../types';
import { calculateStudentSummary } from '../utils/storage';
import { exportAttendanceToExcel } from '../utils/excelExport';

interface FullTermRegisterProps {
  students: Student[];
  sessions: AttendanceSession[];
  selectedGrade: GradeLevel;
  setSelectedGrade: (g: GradeLevel) => void;
  selectedRoom: string;
  setSelectedRoom: (r: string) => void;
}

export const FullTermRegister: React.FC<FullTermRegisterProps> = ({
  students,
  sessions,
  selectedGrade,
  setSelectedGrade,
  selectedRoom,
  setSelectedRoom
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const grades: GradeLevel[] = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
  const availableRooms = Array.from(
    new Set(students.filter(s => s.grade === selectedGrade).map(s => s.room))
  ).sort();

  const classStudents = students
    .filter(s => s.grade === selectedGrade && s.room === selectedRoom)
    .sort((a, b) => a.number - b.number);

  const filteredStudents = classStudents.filter(s => {
    const q = searchQuery.toLowerCase();
    const name = `${s.prefix}${s.firstName} ${s.lastName}`.toLowerCase();
    return name.includes(q) || s.studentCode.includes(q) || s.number.toString() === q;
  });

  // Get sessions for this specific grade and room
  const classSessions = sessions.filter(
    s => s.grade === selectedGrade && s.room === selectedRoom
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportThisRoomExcel = () => {
    exportAttendanceToExcel(students, sessions, {
      gradeFilter: selectedGrade,
      roomFilter: selectedRoom
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Grade selection */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            {grades.map(g => (
              <button
                key={g}
                id={`register-grade-${g}`}
                onClick={() => setSelectedGrade(g)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedGrade === g
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Room selection */}
          <div className="flex items-center gap-1.5">
            {availableRooms.map(rm => (
              <button
                key={rm}
                id={`register-room-${rm}`}
                onClick={() => setSelectedRoom(rm)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedRoom === rm
                    ? 'bg-sky-50 border-sky-400 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ห้อง {rm} ({selectedGrade}/{rm})
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-register"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหานักเรียน..."
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
            />
          </div>

          <button
            id="btn-print-register"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-xs cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">พิมพ์สมุด</span>
          </button>

          <button
            id="btn-export-this-room-excel"
            onClick={handleExportThisRoomExcel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก Excel ห้องนี้</span>
          </button>
        </div>
      </div>

      {/* Symbol Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
        <span className="font-semibold text-slate-800">สัญลักษณ์เวลาเรียน:</span>
        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
          <span className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center font-bold">✓</span> มาเรียน
        </span>
        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
          <span className="w-4 h-4 rounded bg-amber-100 flex items-center justify-center font-bold">ส</span> มาสาย
        </span>
        <span className="inline-flex items-center gap-1 text-sky-700 font-medium">
          <span className="w-4 h-4 rounded bg-sky-100 flex items-center justify-center font-bold">ล</span> ลา
        </span>
        <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
          <span className="w-4 h-4 rounded bg-rose-100 flex items-center justify-center font-bold">ข</span> ขาด
        </span>
        <span className="inline-flex items-center gap-1 text-purple-700 font-medium">
          <span className="w-4 h-4 rounded bg-purple-100 flex items-center justify-center font-bold">ก</span> กิจกรรมโรงเรียน
        </span>
        <span className="ml-auto text-[11px] text-slate-500">
          เกณฑ์ผ่าน: เวลาเรียน ≥ 80% (ผ. / มผ.)
        </span>
      </div>

      {/* 20-Week Attendance Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 sticky left-0 bg-slate-100 z-10 w-12 text-center border-r border-slate-200">
                  เลขที่
                </th>
                <th className="py-2.5 px-3 sticky left-12 bg-slate-100 z-10 w-24 border-r border-slate-200">
                  รหัส
                </th>
                <th className="py-2.5 px-3 sticky left-36 bg-slate-100 z-10 min-w-[160px] border-r border-slate-200">
                  ชื่อ - นามสกุล
                </th>

                {/* Weeks 1 - 20 headers */}
                {Array.from({ length: 20 }, (_, i) => i + 1).map(w => (
                  <th
                    key={w}
                    className="py-2 px-1.5 text-center min-w-[32px] border-r border-slate-200 font-medium text-[11px]"
                    title={`สัปดาห์ที่ ${w}`}
                  >
                    W{w}
                  </th>
                ))}

                {/* Summary columns */}
                <th className="py-2.5 px-2 text-center bg-emerald-50 text-emerald-800 border-r border-slate-200 min-w-[42px]">
                  มา
                </th>
                <th className="py-2.5 px-2 text-center bg-rose-50 text-rose-800 border-r border-slate-200 min-w-[42px]">
                  ขาด
                </th>
                <th className="py-2.5 px-2 text-center bg-slate-50 font-bold text-slate-800 border-r border-slate-200 min-w-[54px]">
                  % รวม
                </th>
                <th className="py-2.5 px-3 text-center bg-slate-50 font-bold text-slate-800 min-w-[60px]">
                  ผล
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredStudents.map(student => {
                const summary = calculateStudentSummary(student, sessions);

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Fixed left headers */}
                    <td className="py-2 px-3 text-center sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-200 font-semibold text-slate-700">
                      {student.number}
                    </td>
                    <td className="py-2 px-3 sticky left-12 bg-white hover:bg-slate-50 z-10 border-r border-slate-200 text-slate-500">
                      {student.studentCode}
                    </td>
                    <td className="py-2 px-3 sticky left-36 bg-white hover:bg-slate-50 z-10 border-r border-slate-200 font-sans font-medium text-slate-900 whitespace-nowrap">
                      {student.prefix}{student.firstName} {student.lastName}
                      {student.nickname && <span className="text-slate-400 font-normal ml-1">({student.nickname})</span>}
                    </td>

                    {/* Weeks 1 - 20 indicators */}
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(w => {
                      const session = classSessions.find(s => s.weekNumber === w);
                      const status = session ? session.records[student.id] : undefined;

                      let cellContent = '-';
                      let cellClass = 'text-slate-300';

                      if (status === 'present') {
                        cellContent = '✓';
                        cellClass = 'text-emerald-700 bg-emerald-50 font-bold';
                      } else if (status === 'late') {
                        cellContent = 'ส';
                        cellClass = 'text-amber-700 bg-amber-50 font-bold';
                      } else if (status === 'leave') {
                        cellContent = 'ล';
                        cellClass = 'text-sky-700 bg-sky-50 font-bold';
                      } else if (status === 'absent') {
                        cellContent = 'ข';
                        cellClass = 'text-rose-700 bg-rose-100 font-extrabold';
                      } else if (status === 'activity') {
                        cellContent = 'ก';
                        cellClass = 'text-purple-700 bg-purple-50 font-bold';
                      }

                      return (
                        <td
                          key={w}
                          className={`py-1.5 px-1 text-center border-r border-slate-100 text-xs ${cellClass}`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}

                    {/* Summary columns */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-50/50 font-bold text-emerald-800">
                      {summary.presentCount + summary.activityCount}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-200 bg-rose-50/50 font-bold text-rose-700">
                      {summary.absentCount}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-bold text-slate-900">
                      {summary.attendanceRate}%
                    </td>
                    <td className="py-2 px-3 text-center font-sans font-bold">
                      {summary.passed ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px]">
                          ผ. (ผ่าน)
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px]">
                          มผ.
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
