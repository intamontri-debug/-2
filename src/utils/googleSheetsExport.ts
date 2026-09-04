import { Student, AttendanceSession, GradeLevel } from '../types';
import { calculateStudentSummary } from './storage';

const OAUTH_CLIENT_ID = '1070331991027-v8fqgk0st9dov6k17c1upvh629gg6a1r.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

let tokenClient: any = null;
let currentAccessToken: string | null = null;

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Request Access Token using Google Identity Services (GIS)
 */
export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (currentAccessToken) {
      resolve(currentAccessToken);
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      reject(new Error('Google Identity Services library is still loading. Please wait 2 seconds and try again.'));
      return;
    }

    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          currentAccessToken = response.access_token;
          resolve(response.access_token);
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

export function isGoogleConnected(): boolean {
  return currentAccessToken !== null;
}

export function disconnectGoogle(): void {
  if (currentAccessToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(currentAccessToken, () => {
      currentAccessToken = null;
    });
  } else {
    currentAccessToken = null;
  }
}

/**
 * Export attendance directly to a newly created Google Spreadsheet
 */
export async function exportToGoogleSheets(
  students: Student[],
  sessions: AttendanceSession[],
  options: {
    gradeFilter?: GradeLevel | 'ALL';
    academicYear?: string;
    semester?: string;
  } = {}
): Promise<{ spreadsheetId: string; url: string; title: string }> {
  const token = await requestGoogleAccessToken();
  const { gradeFilter = 'ALL', academicYear = '2569', semester = '1' } = options;

  const dateStr = new Date().toISOString().slice(0, 10);
  const title = `รายงานเช็คชื่อวิชาแนะแนว_${gradeFilter === 'ALL' ? 'ม1-ม6' : gradeFilter}_ปี${academicYear}_${dateStr}`;

  // 1. Create Spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        { properties: { title: 'สรุปผลเวลาเรียน' } },
        { properties: { title: 'รายชื่อกลุ่มเสี่ยง_มผ' } }
      ]
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`สร้าง Google Sheet ไม่สำเร็จ: ${createResponse.status} ${errorText}`);
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Prepare Data for Sheet 1 (สรุปผลเวลาเรียน)
  const filteredStudents = students.filter(s => {
    if (gradeFilter !== 'ALL' && s.grade !== gradeFilter) return false;
    return true;
  });

  const summaryHeaders = [
    'ลำดับ', 'ระดับชั้น', 'ห้อง', 'เลขที่', 'รหัสนักเรียน', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น',
    'มา (ครั้ง)', 'สาย (ครั้ง)', 'ลา (ครั้ง)', 'ขาด (ครั้ง)', 'กิจกรรม (ครั้ง)', 'รวมคาบ',
    'ร้อยละเวลาเรียน (%)', 'ผลการประเมิน', 'สถานะ', 'บันทึกแนะแนว'
  ];

  const summaryRows = filteredStudents.map((student, idx) => {
    const sum = calculateStudentSummary(student, sessions);
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
      sum.presentCount,
      sum.lateCount,
      sum.leaveCount,
      sum.absentCount,
      sum.activityCount,
      sum.totalSessions,
      `${sum.attendanceRate}%`,
      sum.passed ? 'ผ่าน (ผ.)' : 'ไม่ผ่าน (มผ.)',
      sum.isAtRisk ? 'เสี่ยง มผ.' : 'ปกติ',
      student.guidanceNote || '-'
    ];
  });

  const sheet1Values = [
    [`รายงานสรุปผลการเข้าเรียนและประเมินผล รายวิชาแนะแนว (ม.1 - ม.6)`],
    [`ภาคเรียนที่ ${semester} ปีการศึกษา ${academicYear} | วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH')}`],
    [],
    summaryHeaders,
    ...summaryRows
  ];

  // 3. Prepare Data for Sheet 2 (กลุ่มเสี่ยง)
  const atRiskStudents = filteredStudents.filter(s => {
    const sum = calculateStudentSummary(s, sessions);
    return sum.isAtRisk || !sum.passed;
  });

  const riskHeaders = [
    'ลำดับ', 'ห้อง', 'เลขที่', 'รหัส', 'ชื่อ - สกุล', 'ขาดเรียน', 'สาย', 'ร้อยละเวลาเรียน', 'บันทึกแนะแนว', 'แนวทางช่วยเหลือ'
  ];

  const riskRows = atRiskStudents.map((s, idx) => {
    const sum = calculateStudentSummary(s, sessions);
    return [
      idx + 1,
      `${s.grade}/${s.room}`,
      s.number,
      s.studentCode,
      `${s.prefix}${s.firstName} ${s.lastName}`,
      sum.absentCount,
      sum.lateCount,
      `${sum.attendanceRate}%`,
      s.guidanceNote || 'ไม่มีบันทึก',
      'เรียกพบครูแนะแนว / ทำงานชดเชยเวลาเรียน'
    ];
  });

  const sheet2Values = [
    [`รายชื่อนักเรียนกลุ่มเสี่ยงไม่ผ่านเกณฑ์เวลาเรียน (มผ.) รายวิชาแนะแนว`],
    [`นักเรียนที่มีเวลาเรียนต่ำกว่าร้อยละ 80 หรือขาดเรียนเกินเกณฑ์`],
    [],
    riskHeaders,
    ...(riskRows.length > 0 ? riskRows : [['-', '-', '-', '-', 'ไม่มีนักเรียนกลุ่มเสี่ยง (ทุกคนผ่านเกณฑ์)', '-', '-', '-', '-', '-']])
  ];

  // 4. Batch Update Values to Google Sheets
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'สรุปผลเวลาเรียน!A1',
            values: sheet1Values,
          },
          {
            range: 'รายชื่อกลุ่มเสี่ยง_มผ!A1',
            values: sheet2Values,
          }
        ],
      }),
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.warn('Batch update values warning:', errorText);
  }

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  return { spreadsheetId, url, title };
}
