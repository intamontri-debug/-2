import * as XLSX from 'xlsx';
import { Student, AttendanceSession, GradeLevel } from '../types';
import { calculateStudentSummary } from './storage';

export interface ExcelExportOptions {
  gradeFilter?: GradeLevel | 'ALL';
  roomFilter?: string;
  semester?: string;
  academicYear?: string;
  schoolName?: string;
}

export function exportAttendanceToExcel(
  students: Student[],
  sessions: AttendanceSession[],
  options: ExcelExportOptions = {}
): string {
  const {
    gradeFilter = 'ALL',
    roomFilter = 'ALL',
    semester = '1',
    academicYear = '2569',
    schoolName = 'โรงเรียนมัธยมศึกษา'
  } = options;

  // Filter students
  const filteredStudents = students.filter(s => {
    if (gradeFilter !== 'ALL' && s.grade !== gradeFilter) return false;
    if (roomFilter !== 'ALL' && s.room !== roomFilter) return false;
    return true;
  });

  const workbook = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: สรุปผลการประเมินและเวลาเรียน (Summary & Evaluation)
  // -------------------------------------------------------------
  const summaryHeaders = [
    'ลำดับ',
    'ระดับชั้น',
    'ห้อง',
    'เลขที่',
    'รหัสนักเรียน',
    'คำนำหน้า',
    'ชื่อ',
    'นามสกุล',
    'ชื่อเล่น',
    'มา (ครั้ง)',
    'สาย (ครั้ง)',
    'ลา (ครั้ง)',
    'ขาด (ครั้ง)',
    'กิจกรรม (ครั้ง)',
    'รวมคาบเรียน',
    'ร้อยละเวลาเรียน (%)',
    'ผลการประเมิน',
    'สถานะกลุ่มเสี่ยง',
    'บันทึกแนะแนว/หมายเหตุ'
  ];

  const summaryRows = filteredStudents.map((student, idx) => {
    const summary = calculateStudentSummary(student, sessions);
    return [
      idx + 1,
      student.grade,
      `${student.grade}/${student.room}`,
      student.number,
      student.studentCode,
      student.prefix,
      student.firstName,
      student.lastName,
      student.nickname || '-',
      summary.presentCount,
      summary.lateCount,
      summary.leaveCount,
      summary.absentCount,
      summary.activityCount,
      summary.totalSessions,
      `${summary.attendanceRate}%`,
      summary.passed ? 'ผ่าน (ผ.)' : 'ไม่ผ่าน (มผ.)',
      summary.isAtRisk ? 'เสี่ยง มผ. (ขาดเกินเกณฑ์)' : 'ปกติ',
      student.guidanceNote || '-'
    ];
  });

  const sheet1Data = [
    [`รายงานสรุปผลการเข้าเรียนและประเมินผล รายวิชาแนะแนว ภาคเรียนที่ ${semester} ปีการศึกษา ${academicYear}`],
    [`สถานศึกษา: ${schoolName} | ข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH')}`],
    [`ตัวกรอง: ${gradeFilter === 'ALL' ? 'ม.1 - ม.6 ทั้งหมด' : gradeFilter} ${roomFilter === 'ALL' ? 'ทุกห้อง' : `ห้อง ${roomFilter}`}`],
    [],
    summaryHeaders,
    ...summaryRows
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Column width settings for readable layout
  wsSummary['!cols'] = [
    { wch: 6 },  // ลำดับ
    { wch: 10 }, // ระดับชั้น
    { wch: 10 }, // ห้อง
    { wch: 8 },  // เลขที่
    { wch: 14 }, // รหัสนักเรียน
    { wch: 10 }, // คำนำหน้า
    { wch: 16 }, // ชื่อ
    { wch: 16 }, // นามสกุล
    { wch: 10 }, // ชื่อเล่น
    { wch: 10 }, // มา
    { wch: 10 }, // สาย
    { wch: 10 }, // ลา
    { wch: 10 }, // ขาด
    { wch: 12 }, // กิจกรรม
    { wch: 12 }, // รวมคาบ
    { wch: 16 }, // % เวลาเรียน
    { wch: 14 }, // ผลการประเมิน
    { wch: 22 }, // สถานะกลุ่มเสี่ยง
    { wch: 35 }  // บันทึกแนะแนว
  ];

  XLSX.utils.book_append_sheet(workbook, wsSummary, 'สรุปผลเวลาเรียน');

  // -------------------------------------------------------------
  // Sheet 2: รายละเอียดเช็คชื่อ 20 สัปดาห์ (Weekly Detailed Matrix)
  // -------------------------------------------------------------
  const weekHeaders = ['ลำดับ', 'ห้อง', 'เลขที่', 'ชื่อ - สกุล'];
  for (let w = 1; w <= 20; w++) {
    weekHeaders.push(`สัปดาห์ ${w}`);
  }
  weekHeaders.push('รวมมา', 'รวมขาด', '% เวลาเรียน', 'ผล');

  const matrixRows = filteredStudents.map((student, idx) => {
    const studentSessions = sessions
      .filter(s => s.grade === student.grade && s.room === student.room)
      .sort((a, b) => a.weekNumber - b.weekNumber);

    const row: (string | number)[] = [
      idx + 1,
      `${student.grade}/${student.room}`,
      student.number,
      `${student.prefix}${student.firstName} ${student.lastName}`
    ];

    let presentAndActivity = 0;
    let absentCount = 0;

    for (let w = 1; w <= 20; w++) {
      const session = studentSessions.find(s => s.weekNumber === w);
      if (!session) {
        row.push('-');
      } else {
        const status = session.records[student.id];
        if (status === 'present') {
          row.push('✓');
          presentAndActivity++;
        } else if (status === 'late') {
          row.push('ส');
          presentAndActivity += 0.8;
        } else if (status === 'leave') {
          row.push('ล');
        } else if (status === 'absent') {
          row.push('ข');
          absentCount++;
        } else if (status === 'activity') {
          row.push('ก');
          presentAndActivity++;
        } else {
          row.push('-');
        }
      }
    }

    const summary = calculateStudentSummary(student, sessions);
    row.push(summary.presentCount + summary.activityCount);
    row.push(summary.absentCount);
    row.push(`${summary.attendanceRate}%`);
    row.push(summary.passed ? 'ผ.' : 'มผ.');

    return row;
  });

  const sheet2Data = [
    [`ตารางบันทึกเวลาเรียนรายสัปดาห์ รายวิชาแนะแนว (1 คาบ/สัปดาห์ รวม 20 สัปดาห์)`],
    [`สัญลักษณ์: ✓ = มา, ส = มาสาย, ล = ลา, ข = ขาด, ก = กิจกรรม/ภารกิจโรงเรียน`],
    [],
    weekHeaders,
    ...matrixRows
  ];

  const wsMatrix = XLSX.utils.aoa_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(workbook, wsMatrix, 'บันทึกรายสัปดาห์');

  // -------------------------------------------------------------
  // Sheet 3: รายชื่อนักเรียนกลุ่มเสี่ยง มผ. (At Risk Warning List)
  // -------------------------------------------------------------
  const atRiskStudents = filteredStudents.filter(s => {
    const sum = calculateStudentSummary(s, sessions);
    return sum.isAtRisk || !sum.passed;
  });

  const riskHeaders = [
    'ลำดับ',
    'ระดับชั้น/ห้อง',
    'เลขที่',
    'รหัสนักเรียน',
    'ชื่อ - สกุล',
    'ขาดเรียน (ครั้ง)',
    'มาสาย (ครั้ง)',
    'ร้อยละเวลาเรียนปัจจุบัน',
    'สาเหตุ / บันทึกการติดตามแนะแนว',
    'แนวทางช่วยเหลือ / ซ่อมเสริม'
  ];

  const riskRows = atRiskStudents.map((s, idx) => {
    const sum = calculateStudentSummary(s, sessions);
    return [
      idx + 1,
      `${s.grade}/${s.room}`,
      s.number,
      s.studentCode,
      `${s.prefix}${s.firstName} ${s.lastName} (${s.nickname || ''})`,
      sum.absentCount,
      sum.lateCount,
      `${sum.attendanceRate}%`,
      s.guidanceNote || 'ยังไม่มีบันทึกสาเหตุ',
      'มอบหมายใบงานสะท้อนคิด/จิตอาสาชดเชยเวลาเรียน'
    ];
  });

  const sheet3Data = [
    [`รายชื่อนักเรียนกลุ่มเสี่ยงไม่ผ่านเกณฑ์เวลาเรียน (มผ.) วิชาแนะแนว`],
    [`เกณฑ์: นักเรียนที่มีเวลาเรียนต่ำกว่าร้อยละ 80 หรือขาดเรียนติดต่อกัน`],
    [],
    riskHeaders,
    ...(riskRows.length > 0 ? riskRows : [['-', '-', '-', '-', 'ไม่มีนักเรียนกลุ่มเสี่ยง (ทุกคนผ่านเกณฑ์)', '-', '-', '-', '-', '-']])
  ];

  const wsRisk = XLSX.utils.aoa_to_sheet(sheet3Data);
  wsRisk['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 8 },
    { wch: 14 },
    { wch: 25 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 35 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(workbook, wsRisk, 'รายชื่อกลุ่มเสี่ยง_มผ');

  // -------------------------------------------------------------
  // Generate file name & Trigger Download
  // -------------------------------------------------------------
  const gradeLabel = gradeFilter === 'ALL' ? 'ม1-ม6' : gradeFilter.replace('.', '');
  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `รายงานเช็คชื่อวิชาแนะแนว_${gradeLabel}_ปีการศึกษา${academicYear}_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, fileName);
  return fileName;
}
