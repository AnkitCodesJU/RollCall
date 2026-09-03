"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import API from '@/utils/api';
import { useAuth } from '@/utils/AuthContext';

export default function ClassDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [classData, setClassData] = useState(null);
  const [matrixData, setMatrixData] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchClassData();
      fetchMatrix();
    }
  }, [id, user, authLoading]);

  const fetchClassData = async () => {
    try {
      const { data } = await API.get(`/classes/${id}`);
      setClassData(data);
    } catch (error) {
      console.error('Failed to fetch class', error);
    }
  };

  const fetchMatrix = async () => {
    try {
      const { data } = await API.get(`/classes/${id}/matrix`);
      setMatrixData(data);
    } catch (error) {
      console.error('Failed to fetch matrix records', error);
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

  if (authLoading || !user) return <div className="p-8">Loading...</div>;
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

        <h3 className="text-xl font-bold mb-4 text-gray-800">Your Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Column Name</th>
                <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody>
              {classData.columns?.length > 0 ? (
                classData.columns.map((column) => {
                  const record = matrixData.find(r => r.columnId === column._id);
                  const val = record ? record.value : '-';
                  
                  return (
                    <tr key={column._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 border-b text-gray-800 font-medium">{column.name}</td>
                      <td className="py-3 px-4 border-b text-gray-600 capitalize">{column.type}</td>
                      <td className="py-3 px-4 border-b text-gray-800">
                        {column.type === 'attendance' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            val === 'Present' ? 'bg-green-100 text-green-800' :
                            val === 'Absent' ? 'bg-red-100 text-red-800' :
                            val === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {val}
                          </span>
                        ) : (
                          <span className="font-semibold">{val}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
