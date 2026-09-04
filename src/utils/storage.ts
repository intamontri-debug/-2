import { Student, AttendanceSession, GradeLevel, AttendanceSummary, GradeSummaryStats } from '../types';
import { INITIAL_STUDENTS, INITIAL_SESSIONS } from '../data/initialData';

const STORAGE_KEYS = {
  STUDENTS: 'guidance_attendance_students_v1',
  SESSIONS: 'guidance_attendance_sessions_v1',
  CURRENT_GRADE: 'guidance_attendance_selected_grade',
  CURRENT_ROOM: 'guidance_attendance_selected_room'
};

export function getStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse students from localStorage:', e);
    return INITIAL_STUDENTS;
  }
}

export function saveStoredStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students:', e);
  }
}

export function getStoredSessions(): AttendanceSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
      return INITIAL_SESSIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse sessions from localStorage:', e);
    return INITIAL_SESSIONS;
  }
}

export function saveStoredSession(session: AttendanceSession): AttendanceSession[] {
  const sessions = getStoredSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  let updated: AttendanceSession[];
  
  if (index >= 0) {
    updated = [...sessions];
    updated[index] = { ...session, updatedAt: new Date().toISOString() };
  } else {
    updated = [...sessions, { ...session, updatedAt: new Date().toISOString() }];
  }

  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
  return updated;
}

export function deleteStoredSession(sessionId: string): AttendanceSession[] {
  const sessions = getStoredSessions().filter(s => s.id !== sessionId);
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to delete session:', e);
  }
  return sessions;
}

export function resetToDefaults(): { students: Student[]; sessions: AttendanceSession[] } {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
  return { students: INITIAL_STUDENTS, sessions: INITIAL_SESSIONS };
}

/**
 * คำนวณสรุปเวลาเรียนของนักเรียนรายบุคคล
 * เกณฑ์กิจกรรมแนะแนว:
 * - มา = 100%
 * - กิจกรรม/ปฏิบัติภารกิจ = 100% (ถือเป็นเวลาเรียนตามระเบียบกระทรวง)
 * - สาย = 80% (หรือคิดเป็น 1 ครั้ง แต่มีประวัติสาย)
 * - ลา = ลากิจ/ลาป่วย มีผลกระทบต่อเวลาเรียน
 * - ขาด = ไม่ได้คะแนนเวลาเรียน
 * เกณฑ์ผ่าน ผ. = เวลาเรียน >= 80%
 */
export function calculateStudentSummary(
  student: Student,
  allSessions: AttendanceSession[]
): AttendanceSummary {
  const relevantSessions = allSessions.filter(
    s => s.grade === student.grade && s.room === student.room
  );

  const totalSessions = relevantSessions.length;
  let presentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;
  let absentCount = 0;
  let activityCount = 0;

  relevantSessions.forEach(session => {
    const status = session.records[student.id];
    if (status === 'present') presentCount++;
    else if (status === 'late') lateCount++;
    else if (status === 'leave') leaveCount++;
    else if (status === 'absent') absentCount++;
    else if (status === 'activity') activityCount++;
  });

  // Effective attendance: present (1.0), activity (1.0), late (0.8), leave (0.5 for excused leave or 0 based on school policy, default 0.5), absent (0)
  // หรือคิดแบบระเบียบวัดผล: (มา + กิจกรรม + สาย) / คาบทั้งหมด
  const effectiveScore = presentCount + activityCount + (lateCount * 0.8) + (leaveCount * 0.5);
  const attendanceRate = totalSessions > 0 ? Math.min(100, Math.round((effectiveScore / totalSessions) * 100)) : 100;
  
  // เกณฑ์ มผ. คือ < 80%
  const passed = attendanceRate >= 80;
  const isAtRisk = totalSessions >= 3 && attendanceRate < 80;

  return {
    studentId: student.id,
    student,
    totalSessions,
    presentCount,
    lateCount,
    leaveCount,
    absentCount,
    activityCount,
    effectivePresentCount: effectiveScore,
    attendanceRate,
    passed,
    isAtRisk
  };
}

export function calculateGradeStats(
  grade: GradeLevel,
  students: Student[],
  sessions: AttendanceSession[]
): GradeSummaryStats {
  const gradeStudents = students.filter(s => s.grade === grade);
  const gradeSessions = sessions.filter(s => s.grade === grade);

  if (gradeStudents.length === 0) {
    return {
      grade,
      totalStudents: 0,
      totalSessions: 0,
      avgAttendanceRate: 100,
      passedCount: 0,
      atRiskCount: 0
    };
  }

  const summaries = gradeStudents.map(s => calculateStudentSummary(s, sessions));
  const totalRate = summaries.reduce((acc, curr) => acc + curr.attendanceRate, 0);
  const avgRate = Math.round(totalRate / summaries.length);
  const passedCount = summaries.filter(s => s.passed).length;
  const atRiskCount = summaries.filter(s => s.isAtRisk).length;

  return {
    grade,
    totalStudents: gradeStudents.length,
    totalSessions: gradeSessions.length,
    avgAttendanceRate: avgRate,
    passedCount,
    atRiskCount
  };
}
