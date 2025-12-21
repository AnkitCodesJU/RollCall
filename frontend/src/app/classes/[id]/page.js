"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import API from '@/utils/api';

export default function ClassDetails() {
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchClassData();
    fetchAttendance();
  }, [id]);

  const fetchClassData = async () => {
    try {
      const { data } = await API.get(`/classes/${id}`);
      setClassData(data);
    } catch (error) {
      console.error('Failed to fetch class', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await API.get(`/attendance/${id}`);
      setAttendanceHistory(data);
    } catch (error) {
      console.error('Failed to fetch attendance', error);
    }
  };

  const enrollStudent = async () => {
    if (!user) return;
    try {
      await API.post(`/classes/${id}/enroll`, { studentId: user._id });
      alert('Enrolled successfully');
      fetchClassData();
    } catch (error) {
      alert(error.response?.data?.message || 'Enrollment failed');
    }
  };

  if (!classData) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{classData.name}</h1>
            <p className="text-gray-600">Code: {classData.code}</p>
            <p className="text-gray-600">Teacher: {classData.teacher.name}</p>
          </div>
          {user?.role === 'student' && !classData.students.some(s => s._id === user._id) && (
            <button
              onClick={enrollStudent}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Enroll in Class
            </button>
          )}
        </div>

        <h3 className="text-xl font-bold mb-4 text-gray-800">Attendance History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left text-gray-800">Date</th>
                <th className="py-2 px-4 border-b text-left text-gray-800">Marked By</th>
                <th className="py-2 px-4 border-b text-left text-gray-800">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((record) => {
                // For students, show only their status. For teachers, show summary or link to details.
                // Simplified: Showing raw records for now.
                const myRecord = user?.role === 'student' 
                  ? record.records.find(r => r.student._id === user._id)
                  : null;

                return (
                  <tr key={record._id}>
                    <td className="py-2 px-4 border-b text-gray-700">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b text-gray-700">{record.markedBy?.name}</td>
                    <td className="py-2 px-4 border-b text-gray-700">
                      {user?.role === 'student' ? (
                        <span className={`font-bold ${
                          myRecord?.status === 'Present' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {myRecord?.status || 'N/A'}
                        </span>
                      ) : (
                        <span className="text-gray-500">{record.records.length} records</span>
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
}
