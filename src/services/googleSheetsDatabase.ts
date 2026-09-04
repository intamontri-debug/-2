/**
 * Google Sheets Database Service
 * Uses Google Identity Services (GSI) OAuth 2.0 to connect to Google Drive and Google Sheets.
 * Serves as the primary, real persistent cloud database for:
 * - Students (ข้อมูลนักเรียน)
 * - Sessions (คาบเรียนและบันทึกกิจกรรมแนะแนว)
 * - AttendanceRecords (การเช็คชื่อรายคนและหมายเหตุ)
 * - Metadata (การตั้งค่าและประวัติการซิงค์)
 */

import { Student, AttendanceSession, AttendanceStatus, GradeLevel } from '../types';
import { INITIAL_STUDENTS, INITIAL_SESSIONS } from '../data/initialData';

export const OAUTH_CLIENT_ID = '1070331991027-v8fqgk0st9dov6k17c1upvh629gg6a1r.apps.googleusercontent.com';
export const SPREADSHEET_TITLE = 'ระบบบันทึกเวลาเรียนวิชาแนะแนว (Guidance Database)';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

// In-memory token & connection state
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;
let tokenClientInstance: any = null;

export interface GoogleSheetsDbInfo {
  spreadsheetId: string;
  url: string;
  title: string;
  userEmail?: string;
  lastSyncedAt?: string;
}

export interface GoogleSheetsData {
  students: Student[];
  sessions: AttendanceSession[];
  metadata: Record<string, string>;
}

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Check if the user is currently authenticated with a valid token
 */
export function isGoogleConnected(): boolean {
  if (!cachedAccessToken) return false;
  // Check if expired (with 60 seconds buffer)
  if (Date.now() >= tokenExpiresAt - 60000) {
    return false;
  }
  return true;
}

/**
 * Get the current active token or throw
 */
export function getAccessToken(): string | null {
  if (isGoogleConnected()) {
    return cachedAccessToken;
  }
  return null;
}

/**
 * Connect to Google Account via Google Identity Services TokenClient
 */
export function connectGoogleAccount(promptConsent = false): Promise<{ token: string; email?: string }> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services (GSI) ยังโหลดไม่เสร็จสมบูรณ์ กรุณารอสักครู่แล้วลองใหม่'));
      return;
    }

    try {
      tokenClientInstance = window.google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`การเข้าสู่ระบบ Google ผิดพลาด: ${response.error_description || response.error}`));
            return;
          }

          cachedAccessToken = response.access_token;
          const expiresInSeconds = Number(response.expires_in) || 3600;
          tokenExpiresAt = Date.now() + expiresInSeconds * 1000;

          // Attempt to extract user email or return token
          resolve({
            token: response.access_token,
          });
        },
      });

      tokenClientInstance.requestAccessToken({
        prompt: promptConsent ? 'consent' : '',
      });
    } catch (err: any) {
      reject(new Error(`ไม่สามารถเปิดหน้าต่างเชื่อมต่อ Google ได้: ${err.message}`));
    }
  });
}

/**
 * Disconnect Google Account
 */
export function disconnectGoogleAccount(): void {
  if (cachedAccessToken && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(cachedAccessToken, () => {
        cachedAccessToken = null;
        tokenExpiresAt = 0;
      });
    } catch {
      cachedAccessToken = null;
      tokenExpiresAt = 0;
    }
  } else {
    cachedAccessToken = null;
    tokenExpiresAt = 0;
  }
}

/**
 * Helper to ensure a valid token before making Google API requests
 */
export async function getValidAccessToken(): Promise<string> {
  if (isGoogleConnected() && cachedAccessToken) {
    return cachedAccessToken;
  }
  // Try reconnecting
  const { token } = await connectGoogleAccount(true);
  return token;
}

const ensureValidToken = getValidAccessToken;

/**
 * Search Google Drive for an existing database spreadsheet
 */
export async function findDatabaseSpreadsheet(token: string): Promise<GoogleSheetsDbInfo | null> {
  const query = encodeURIComponent(
    `name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,modifiedTime)&pageSize=5`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED: สิทธิ์การเข้าถึง Google Sheets หมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
    }
    const errText = await res.text();
    throw new Error(`ค้นหา Google Spreadsheet ในไดรฟ์ไม่สำเร็จ (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    const file = data.files[0];
    return {
      spreadsheetId: file.id,
      title: file.name,
      url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      lastSyncedAt: file.modifiedTime
    };
  }

  return null;
}

/**
 * Initialize a brand new Database Spreadsheet in Google Sheets
 */
export async function createDatabaseSpreadsheet(token: string): Promise<GoogleSheetsDbInfo> {
  // 1. Create Spreadsheet with required sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_TITLE,
      },
      sheets: [
        { properties: { title: 'Students', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Sessions', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'AttendanceRecords', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Metadata', gridProperties: { frozenRowCount: 1 } } },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`สร้าง Google Sheets ฐานข้อมูลไม่สำเร็จ (${createRes.status}): ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Prepare headers and initial seed data
  const studentHeaders = [
    'ID', 'รหัสนักเรียน', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'ระดับชั้น', 'ห้อง', 'เลขที่', 'บันทึกแนะแนว', 'เบอร์โทร', 'อัปเดตล่าสุด'
  ];
  const sessionHeaders = [
    'SessionID', 'วันที่', 'ระดับชั้น', 'ห้อง', 'สัปดาห์ที่', 'หัวข้อกิจกรรมแนะแนว', 'บันทึกครูผู้สอน', 'อัปเดตล่าสุด'
  ];
  const attendanceHeaders = [
    'RecordKey', 'SessionID', 'รหัสนักเรียน/ID', 'สถานะ', 'หมายเหตุ', 'อัปเดตล่าสุด'
  ];
  const metadataHeaders = [
    'การตั้งค่า', 'ค่าที่บันทึก', 'อัปเดตล่าสุด'
  ];

  // Convert default initial students into rows so the teacher has a ready roster
  const initialStudentRows = INITIAL_STUDENTS.map(s => [
    s.id,
    s.studentCode,
    s.prefix,
    s.firstName,
    s.lastName,
    s.nickname || '',
    s.grade,
    s.room,
    s.number,
    s.guidanceNote || '',
    s.phone || '',
    new Date().toISOString()
  ]);

  // Convert default sessions
  const initialSessionRows = INITIAL_SESSIONS.map(sess => [
    sess.id,
    sess.date,
    sess.grade,
    sess.room,
    sess.weekNumber,
    sess.topic,
    sess.teacherNotes || '',
    sess.updatedAt || new Date().toISOString()
  ]);

  // Convert default attendance records
  const initialAttendanceRows: any[] = [];
  INITIAL_SESSIONS.forEach(sess => {
    Object.entries(sess.records).forEach(([stdId, status]) => {
      const remark = sess.remarks?.[stdId] || '';
      initialAttendanceRows.push([
        `${sess.id}_${stdId}`,
        sess.id,
        stdId,
        status,
        remark,
        sess.updatedAt || new Date().toISOString()
      ]);
    });
  });

  const nowIso = new Date().toISOString();
  const metadataRows = [
    ['APP_NAME', 'ระบบบันทึกเวลาเรียนวิชาแนะแนว (Guidance Database)', nowIso],
    ['ACADEMIC_YEAR', '2569', nowIso],
    ['SEMESTER', '1', nowIso],
    ['PASS_CRITERIA', '80%', nowIso],
    ['CREATED_AT', nowIso, nowIso],
    ['LAST_SYNCED_AT', nowIso, nowIso],
  ];

  // 3. Populate headers & seed data
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Students!A1:L',
          values: [studentHeaders, ...initialStudentRows],
        },
        {
          range: 'Sessions!A1:H',
          values: [sessionHeaders, ...initialSessionRows],
        },
        {
          range: 'AttendanceRecords!A1:F',
          values: [attendanceHeaders, ...initialAttendanceRows],
        },
        {
          range: 'Metadata!A1:C',
          values: [metadataHeaders, ...metadataRows],
        },
      ],
    }),
  });

  return {
    spreadsheetId,
    title: SPREADSHEET_TITLE,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    lastSyncedAt: nowIso
  };
}

/**
 * Get spreadsheet details by ID
 */
export async function getSpreadsheetById(token: string, spreadsheetId: string): Promise<GoogleSheetsDbInfo> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED: สิทธิ์การเข้าถึง Google Sheets หมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
    }
    const errText = await res.text();
    throw new Error(`ไม่พบ Google Spreadsheet ID นี้ (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    spreadsheetId,
    title: data.properties?.title || SPREADSHEET_TITLE,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    lastSyncedAt: new Date().toISOString()
  };
}

/**
 * Find existing or create new Google Spreadsheet Database
 */
export async function getOrCreateDatabaseSpreadsheet(token: string): Promise<GoogleSheetsDbInfo> {
  const existing = await findDatabaseSpreadsheet(token);
  if (existing) {
    return existing;
  }
  return await createDatabaseSpreadsheet(token);
}

/**
 * Fetch all students, sessions, attendance records and metadata from Google Sheets
 */
export async function loadDataFromGoogleSheets(
  token: string,
  spreadsheetId: string
): Promise<GoogleSheetsData> {
  const ranges = [
    'Students!A2:L',
    'Sessions!A2:H',
    'AttendanceRecords!A2:F',
    'Metadata!A2:C'
  ];
  const query = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${query}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED: สิทธิ์การเข้าถึง Google Sheets หมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
    }
    const errText = await res.text();
    throw new Error(`โหลดข้อมูลจาก Google Sheets ไม่สำเร็จ (${res.status}): ${errText}`);
  }

  const result = await res.json();
  const valueRanges = result.valueRanges || [];

  const studentRows = valueRanges[0]?.values || [];
  const sessionRows = valueRanges[1]?.values || [];
  const attendanceRows = valueRanges[2]?.values || [];
  const metadataRows = valueRanges[3]?.values || [];

  // Parse Students
  const students: Student[] = studentRows
    .filter((r: any[]) => r && r[0] && r[1])
    .map((r: any[]) => ({
      id: String(r[0]),
      studentCode: String(r[1]),
      prefix: (r[2] as any) || 'เด็กชาย',
      firstName: String(r[3] || ''),
      lastName: String(r[4] || ''),
      nickname: r[5] ? String(r[5]) : undefined,
      grade: (r[6] as GradeLevel) || 'ม.1',
      room: String(r[7] || '1'),
      number: Number(r[8]) || 1,
      guidanceNote: r[9] ? String(r[9]) : undefined,
      phone: r[10] ? String(r[10]) : undefined,
    }))
    .sort((a: Student, b: Student) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      if (a.room !== b.room) return a.room.localeCompare(b.room);
      return a.number - b.number;
    });

  // Group Attendance Records by SessionID
  // Column format: [RecordKey, SessionID, StudentId, Status, Remark, UpdatedAt]
  const recordsBySession: Record<string, Record<string, AttendanceStatus>> = {};
  const remarksBySession: Record<string, Record<string, string>> = {};

  attendanceRows.forEach((r: any[]) => {
    if (!r || r.length < 4) return;
    const sessId = String(r[1]);
    const stdId = String(r[2]);
    const status = (r[3] as AttendanceStatus) || 'present';
    const remark = r[4] ? String(r[4]) : '';

    if (!recordsBySession[sessId]) recordsBySession[sessId] = {};
    recordsBySession[sessId][stdId] = status;

    if (remark) {
      if (!remarksBySession[sessId]) remarksBySession[sessId] = {};
      remarksBySession[sessId][stdId] = remark;
    }
  });

  // Parse Sessions
  // Column format: [SessionID, Date, Grade, Room, WeekNumber, Topic, TeacherNotes, UpdatedAt]
  const sessions: AttendanceSession[] = sessionRows
    .filter((r: any[]) => r && r[0] && r[1])
    .map((r: any[]) => {
      const sessId = String(r[0]);
      return {
        id: sessId,
        date: String(r[1] || ''),
        grade: (r[2] as GradeLevel) || 'ม.1',
        room: String(r[3] || '1'),
        weekNumber: Number(r[4]) || 1,
        topic: String(r[5] || 'กิจกรรมแนะแนว'),
        teacherNotes: r[6] ? String(r[6]) : undefined,
        records: recordsBySession[sessId] || {},
        remarks: remarksBySession[sessId] || {},
        updatedAt: String(r[7] || new Date().toISOString())
      };
    })
    .sort((a: AttendanceSession, b: AttendanceSession) => a.weekNumber - b.weekNumber);

  // Parse Metadata
  const metadata: Record<string, string> = {};
  metadataRows.forEach((r: any[]) => {
    if (r && r[0]) {
      metadata[String(r[0])] = String(r[1] || '');
    }
  });

  return { students, sessions, metadata };
}

/**
 * Save / Update an Attendance Session in Google Sheets with strict DUPLICATE PREVENTION
 * 
 * 1. Checks if a session with matching ID OR (grade + room + weekNumber) already exists in 'Sessions' sheet.
 * 2. If it exists, updates that exact row in 'Sessions' and updates/replaces rows in 'AttendanceRecords'.
 * 3. If it doesn't exist, appends the new session and its attendance records.
 * 4. This guarantees NO duplicate sessions or orphaned duplicate attendance records.
 */
export async function saveSessionToGoogleSheets(
  session: AttendanceSession,
  spreadsheetId: string
): Promise<{ success: boolean; isUpdate: boolean }> {
  const token = await ensureValidToken();

  // 1. Fetch current Sessions to check for duplicates
  const sessionsRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sessions!A2:H`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!sessionsRes.ok) {
    const errText = await sessionsRes.text();
    throw new Error(`ไม่สามารถตรวจสอบคาบเรียนใน Google Sheets (${sessionsRes.status}): ${errText}`);
  }

  const sessionsData = await sessionsRes.json();
  const existingRows: any[][] = sessionsData.values || [];

  // Find index of duplicate/existing session
  let matchedRowIndex = -1;
  let targetSessionId = session.id;

  for (let i = 0; i < existingRows.length; i++) {
    const r = existingRows[i];
    const rowId = r[0];
    const rowGrade = r[2];
    const rowRoom = r[3];
    const rowWeek = Number(r[4]);

    // Check match by ID OR by (grade + room + weekNumber)
    if (rowId === session.id || (rowGrade === session.grade && rowRoom === session.room && rowWeek === session.weekNumber)) {
      matchedRowIndex = i + 2; // 1-indexed and header is row 1
      targetSessionId = rowId || session.id;
      break;
    }
  }

  const isUpdate = matchedRowIndex > 0;
  const nowIso = new Date().toISOString();

  const sessionRowValues = [
    targetSessionId,
    session.date,
    session.grade,
    session.room,
    session.weekNumber,
    session.topic,
    session.teacherNotes || '',
    nowIso
  ];

  // 2. Fetch existing AttendanceRecords to prevent duplicate student check-in rows
  const attendanceRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/AttendanceRecords!A2:F`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  let existingAttendanceRows: any[][] = [];
  if (attendanceRes.ok) {
    const attData = await attendanceRes.json();
    existingAttendanceRows = attData.values || [];
  }

  // Filter out any previous records for this targetSessionId to avoid duplicates
  const cleanedAttendanceRows = existingAttendanceRows.filter(
    r => r && r[1] !== targetSessionId
  );

  // Build the new records for this session
  const newAttendanceRowsForSession = Object.entries(session.records).map(([stdId, status]) => {
    const remark = session.remarks?.[stdId] || '';
    return [
      `${targetSessionId}_${stdId}`,
      targetSessionId,
      stdId,
      status,
      remark,
      nowIso
    ];
  });

  const allAttendanceRows = [...cleanedAttendanceRows, ...newAttendanceRowsForSession];

  // 3. Batch Update Google Sheets atomically
  const batchData: any[] = [];

  if (isUpdate) {
    // Overwrite the specific session row in Sessions
    batchData.push({
      range: `Sessions!A${matchedRowIndex}:H${matchedRowIndex}`,
      values: [sessionRowValues]
    });
  } else {
    // Append to Sessions
    const nextSessionRow = existingRows.length + 2;
    batchData.push({
      range: `Sessions!A${nextSessionRow}:H${nextSessionRow}`,
      values: [sessionRowValues]
    });
  }

  // Rewrite AttendanceRecords range cleanly
  batchData.push({
    range: `AttendanceRecords!A2:F${allAttendanceRows.length + 1}`,
    values: allAttendanceRows
  });

  // Update Metadata last synced
  batchData.push({
    range: 'Metadata!A6:C6',
    values: [['LAST_SYNCED_AT', nowIso, nowIso]]
  });

  // If previous AttendanceRecords had more rows than current, clear the excess
  if (existingAttendanceRows.length > allAttendanceRows.length) {
    const clearRange = `AttendanceRecords!A${allAttendanceRows.length + 2}:F${existingAttendanceRows.length + 2}`;
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );
  }

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData
      })
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`บันทึกข้อมูลลง Google Sheets ล้มเหลว (${updateRes.status}): ${errText}`);
  }

  return { success: true, isUpdate };
}

/**
 * Save / Update Students in Google Sheets with validation and deduplication
 */
export async function saveStudentsToGoogleSheets(
  students: Student[],
  spreadsheetId: string
): Promise<{ success: boolean }> {
  const token = await ensureValidToken();

  // Deduplicate students by ID and studentCode
  const uniqueStudents: Student[] = [];
  const seenIds = new Set<string>();

  for (const s of students) {
    if (!seenIds.has(s.id)) {
      seenIds.add(s.id);
      uniqueStudents.push(s);
    }
  }

  const nowIso = new Date().toISOString();
  const rows = uniqueStudents.map(s => [
    s.id,
    s.studentCode,
    s.prefix,
    s.firstName,
    s.lastName,
    s.nickname || '',
    s.grade,
    s.room,
    s.number,
    s.guidanceNote || '',
    s.phone || '',
    nowIso
  ]);

  // First, clear old Students range to avoid lingering rows
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Students!A2:L:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }
  );

  // Write new students
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Students!A2:L${rows.length + 1}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`บันทึกข้อมูลนักเรียนลง Google Sheets ไม่สำเร็จ (${res.status}): ${errText}`);
  }

  return { success: true };
}

/**
 * Delete a session and its associated attendance records from Google Sheets
 */
export async function deleteSessionFromGoogleSheets(
  sessionId: string,
  spreadsheetId: string
): Promise<{ success: boolean }> {
  const token = await ensureValidToken();

  // Fetch current Sessions and AttendanceRecords
  const ranges = ['Sessions!A2:H', 'AttendanceRecords!A2:F'];
  const query = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${query}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!getRes.ok) {
    const err = await getRes.text();
    throw new Error(`ไม่สามารถอ่านข้อมูล Google Sheets (${getRes.status}): ${err}`);
  }

  const data = await getRes.json();
  const sessionRows: any[][] = data.valueRanges?.[0]?.values || [];
  const attendanceRows: any[][] = data.valueRanges?.[1]?.values || [];

  const updatedSessions = sessionRows.filter(r => r && r[0] !== sessionId);
  const updatedAttendance = attendanceRows.filter(r => r && r[1] !== sessionId);

  // Clear both sheets
  await Promise.all([
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sessions!A2:H:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }),
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/AttendanceRecords!A2:F:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
  ]);

  // Rewrite remaining
  const batchData: any[] = [];
  if (updatedSessions.length > 0) {
    batchData.push({
      range: `Sessions!A2:H${updatedSessions.length + 1}`,
      values: updatedSessions
    });
  }
  if (updatedAttendance.length > 0) {
    batchData.push({
      range: `AttendanceRecords!A2:F${updatedAttendance.length + 1}`,
      values: updatedAttendance
    });
  }

  if (batchData.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: batchData
        })
      }
    );
  }

  return { success: true };
}
