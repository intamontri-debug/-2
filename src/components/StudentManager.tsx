import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  RotateCcw, 
  Save, 
  Search, 
  Filter,
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Student, GradeLevel } from '../types';

interface StudentManagerProps {
  students: Student[];
  onSaveStudents: (updated: Student[]) => Promise<boolean | void> | void;
  onResetDefaults: () => void;
  selectedGrade: GradeLevel;
  setSelectedGrade: (g: GradeLevel) => void;
  selectedRoom: string;
  setSelectedRoom: (r: string) => void;
  isConnectedToSheets?: boolean;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  onSaveStudents,
  onResetDefaults,
  selectedGrade,
  setSelectedGrade,
  selectedRoom,
  setSelectedRoom,
  isConnectedToSheets = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form state for adding/editing
  const [formData, setFormData] = useState<Partial<Student>>({
    grade: selectedGrade,
    room: selectedRoom,
    prefix: 'เด็กชาย',
    firstName: '',
    lastName: '',
    nickname: '',
    studentCode: '',
    number: 1,
    guidanceNote: ''
  });

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
    return name.includes(q) || s.studentCode.includes(q) || (s.nickname || '').toLowerCase().includes(q);
  });

  const handleStartAdd = () => {
    const nextNumber = classStudents.length > 0
      ? Math.max(...classStudents.map(s => s.number)) + 1
      : 1;

    setFormData({
      grade: selectedGrade,
      room: selectedRoom,
      prefix: selectedGrade.startsWith('ม.4') || selectedGrade.startsWith('ม.5') || selectedGrade.startsWith('ม.6') ? 'นาย' : 'เด็กชาย',
      firstName: '',
      lastName: '',
      nickname: '',
      studentCode: `${selectedGrade.replace('.', '')}${selectedRoom}${nextNumber.toString().padStart(2, '0')}`,
      number: nextNumber,
      guidanceNote: ''
    });
    setEditingStudent(null);
    setIsAddingNew(true);
  };

  const handleStartEdit = (student: Student) => {
    setFormData({ ...student });
    setEditingStudent(student);
    setIsAddingNew(false);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.studentCode) {
      alert('กรุณากรอกชื่อ นามสกุล และรหัสนักเรียน');
      return;
    }

    const trimmedCode = (formData.studentCode || '').trim();

    // Check duplicate student code
    if (isAddingNew) {
      const exists = students.some(s => s.studentCode.trim() === trimmedCode);
      if (exists) {
        alert(`รหัสนักเรียน "${trimmedCode}" มีอยู่ในระบบแล้ว กรุณาตรวจสอบเพื่อป้องกันข้อมูลซ้ำซ้อน`);
        return;
      }

      const newStudent: Student = {
        id: `std-custom-${Date.now()}`,
        studentCode: trimmedCode,
        prefix: formData.prefix as any || 'เด็กชาย',
        firstName: (formData.firstName || '').trim(),
        lastName: (formData.lastName || '').trim(),
        nickname: (formData.nickname || '').trim(),
        grade: formData.grade as GradeLevel || selectedGrade,
        room: formData.room || selectedRoom,
        number: Number(formData.number) || 1,
        guidanceNote: formData.guidanceNote || ''
      };

      try {
        setIsSaving(true);
        setSaveError(null);
        await onSaveStudents([...students, newStudent]);
        setIsAddingNew(false);
      } catch (err: any) {
        console.error('Error saving student:', err);
        setSaveError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลนักเรียนลง Google Sheets');
      } finally {
        setIsSaving(false);
      }
    } else if (editingStudent) {
      const exists = students.some(s => s.id !== editingStudent.id && s.studentCode.trim() === trimmedCode);
      if (exists) {
        alert(`รหัสนักเรียน "${trimmedCode}" มีนักเรียนคนอื่นใช้อยู่แล้ว กรุณาตรวจสอบเพื่อป้องกันข้อมูลซ้ำซ้อน`);
        return;
      }

      const updated = students.map(s => {
        if (s.id === editingStudent.id) {
          return {
            ...s,
            ...formData,
            studentCode: trimmedCode,
            firstName: (formData.firstName || '').trim(),
            lastName: (formData.lastName || '').trim(),
            nickname: (formData.nickname || '').trim(),
            number: Number(formData.number) || s.number
          } as Student;
        }
        return s;
      });

      try {
        setIsSaving(true);
        setSaveError(null);
        await onSaveStudents(updated);
        setEditingStudent(null);
      } catch (err: any) {
        console.error('Error updating student:', err);
        setSaveError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลนักเรียนลง Google Sheets');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm('ยืนยันลบข้อมูลนักเรียนคนนี้?')) {
      try {
        setIsSaving(true);
        setSaveError(null);
        const updated = students.filter(s => s.id !== studentId);
        await onSaveStudents(updated);
      } catch (err: any) {
        console.error('Error deleting student:', err);
        setSaveError(err.message || 'เกิดข้อผิดพลาดในการลบข้อมูลนักเรียน');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Control and Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Grade selection */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            {grades.map(g => (
              <button
                key={g}
                id={`student-mgr-grade-${g}`}
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
                id={`student-mgr-room-${rm}`}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-students-mgr"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อหรือรหัส..."
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
            />
          </div>

          <button
            id="btn-add-new-student"
            onClick={handleStartAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มนักเรียน</span>
          </button>

          <button
            id="btn-reset-sample-data"
            onClick={() => {
              if (confirm('ต้องการโหลดข้อมูลตัวอย่างเริ่มต้น ม.1-ม.6 ใหม่ทั้งหมดหรือไม่?')) {
                onResetDefaults();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            title="รีเซ็ตเป็นข้อมูลตัวอย่าง ม.1 - ม.6"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">รีเซ็ตข้อมูลตัวอย่าง</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form Modal or Inline Panel */}
      {(isAddingNew || editingStudent) && (
        <div className="bg-white rounded-xl border-2 border-indigo-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            {isAddingNew ? <UserPlus className="w-4 h-4 text-indigo-600" /> : <Edit2 className="w-4 h-4 text-indigo-600" />}
            <span>{isAddingNew ? `เพิ่มนักเรียนใหม่ (${selectedGrade}/${selectedRoom})` : `แก้ไขข้อมูล: ${editingStudent?.prefix}${editingStudent?.firstName} ${editingStudent?.lastName}`}</span>
          </h3>

          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">คำนำหน้า</label>
                <select
                  value={formData.prefix}
                  onChange={e => setFormData({ ...formData, prefix: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                >
                  <option value="เด็กชาย">เด็กชาย</option>
                  <option value="เด็กหญิง">เด็กหญิง</option>
                  <option value="นาย">นาย</option>
                  <option value="นางสาว">นางสาว</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อจริง</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">นามสกุล</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อเล่น (ถ้ามี)</label>
                <input
                  type="text"
                  value={formData.nickname || ''}
                  onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสนักเรียน</label>
                <input
                  type="text"
                  required
                  value={formData.studentCode}
                  onChange={e => setFormData({ ...formData, studentCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">เลขที่</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.number}
                  onChange={e => setFormData({ ...formData, number: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">บันทึกข้อมูลแนะแนวเฉพาะบุคคล</label>
                <input
                  type="text"
                  value={formData.guidanceNote || ''}
                  onChange={e => setFormData({ ...formData, guidanceNote: e.target.value })}
                  placeholder="เช่น จุดเด่น, ความถนัด, ทุนการศึกษา หรือเรื่องที่ต้องติดตาม"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>

            {saveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingStudent(null);
                  setSaveError(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังบันทึกลง Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกข้อมูลนักเรียน</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              รายชื่อนักเรียนห้อง {selectedGrade}/{selectedRoom}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              {classStudents.length} คน
            </span>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">ไม่พบรายชื่อนักเรียนในห้องนี้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-14 text-center">เลขที่</th>
                  <th className="py-2.5 px-3 w-28">รหัสนักเรียน</th>
                  <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                  <th className="py-2.5 px-3 w-24">ชื่อเล่น</th>
                  <th className="py-2.5 px-3">บันทึกข้อมูลแนะแนว</th>
                  <th className="py-2.5 px-3 w-24 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {student.number}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {student.studentCode}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {student.prefix}{student.firstName} {student.lastName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {student.nickname || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-indigo-700">
                      {student.guidanceNote || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStartEdit(student)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
