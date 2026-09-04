import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Clock, 
  UserX, 
  CalendarCheck, 
  Award, 
  Save, 
  CheckCheck, 
  MessageSquare, 
  BookOpen, 
  Search,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  LogIn,
  Info
} from 'lucide-react';
import { Student, AttendanceSession, GradeLevel, AttendanceStatus } from '../types';
import { GUIDANCE_TOPICS_20_WEEKS } from '../data/guidanceTopics';

interface AttendanceCheckProps {
  students: Student[];
  sessions: AttendanceSession[];
  onSaveSession: (session: AttendanceSession) => Promise<{ success: boolean; isUpdate?: boolean; message?: string } | void> | void;
  selectedGrade: GradeLevel;
  setSelectedGrade: (g: GradeLevel) => void;
  selectedRoom: string;
  setSelectedRoom: (r: string) => void;
  isConnectedToSheets?: boolean;
  onConnectSheets?: () => void;
  spreadsheetTitle?: string;
  spreadsheetUrl?: string;
}

export const AttendanceCheck: React.FC<AttendanceCheckProps> = ({
  students,
  sessions,
  onSaveSession,
  selectedGrade,
  setSelectedGrade,
  selectedRoom,
  setSelectedRoom,
  isConnectedToSheets = false,
  onConnectSheets,
  spreadsheetTitle,
  spreadsheetUrl
}) => {
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [topic, setTopic] = useState<string>('');
  const [teacherNotes, setTeacherNotes] = useState<string>('');
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [openRemarkStudentId, setOpenRemarkStudentId] = useState<string | null>(null);

  // Check if session for this week already exists in database
  const existingSession = sessions.find(
    s => s.grade === selectedGrade && s.room === selectedRoom && s.weekNumber === weekNumber
  );

  // Available grades and rooms
  const grades: GradeLevel[] = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
  
  // Calculate rooms available for current grade
  const availableRooms = Array.from(
    new Set(students.filter(s => s.grade === selectedGrade).map(s => s.room))
  ).sort();

  // If currently selected room is not available, pick first
  useEffect(() => {
    if (availableRooms.length > 0 && !availableRooms.includes(selectedRoom)) {
      setSelectedRoom(availableRooms[0]);
    }
  }, [selectedGrade, availableRooms, selectedRoom, setSelectedRoom]);

  // Current classroom students
  const classStudents = students
    .filter(s => s.grade === selectedGrade && s.room === selectedRoom)
    .sort((a, b) => a.number - b.number);

  // Update default topic when week changes
  useEffect(() => {
    const predefined = GUIDANCE_TOPICS_20_WEEKS.find(t => t.week === weekNumber);
    if (predefined) {
      setTopic(predefined.title);
    }
  }, [weekNumber]);

  // Load existing session if previously saved
  useEffect(() => {
    const existing = sessions.find(
      s => s.grade === selectedGrade && s.room === selectedRoom && s.weekNumber === weekNumber
    );

    if (existing) {
      setDate(existing.date);
      setTopic(existing.topic);
      setTeacherNotes(existing.teacherNotes || '');
      setRecords(existing.records || {});
      setRemarks(existing.remarks || {});
    } else {
      // Initialize all class students to 'present' by default
      const initialMap: Record<string, AttendanceStatus> = {};
      classStudents.forEach(s => {
        initialMap[s.id] = 'present';
      });
      setRecords(initialMap);
      setRemarks({});
      setTeacherNotes('');
    }
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  }, [selectedGrade, selectedRoom, weekNumber, sessions]);

  // Handle single status change
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Mark all as present
  const handleMarkAllPresent = () => {
    const nextMap: Record<string, AttendanceStatus> = {};
    classStudents.forEach(s => {
      nextMap[s.id] = 'present';
    });
    setRecords(nextMap);
  };

  // Remark change
  const handleRemarkChange = (studentId: string, text: string) => {
    setRemarks(prev => ({
      ...prev,
      [studentId]: text
    }));
  };

  // Save session with duplicate check and Google Sheets persistence
  const handleSave = async () => {
    if (!isConnectedToSheets) {
      if (onConnectSheets) {
        onConnectSheets();
      } else {
        setSaveErrorMsg('กรุณาเข้าสู่ระบบ Google เพื่อเชื่อมต่อ Google Sheets ฐานข้อมูลหลัก');
      }
      return;
    }

    try {
      setIsSaving(true);
      setSaveErrorMsg(null);
      setSaveSuccessMsg(null);

      const sessionId = existingSession ? existingSession.id : `ses-${selectedGrade.replace('.', '')}-${selectedRoom}-w${weekNumber}`;
      const newSession: AttendanceSession = {
        id: sessionId,
        date,
        grade: selectedGrade,
        room: selectedRoom,
        weekNumber,
        topic: topic || `กิจกรรมแนะแนว สัปดาห์ที่ ${weekNumber}`,
        teacherNotes,
        records,
        remarks,
        updatedAt: new Date().toISOString()
      };

      const result = await onSaveSession(newSession);
      const isUpd = result && typeof result === 'object' && result.isUpdate;
      const msg = (result && typeof result === 'object' && result.message) 
        ? result.message 
        : isUpd 
          ? `อัปเดตข้อมูลคาบเรียนเดิมลง Google Sheets สำเร็จ (ป้องกันการบันทึกซ้ำ)` 
          : `บันทึกคาบเรียนใหม่ลง Google Sheets สำเร็จ`;
      
      setSaveSuccessMsg(msg);
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Save attendance session error:', err);
      setSaveErrorMsg(err.message || 'ไม่สามารถบันทึกลง Google Sheets ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter students by search
  const filteredStudents = classStudents.filter(s => {
    const q = searchQuery.toLowerCase();
    const fullName = `${s.prefix}${s.firstName} ${s.lastName}`.toLowerCase();
    const nickname = (s.nickname || '').toLowerCase();
    const code = s.studentCode.toLowerCase();
    return fullName.includes(q) || nickname.includes(q) || code.includes(q) || s.number.toString() === q;
  });

  // Current session counts
  const presentCount = Object.values(records).filter(st => st === 'present').length;
  const lateCount = Object.values(records).filter(st => st === 'late').length;
  const leaveCount = Object.values(records).filter(st => st === 'leave').length;
  const absentCount = Object.values(records).filter(st => st === 'absent').length;
  const activityCount = Object.values(records).filter(st => st === 'activity').length;
  const totalInClass = classStudents.length;

  return (
    <div className="space-y-6">
      {/* Grade and Room Selection Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Level Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              เลือกระดับชั้น (มัธยมศึกษาปีที่ 1 - 6)
            </label>
            <div className="inline-flex p-1 bg-slate-100 rounded-lg gap-1 flex-wrap">
              {grades.map(g => (
                <button
                  key={g}
                  id={`btn-select-grade-${g}`}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    selectedGrade === g
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Room Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              ห้องเรียน
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {availableRooms.length > 0 ? (
                availableRooms.map(rm => (
                  <button
                    key={rm}
                    id={`btn-select-room-${rm}`}
                    onClick={() => setSelectedRoom(rm)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                      selectedRoom === rm
                        ? 'bg-sky-50 border-sky-400 text-sky-800 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ห้อง {rm} ({selectedGrade}/{rm})
                  </button>
                ))
              ) : (
                <span className="text-sm text-slate-400">ไม่มีข้อมูลห้อง</span>
              )}
            </div>
          </div>

          {/* Week / Period Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              สัปดาห์ / คาบที่ (1 - 20)
            </label>
            <div className="flex items-center gap-2">
              <select
                id="select-week-number"
                value={weekNumber}
                onChange={e => setWeekNumber(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>
                    สัปดาห์ที่ {w} (คาบที่ {w})
                  </option>
                ))}
              </select>
              <input
                id="input-attendance-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Guidance Topic & Teacher Note Box */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              หัวข้อกิจกรรมแนะแนวประจำคาบ
            </label>
            <input
              id="input-guidance-topic"
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="เช่น การค้นหาตนเอง, วางแผนศึกษาต่อ TCAS, ทักษะชีวิต"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              บันทึกการสอน / การสังเกตพฤติกรรม
            </label>
            <input
              id="input-teacher-notes"
              type="text"
              value={teacherNotes}
              onChange={e => setTeacherNotes(e.target.value)}
              placeholder="บันทึกภาพรวมห้องเรียน หรือข้อสังเกต"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 4 Professional Polish KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-slate-400">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">นักเรียนทั้งหมด</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{totalInClass} <span className="text-sm font-normal text-slate-500">คน</span></p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-blue-500">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">มาเรียน</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">{presentCount} <span className="text-sm font-normal text-blue-400">คน</span></p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-red-500">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">ขาดเรียน</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{absentCount} <span className="text-sm font-normal text-red-400">คน</span></p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">มาสาย / ลา / กิจกรรม</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">{lateCount + leaveCount + activityCount} <span className="text-sm font-normal text-amber-400">คน</span></p>
        </div>
      </div>

      {/* Control Bar: Search & Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-student-attendance"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, เลขที่ หรือรหัส..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-mark-all-present"
            onClick={handleMarkAllPresent}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>เช็คมาครบทุกคน</span>
          </button>

          <button
            id="btn-save-attendance-session"
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md shadow-xs transition-all cursor-pointer disabled:opacity-60 ${
              saveSuccessMsg
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึกลง Google Sheets...</span>
              </>
            ) : saveSuccessMsg ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกสำเร็จ!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกการเช็คชื่อ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Duplicate Session Notice / Existing Data Alert */}
      {existingSession && (
        <div className="flex items-center justify-between p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>คาบเรียนนี้บันทึกไว้แล้ว:</strong> สัปดาห์ที่ {weekNumber} ({selectedGrade}/{selectedRoom}) วันที่ {existingSession.date} 
              — การกดบันทึกจะ<strong>อัปเดตข้อมูลเดิมใน Google Sheets โดยตรง</strong>เพื่อป้องกันข้อมูลซ้ำซ้อน
            </span>
          </div>
          <span className="text-sky-700 font-medium shrink-0 ml-2">
            (โหมดอัปเดต / ป้องกันข้อมูลซ้ำ)
          </span>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold underline"
            >
              <span>ตรวจสอบใน Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Error Alert with Retry */}
      {saveErrorMsg && (
        <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span><strong>เกิดข้อผิดพลาด:</strong> {saveErrorMsg}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isConnectedToSheets && onConnectSheets ? (
              <button
                onClick={onConnectSheets}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium cursor-pointer"
              >
                เข้าสู่ระบบ Google
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium cursor-pointer"
              >
                ลองบันทึกใหม่
              </button>
            )}
          </div>
        </div>
      )}

      {/* Student List Table in Professional Polish card format */}
      <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-xs">
        {/* Table Header */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3.5 border-b border-slate-200 grid grid-cols-12 text-xs font-bold text-slate-500 uppercase tracking-wider items-center">
          <div className="col-span-2 sm:col-span-1">เลขที่</div>
          <div className="col-span-5 sm:col-span-5">ชื่อ-นามสกุล</div>
          <div className="col-span-5 sm:col-span-4">สถานะการเข้าเรียน</div>
          <div className="hidden sm:block sm:col-span-2 text-right">หมายเหตุ</div>
        </div>

        {/* Table Rows */}
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>ไม่พบรายชื่อนักเรียนในห้อง {selectedGrade}/{selectedRoom}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map(student => {
              const currentStatus = records[student.id] || 'present';
              const remarkText = remarks[student.id] || '';
              const isRemarkOpen = openRemarkStudentId === student.id;

              return (
                <div
                  key={student.id}
                  id={`student-row-${student.id}`}
                  className="px-4 sm:px-6 py-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="grid grid-cols-12 items-center gap-2">
                    {/* Number */}
                    <div className="col-span-2 sm:col-span-1 font-mono text-xs sm:text-sm font-semibold text-slate-700">
                      {student.number.toString().padStart(2, '0')}
                    </div>

                    {/* Student Name */}
                    <div className="col-span-5 sm:col-span-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-slate-900 text-xs sm:text-sm">
                          {student.prefix}{student.firstName} {student.lastName}
                        </span>
                        {student.nickname && (
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                            ({student.nickname})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        รหัส: {student.studentCode}
                      </div>
                    </div>

                    {/* Attendance Status Buttons */}
                    <div className="col-span-5 sm:col-span-4 flex items-center gap-1.5 flex-wrap">
                      {/* มาเรียน */}
                      <button
                        id={`btn-status-present-${student.id}`}
                        onClick={() => handleStatusChange(student.id, 'present')}
                        className={`px-2.5 sm:px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
                          currentStatus === 'present'
                            ? 'bg-blue-100 text-blue-700 font-semibold border border-blue-300 shadow-2xs'
                            : 'bg-white text-slate-400 font-medium border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        มาเรียน
                      </button>

                      {/* มาสาย */}
                      <button
                        id={`btn-status-late-${student.id}`}
                        onClick={() => handleStatusChange(student.id, 'late')}
                        className={`px-2.5 sm:px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
                          currentStatus === 'late'
                            ? 'bg-amber-100 text-amber-700 font-semibold border border-amber-300 shadow-2xs'
                            : 'bg-white text-slate-400 font-medium border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        มาสาย
                      </button>

                      {/* ขาดเรียน */}
                      <button
                        id={`btn-status-absent-${student.id}`}
                        onClick={() => handleStatusChange(student.id, 'absent')}
                        className={`px-2.5 sm:px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
                          currentStatus === 'absent'
                            ? 'bg-red-100 text-red-700 font-semibold border border-red-300 shadow-2xs'
                            : 'bg-white text-slate-400 font-medium border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        ขาดเรียน
                      </button>

                      {/* ลา */}
                      <button
                        id={`btn-status-leave-${student.id}`}
                        onClick={() => handleStatusChange(student.id, 'leave')}
                        className={`hidden md:inline-block px-2.5 py-1 text-xs rounded-full transition-all cursor-pointer ${
                          currentStatus === 'leave'
                            ? 'bg-sky-100 text-sky-700 font-semibold border border-sky-300 shadow-2xs'
                            : 'bg-white text-slate-400 font-medium border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        ลา
                      </button>

                      {/* กิจกรรม */}
                      <button
                        id={`btn-status-activity-${student.id}`}
                        onClick={() => handleStatusChange(student.id, 'activity')}
                        className={`hidden lg:inline-block px-2.5 py-1 text-xs rounded-full transition-all cursor-pointer ${
                          currentStatus === 'activity'
                            ? 'bg-purple-100 text-purple-700 font-semibold border border-purple-300 shadow-2xs'
                            : 'bg-white text-slate-400 font-medium border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        กิจกรรม
                      </button>

                      {/* Toggle remark icon for mobile or quick edit */}
                      <button
                        id={`btn-toggle-remark-${student.id}`}
                        onClick={() => setOpenRemarkStudentId(isRemarkOpen ? null : student.id)}
                        className={`p-1 rounded text-xs transition-colors ${
                          remarkText
                            ? 'text-indigo-600 hover:bg-indigo-50'
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title="ระบุหมายเหตุ"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Remark column */}
                    <div className="hidden sm:block sm:col-span-2 text-right">
                      {remarkText ? (
                        <span 
                          onClick={() => setOpenRemarkStudentId(student.id)}
                          className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 cursor-pointer truncate inline-block max-w-[150px]"
                          title={remarkText}
                        >
                          {remarkText}
                        </span>
                      ) : (
                        <button
                          onClick={() => setOpenRemarkStudentId(isRemarkOpen ? null : student.id)}
                          className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer italic"
                        >
                          + เพิ่มหมายเหตุ
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Remark Editing box */}
                  {(isRemarkOpen || (remarkText && isRemarkOpen)) && (
                    <div className="mt-2 pl-6 sm:pl-10">
                      <input
                        id={`input-remark-${student.id}`}
                        type="text"
                        value={remarkText}
                        onChange={e => handleRemarkChange(student.id, e.target.value)}
                        placeholder="ระบุหมายเหตุ เช่น ลาป่วยมีใบรับรองแพทย์, ติดภารกิจสภานักเรียน..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Table Footer Bar in Professional Polish style */}
        <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs sm:text-sm text-slate-500">
            บันทึกแล้ว: มาเรียน {presentCount} คน • ขาด {absentCount} คน • สาย {lateCount} คน
          </p>
          <div className="flex items-center gap-2">
            <button
              id="btn-save-attendance-footer"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-md text-xs sm:text-sm font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกลง Google Sheets...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกการเช็คชื่อทั้งหมด</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Save Reminder */}
      <div className="flex items-center justify-between p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl">
        <div className="text-xs sm:text-sm text-indigo-900">
          <strong>คำแนะนำครูแนะแนว:</strong> เกณฑ์ผ่านกิจกรรมพัฒนาผู้เรียนต้องมีเวลาเรียนไม่น้อยกว่า 80% (อย่างน้อย 16 จาก 20 สัปดาห์)
        </div>
        <button
          id="btn-save-attendance-bottom"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>กำลังบันทึก...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลลง Google Sheets</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
