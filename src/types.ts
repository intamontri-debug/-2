export type GradeLevel = 'ม.1' | 'ม.2' | 'ม.3' | 'ม.4' | 'ม.5' | 'ม.6';

export type AttendanceStatus = 'present' | 'late' | 'leave' | 'absent' | 'activity';

export interface Student {
  id: string;
  studentCode: string; // e.g. 48101
  prefix: 'เด็กชาย' | 'เด็กหญิง' | 'นาย' | 'นางสาว';
  firstName: string;
  lastName: string;
  nickname?: string;
  grade: GradeLevel;
  room: string; // e.g. "1", "2" -> "ม.1/1"
  number: number; // เลขที่
  guidanceNote?: string; // บันทึกข้อมูลแนะแนว เช่น จุดเด่น ปัญหา ทุนการศึกษา ความสนใจ
  phone?: string;
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  remark?: string; // เช่น ลาป่วยมีใบรับรองแพทย์, ไปแข่งขันทักษะ
}

export interface AttendanceSession {
  id: string;
  date: string; // YYYY-MM-DD
  grade: GradeLevel;
  room: string;
  weekNumber: number; // สัปดาห์/คาบที่ 1 - 20
  topic: string; // หัวข้อกิจกรรมแนะแนว
  teacherNotes?: string;
  records: Record<string, AttendanceStatus>; // studentId -> status
  remarks?: Record<string, string>; // studentId -> remark
  updatedAt: string;
}

export interface GuidanceTopic {
  week: number;
  title: string;
  category: 'การศึกษาต่อ' | 'อาชีพ' | 'ส่วนตัวและสังคม' | 'ทักษะชีวิต';
  description: string;
}

export interface AttendanceSummary {
  studentId: string;
  student: Student;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  leaveCount: number;
  absentCount: number;
  activityCount: number;
  effectivePresentCount: number; // มา + กิจกรรม + (สาย/2 หรือตามเกณฑ์)
  attendanceRate: number; // percentage 0-100
  passed: boolean; // >= 80% คือ 'ผ.', < 80% คือ 'มผ.'
  isAtRisk: boolean; // < 80% or approaching risk
}

export interface GradeSummaryStats {
  grade: GradeLevel;
  totalStudents: number;
  totalSessions: number;
  avgAttendanceRate: number;
  passedCount: number;
  atRiskCount: number;
}
