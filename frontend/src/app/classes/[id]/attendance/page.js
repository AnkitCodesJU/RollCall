"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import API from '@/utils/api';

export default function MarkAttendance() {
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const router = useRouter();

  useEffect(() => {
    fetchClassData();
  }, [id]);

  const fetchClassData = async () => {
    try {
      const { data } = await API.get(`/classes/${id}`);
      setClassData(data);
      // Initialize attendance state
      const initialAttendance = {};
      data.students.forEach(student => {
        initialAttendance[student._id] = 'Absent';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to fetch class data', error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const records = Object.keys(attendance).map(studentId => ({
      student: studentId,
      status: attendance[studentId]
    }));

    try {
      await API.post('/attendance', {
        classId: id,
        date,
        records
      });
      alert('Attendance marked successfully');
      router.push('/dashboard');
    } catch (error) {
      alert('Failed to mark attendance');
    }
  };

  if (!classData) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Mark Attendance: {classData.name}</h2>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded text-gray-900"
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left text-gray-800">Student Name</th>
                  <th className="py-2 px-4 border-b text-left text-gray-800">ID</th>
                  <th className="py-2 px-4 border-b text-left text-gray-800">Status</th>
                </tr>
              </thead>
              <tbody>
                {classData.students.map(student => (
                  <tr key={student._id}>
                    <td className="py-2 px-4 border-b text-gray-700">{student.name}</td>
                    <td className="py-2 px-4 border-b text-gray-700">{student.studentId}</td>
                    <td className="py-2 px-4 border-b">
                      <select
                        value={attendance[student._id]}
                        onChange={(e) => handleStatusChange(student._id, e.target.value)}
                        className={`p-1 border rounded ${
                          attendance[student._id] === 'Present' ? 'bg-green-100 text-green-800' :
                          attendance[student._id] === 'Absent' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                        <option value="Excused">Excused</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button
            type="submit"
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Submit Attendance
          </button>
        </form>
      </div>
    </div>
  );
}
