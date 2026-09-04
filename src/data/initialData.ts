import { Student, AttendanceSession } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  // ม.1/1
  { id: 'std-m1-1', studentCode: '48101', prefix: 'เด็กชาย', firstName: 'กิตติศักดิ์', lastName: 'สุขเกษม', nickname: 'กิต', grade: 'ม.1', room: '1', number: 1, guidanceNote: 'สนใจด้านคอมพิวเตอร์และหุ่นยนต์' },
  { id: 'std-m1-2', studentCode: '48102', prefix: 'เด็กชาย', firstName: 'ชยุตม์', lastName: 'วงศ์สวัสดิ์', nickname: 'มาร์ค', grade: 'ม.1', room: '1', number: 2, guidanceNote: 'นักกีฬาบาสเกตบอลประจำโรงเรียน' },
  { id: 'std-m1-3', studentCode: '48103', prefix: 'เด็กชาย', firstName: 'ธนกฤต', lastName: 'ไพโรจน์พาณิชย์', nickname: 'เต้', grade: 'ม.1', room: '1', number: 3, guidanceNote: 'ต้องดูแลเป็นพิเศษเรื่องการปรับตัวเข้ากับเพื่อน' },
  { id: 'std-m1-4', studentCode: '48104', prefix: 'เด็กหญิง', firstName: 'ณัฐณิชา', lastName: 'รัตนประสิทธิ์', nickname: 'ณิชา', grade: 'ม.1', room: '1', number: 4, guidanceNote: 'หัวหน้าห้อง มีภาวะผู้นำสูง สนใจสายแพทย์' },
  { id: 'std-m1-5', studentCode: '48105', prefix: 'เด็กหญิง', firstName: 'ปพิชญา', lastName: 'แสงสุวรรณ', nickname: 'ปาย', grade: 'ม.1', room: '1', number: 5, guidanceNote: 'ชอบงานศิลปะและออกแบบ' },
  { id: 'std-m1-6', studentCode: '48106', prefix: 'เด็กหญิง', firstName: 'วรินทร', lastName: 'ศิริบูรณ์', nickname: 'ริน', grade: 'ม.1', room: '1', number: 6, guidanceNote: 'ขาดเรียนบ่อยเนื่องจากปัญหาสุขภาพภูมิแพ้' },

  // ม.1/2
  { id: 'std-m1-7', studentCode: '48121', prefix: 'เด็กชาย', firstName: 'ภูมิภัทร', lastName: 'อินทร์จันทร์', nickname: 'ภูมิ', grade: 'ม.1', room: '2', number: 1, guidanceNote: 'เด่นวิชาคณิตศาสตร์' },
  { id: 'std-m1-8', studentCode: '48122', prefix: 'เด็กหญิง', firstName: 'กุลธิดา', lastName: 'ปรีชาเลิศ', nickname: 'มินท์', grade: 'ม.1', room: '2', number: 2, guidanceNote: 'ต้องการคำแนะนำเรื่องการบริหารเวลา' },

  // ม.2/1
  { id: 'std-m2-1', studentCode: '47201', prefix: 'เด็กชาย', firstName: 'จิรภัทร', lastName: 'เมธาวีกุล', nickname: 'ภัทร', grade: 'ม.2', room: '1', number: 1, guidanceNote: 'มีเป้าหมายเข้าเตรียมอุดมฯ หรือกำเนิดวิทย์' },
  { id: 'std-m2-2', studentCode: '47202', prefix: 'เด็กชาย', firstName: 'พิชญุตม์', lastName: 'เรืองวิทย์', nickname: 'พีท', grade: 'ม.2', room: '1', number: 2, guidanceNote: 'ขาดเรียนติดเกม ต้องปรึกษาผู้ปกครอง' },
  { id: 'std-m2-3', studentCode: '47203', prefix: 'เด็กหญิง', firstName: 'ชนัญชิดา', lastName: 'พรพิมล', nickname: 'ใบเฟิร์น', grade: 'ม.2', room: '1', number: 3, guidanceNote: 'มีความสามารถทางดนตรีไทยและสากล' },
  { id: 'std-m2-4', studentCode: '47204', prefix: 'เด็กหญิง', firstName: 'ธัญญารัตน์', lastName: 'อมรเวช', nickname: 'มายด์', grade: 'ม.2', room: '1', number: 4, guidanceNote: 'นักเรียนเรียนดี ได้รับทุนการศึกษา' },

  // ม.3/1 (ช่วงหัวเลี้ยวหัวต่อ ม.ต้น สู่ ม.ปลาย)
  { id: 'std-m3-1', studentCode: '46301', prefix: 'เด็กชาย', firstName: 'พงศกร', lastName: 'บูรณพาณิชย์', nickname: 'แบงค์', grade: 'ม.3', room: '1', number: 1, guidanceNote: 'สนใจศึกษาต่อสายอาชีวะ (ช่างยนต์/อิเล็กทรอนิกส์)' },
  { id: 'std-m3-2', studentCode: '46302', prefix: 'เด็กชาย', firstName: 'ศุภโชค', lastName: 'คงสมบูรณ์', nickname: 'โชค', grade: 'ม.3', room: '1', number: 2, guidanceNote: 'ลังเลระหว่าง วิทย์-คณิต กับ สายศิลป์คำนวณ' },
  { id: 'std-m3-3', studentCode: '46303', prefix: 'เด็กหญิง', firstName: 'อภิชญา', lastName: 'ทิพยเนตร', nickname: 'พลอย', grade: 'ม.3', room: '1', number: 3, guidanceNote: 'ประสงค์เรียนต่อ ม.ปลาย แผนการเรียนวิทย์-คอมพ์' },
  { id: 'std-m3-4', studentCode: '46304', prefix: 'เด็กหญิง', firstName: 'กัญญารัตน์', lastName: 'ตันติพงศ์', nickname: 'แป้ง', grade: 'ม.3', room: '1', number: 4, guidanceNote: 'สนใจสายภาษาญี่ปุ่นและเกาหลี' },

  // ม.4/1 (ช่วงปรับตัว ม.ปลาย)
  { id: 'std-m4-1', studentCode: '45401', prefix: 'นาย', firstName: 'เกียรติภูมิ', lastName: 'สถิตพงศ์', nickname: 'เจมส์', grade: 'ม.4', room: '1', number: 1, guidanceNote: 'แผนวิทย์-คณิต เป้าหมายคณะวิศวกรรมศาสตร์' },
  { id: 'std-m4-2', studentCode: '45402', prefix: 'นาย', firstName: 'วรพล', lastName: 'เลิศวิริยะ', nickname: 'วิน', grade: 'ม.4', room: '1', number: 2, guidanceNote: 'ช่วยงานครอบครัว มาสายบ่อยในชั่วโมงแรก' },
  { id: 'std-m4-3', studentCode: '45403', prefix: 'นางสาว', firstName: 'พิชชาพร', lastName: 'อนันตคุณ', nickname: 'เบลล่า', grade: 'ม.4', room: '1', number: 3, guidanceNote: 'สนใจสาขานิเทศศาสตร์และสื่อดิจิทัล' },
  { id: 'std-m4-4', studentCode: '45404', prefix: 'นางสาว', firstName: 'สุพิชชา', lastName: 'บุญญาพร', nickname: 'เกรซ', grade: 'ม.4', room: '1', number: 4, guidanceNote: 'สมาชิกสภานักเรียน มีความรับผิดชอบดี' },

  // ม.5/1
  { id: 'std-m5-1', studentCode: '44501', prefix: 'นาย', firstName: 'ทัศนัย', lastName: 'ชัยวัฒนา', nickname: 'ภูมิ', grade: 'ม.5', room: '1', number: 1, guidanceNote: 'เตรียมตัวสอบวัดระดับภาษาอังกฤษ IELTS' },
  { id: 'std-m5-2', studentCode: '44502', prefix: 'นาย', firstName: 'อธิป', lastName: 'กิตติโภคิน', nickname: 'อาร์ม', grade: 'ม.5', room: '1', number: 2, guidanceNote: 'กำลังพัฒนาโครงงานสิ่งประดิษฐ์เพื่อแข่งขัน' },
  { id: 'std-m5-3', studentCode: '44503', prefix: 'นางสาว', firstName: 'ชลิตา', lastName: 'เจริญกิจ', nickname: 'เชอรี่', grade: 'ม.5', room: '1', number: 3, guidanceNote: 'สนใจศึกษาต่อคณะนิติศาสตร์/รัฐศาสตร์' },
  { id: 'std-m5-4', studentCode: '44504', prefix: 'นางสาว', firstName: 'ธัญญลักษณ์', lastName: 'พานิชย์กุล', nickname: 'แพรว', grade: 'ม.5', room: '1', number: 4, guidanceNote: 'ต้องการคำแนะนำเรื่องทุนการศึกษาเต็มจำนวน' },

  // ม.6/1 (เตรียมสอบ TCAS & เข้ามหาวิทยาลัย)
  { id: 'std-m6-1', studentCode: '43601', prefix: 'นาย', firstName: 'ศิวกร', lastName: 'เลิศประเสริฐ', nickname: 'น็อต', grade: 'ม.6', room: '1', number: 1, guidanceNote: 'ยื่นสมัครรอบ Portfolio คณะวิศวกรรมการบิน' },
  { id: 'std-m6-2', studentCode: '43602', prefix: 'นาย', firstName: 'ปุญญพัฒน์', lastName: 'วรโชติ', nickname: 'บอส', grade: 'ม.6', room: '1', number: 2, guidanceNote: 'ขาดเรียนเกิน 4 ครั้ง เสี่ยง มผ. ต้องส่งแบบบันทึกซ่อมเสริม' },
  { id: 'std-m6-3', studentCode: '43603', prefix: 'นางสาว', firstName: 'พิมพิกา', lastName: 'ธนารักษ์', nickname: 'พิม', grade: 'ม.6', room: '1', number: 3, guidanceNote: 'ผ่านคัดเลือกสัมภาษณ์รอบโควตานักเรียนเรียนดี' },
  { id: 'std-m6-4', studentCode: '43604', prefix: 'นางสาว', firstName: 'ศิริรัตน์', lastName: 'มนูธรรมสกุล', nickname: 'ตาล', grade: 'ม.6', room: '1', number: 4, guidanceNote: 'ต้องการปรึกษาเรื่องการเตรียมสอบ' }
];

export const INITIAL_SESSIONS: AttendanceSession[] = [
  // สัปดาห์ที่ 1 ม.1/1
  {
    id: 'ses-m1-1-w1',
    date: '2026-05-20',
    grade: 'ม.1',
    room: '1',
    weekNumber: 1,
    topic: 'ปฐมนิเทศกิจกรรมแนะแนว & สร้างข้อตกลงร่วมกัน',
    teacherNotes: 'นักเรียนให้ความร่วมมือดี แนะนำตัวและรับทราบเกณฑ์ 80%',
    records: {
      'std-m1-1': 'present',
      'std-m1-2': 'present',
      'std-m1-3': 'present',
      'std-m1-4': 'present',
      'std-m1-5': 'present',
      'std-m1-6': 'present'
    },
    updatedAt: '2026-05-20T10:00:00.000Z'
  },
  // สัปดาห์ที่ 2 ม.1/1
  {
    id: 'ses-m1-1-w2',
    date: '2026-05-27',
    grade: 'ม.1',
    room: '1',
    weekNumber: 2,
    topic: 'การสำรวจตนเอง: ค้นหาจุดเด่นและเอกลักษณ์เฉพาะตัว',
    teacherNotes: 'ทำแบบประเมินพหุปัญญาครบถ้วน',
    records: {
      'std-m1-1': 'present',
      'std-m1-2': 'late',
      'std-m1-3': 'present',
      'std-m1-4': 'present',
      'std-m1-5': 'present',
      'std-m1-6': 'leave'
    },
    remarks: {
      'std-m1-2': 'มาสาย 10 นาทีเนื่องจากรถติด',
      'std-m1-6': 'ลาป่วย มีใบรับรองแพทย์'
    },
    updatedAt: '2026-05-27T10:00:00.000Z'
  },
  // สัปดาห์ที่ 3 ม.1/1
  {
    id: 'ses-m1-1-w3',
    date: '2026-06-03',
    grade: 'ม.1',
    room: '1',
    weekNumber: 3,
    topic: 'การปรับตัวทางอารมณ์และสังคมในวัยรุ่น',
    teacherNotes: 'นักเรียนแลกเปลี่ยนความคิดเห็นเรื่องการทำงานกลุ่ม',
    records: {
      'std-m1-1': 'present',
      'std-m1-2': 'present',
      'std-m1-3': 'late',
      'std-m1-4': 'present',
      'std-m1-5': 'present',
      'std-m1-6': 'absent'
    },
    remarks: {
      'std-m1-6': 'ขาดเรียน ไม่ได้แจ้งสาเหตุ ประสานผู้ปกครอง'
    },
    updatedAt: '2026-06-03T10:00:00.000Z'
  },
  // สัปดาห์ที่ 4 ม.1/1
  {
    id: 'ses-m1-1-w4',
    date: '2026-06-10',
    grade: 'ม.1',
    room: '1',
    weekNumber: 4,
    topic: 'การบริหารเวลาและเทคนิคการเรียนอย่างมีประสิทธิภาพ',
    teacherNotes: 'ให้นักเรียนออกแบบตารางชีวิตของตนเอง',
    records: {
      'std-m1-1': 'present',
      'std-m1-2': 'present',
      'std-m1-3': 'present',
      'std-m1-4': 'present',
      'std-m1-5': 'present',
      'std-m1-6': 'leave'
    },
    updatedAt: '2026-06-10T10:00:00.000Z'
  },
  // สัปดาห์ที่ 5 ม.1/1
  {
    id: 'ses-m1-1-w5',
    date: '2026-06-17',
    grade: 'ม.1',
    room: '1',
    weekNumber: 5,
    topic: 'โลกของอาชีพในยุคดิจิทัลและ AI',
    teacherNotes: 'นักเรียนตื่นเต้นกับตัวอย่าง AI และอาชีพในอนาคต',
    records: {
      'std-m1-1': 'present',
      'std-m1-2': 'activity',
      'std-m1-3': 'present',
      'std-m1-4': 'present',
      'std-m1-5': 'present',
      'std-m1-6': 'present'
    },
    remarks: {
      'std-m1-2': 'ไปแข่งขันบาสเกตบอลตัวแทนโรงเรียน'
    },
    updatedAt: '2026-06-17T10:00:00.000Z'
  },

  // ม.6/1 สัปดาห์ที่ 1-5 (แสดงผลกลุ่มเสี่ยง มผ. เพื่อสาธิตระบบ Alert)
  {
    id: 'ses-m6-1-w1',
    date: '2026-05-22',
    grade: 'ม.6',
    room: '1',
    weekNumber: 1,
    topic: 'ปฐมนิเทศกิจกรรมแนะแนว & วางแผนเป้าหมายชีวิต ม.6',
    records: {
      'std-m6-1': 'present',
      'std-m6-2': 'present',
      'std-m6-3': 'present',
      'std-m6-4': 'present'
    },
    updatedAt: '2026-05-22T11:00:00.000Z'
  },
  {
    id: 'ses-m6-1-w2',
    date: '2026-05-29',
    grade: 'ม.6',
    room: '1',
    weekNumber: 2,
    topic: 'การวางแผนการศึกษาต่อระดับอุดมศึกษา (TCAS & ทุนการศึกษา)',
    records: {
      'std-m6-1': 'present',
      'std-m6-2': 'absent',
      'std-m6-3': 'present',
      'std-m6-4': 'present'
    },
    remarks: {
      'std-m6-2': 'ขาดเรียน'
    },
    updatedAt: '2026-05-29T11:00:00.000Z'
  },
  {
    id: 'ses-m6-1-w3',
    date: '2026-06-05',
    grade: 'ม.6',
    room: '1',
    weekNumber: 3,
    topic: 'การสร้างแฟ้มสะสมผลงาน (e-Portfolio) ฉบับมืออาชีพ',
    records: {
      'std-m6-1': 'present',
      'std-m6-2': 'absent',
      'std-m6-3': 'present',
      'std-m6-4': 'late'
    },
    remarks: {
      'std-m6-2': 'ขาดเรียนติดต่อกันเป็นครั้งที่ 2'
    },
    updatedAt: '2026-06-05T11:00:00.000Z'
  },
  {
    id: 'ses-m6-1-w4',
    date: '2026-06-12',
    grade: 'ม.6',
    room: '1',
    weekNumber: 4,
    topic: 'การรับมือกับภาวะ Burnout และการดูแลสุขภาพจิต',
    records: {
      'std-m6-1': 'present',
      'std-m6-2': 'absent',
      'std-m6-3': 'present',
      'std-m6-4': 'present'
    },
    remarks: {
      'std-m6-2': 'แจ้งครูที่ปรึกษาติดตาม'
    },
    updatedAt: '2026-06-12T11:00:00.000Z'
  },
  {
    id: 'ses-m6-1-w5',
    date: '2026-06-19',
    grade: 'ม.6',
    room: '1',
    weekNumber: 5,
    topic: 'การเตรียมความพร้อมสู่การสัมภาษณ์และการนำเสนอตนเอง',
    records: {
      'std-m6-1': 'present',
      'std-m6-2': 'present',
      'std-m6-3': 'present',
      'std-m6-4': 'present'
    },
    updatedAt: '2026-06-19T11:00:00.000Z'
  }
];
