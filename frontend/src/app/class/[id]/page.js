"use client";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import API from '@/utils/api';

export default function ClassPage() {
  const { id } = useParams();
  const router = useRouter();
  const [classData, setClassData] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Matrix State
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('attendance');
  const [newColumnAccess, setNewColumnAccess] = useState('public');
  const [showAddColumn, setShowAddColumn] = useState(false);
  
  // Undo State
  const [history, setHistory] = useState([]);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      const [classRes, matrixRes] = await Promise.all([
        API.get(`/classes/${id}`),
        API.get(`/classes/${id}/matrix`)
      ]);
      
      // Strict Sorting: Attendance (Date ASC) -> Marks (Date ASC) -> Others (Date ASC)
      if (classRes.data?.columns) {
        classRes.data.columns.sort((a, b) => {
          const typeOrder = { 'attendance': 1, 'marks': 2, 'remarks': 3 };
          const typeA = typeOrder[a.type] || 4;
          const typeB = typeOrder[b.type] || 4;
          
          if (typeA !== typeB) {
            return typeA - typeB;
          }
          
          return new Date(a.date) - new Date(b.date);
        });
      }

      setClassData(classRes.data);
      setMatrix(matrixRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchData();
  }, [id, fetchData]);

  // Actions
  const handleApprove = async (studentId) => {
    try {
      await API.put(`/classes/${id}/approve`, { studentId });
      fetchData(); // Refresh to show in roster and backfill
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleDecline = async (studentId) => {
    try {
      await API.put(`/classes/${id}/decline`, { studentId });
      fetchData();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if(!confirm("Are you sure you want to remove this student?")) return;
    try {
      await API.put(`/classes/${id}/remove`, { studentId });
      fetchData();
    } catch (err) {
      alert('Failed to remove student');
    }
  };

  const handleDeleteColumn = async (columnId) => {
     if(!confirm("Are you sure? This will delete all data in this column.")) return;
     try {
       await API.delete(`/classes/${id}/columns/${columnId}`);
       fetchData();
     } catch (err) {
       alert('Failed to delete column');
     }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/classes/${id}/columns`, {
        name: newColumnName,
        type: newColumnType,
        access: newColumnAccess
      });
      setShowAddColumn(false);
      setNewColumnName('');
      fetchData();
    } catch (err) {
      alert('Failed to add column');
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this class? It will be hidden from dashboard.')) return;
    try {
      await API.put(`/classes/${id}/archive`);
      alert('Class archived');
      window.location.href = '/dashboard';
    } catch (err) {
      alert('Failed to archive');
    }
  };

  const handleDownloadCSV = () => {
    const includePrivate = isTeacher ? confirm('Include Private columns in export?') : false;
    const colsToExport = includePrivate ? classData.columns : classData.columns.filter(c => c.access === 'public');
    const headers = ['Student Name', 'Stats', ...colsToExport.map(c => `${c.name} (${new Date(c.date).toLocaleDateString()})`)];
    
    const rows = classData.students.map(student => {
      const stats = getStudentStats(student._id);
      const values = colsToExport.map(col => getCellValue(student._id, col._id) || '-');
      return [student.name, stats, ...values];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classData.name}_Report.csv`;
    a.click();
  };

  const handleCellChange = async (studentId, columnId, value) => {
    // Record for Undo
    const previousValue = getCellValue(studentId, columnId);
    setHistory(prev => [...prev, { studentId, columnId, value: previousValue }]);

    // Optimistic Update
    const newMatrix = [...matrix];
    const recordIndex = newMatrix.findIndex(r => r.studentId === studentId && r.columnId === columnId);
    
    if (recordIndex >= 0) {
      newMatrix[recordIndex].value = value;
    } else {
      newMatrix.push({ studentId, columnId, value, classId: id });
    }
    setMatrix(newMatrix);

    try {
      await API.put(`/classes/${id}/cells`, { studentId, columnId, value });
    } catch (err) {
      console.error('Failed to save cell');
      // Revert optimization on error? Or just refresh.
      fetchData(); 
    }
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    
    const lastAction = history[history.length - 1];
    const { studentId, columnId, value } = lastAction;
    
    // Pop from history
    setHistory(prev => prev.slice(0, -1));

    // Optimistic Revert
    const newMatrix = [...matrix];
    const recordIndex = newMatrix.findIndex(r => r.studentId === studentId && r.columnId === columnId);
     
    if (recordIndex >= 0) {
      newMatrix[recordIndex].value = value;
    } 
    setMatrix(newMatrix);
    
    // API Revert
    try {
      await API.put(`/classes/${id}/cells`, { studentId, columnId, value });
    } catch (err) {
      console.error('Undo failed');
      fetchData();
    }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">Loading Class Data...</div>;
  if (!classData) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-red-500">Class not found</div>;

  const isTeacher = user.role === 'teacher' && classData.teacher._id === user._id;

  // Filter columns for students
  const visibleColumns = isTeacher 
    ? classData.columns 
    : classData.columns.filter(c => c.access === 'public');

  const getCellValue = (studentId, columnId) => {
    const record = matrix.find(r => r.studentId === studentId && r.columnId === columnId);
    return record ? record.value : '';
  };

  const getStudentStats = (studentId) => {
    const attendanceCols = classData.columns.filter(c => c.type === 'attendance');
    if (attendanceCols.length === 0) return 'N/A';
    
    let present = 0;
    attendanceCols.forEach(col => {
      const val = getCellValue(studentId, col._id);
      if (val === 'P' || val === 'Present') present++;
    });
    
    return Math.round((present / attendanceCols.length) * 100) + '%';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 px-4 sm:px-6 lg:px-8 pb-12 transition-colors duration-300 print:pt-0 print:px-0 print:bg-white">
      <div className="max-w-full mx-auto">
        {/* Print Only Header */}
        <div className="hidden print:flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-xl">
                 R
              </div>
              <span className="font-bold text-2xl text-gray-900">RollCall</span>
           </div>
           <div className="text-right">
              <h1 className="text-xl font-bold text-gray-900">{classData.name} ({classData.code})</h1>
              <p className="text-gray-600">Professor: {classData.teacher.name}</p>
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
           </div>
        </div>

        {/* Navigation / Header */}
         <div className="mb-6 print:hidden">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Go Back
            </button>
         </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{classData.name}</h1>
               <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-mono px-2 py-1 rounded-full">{classData.code}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
               {isTeacher 
                 ? `Manage your ${classData.students.length} students` 
                 : `Teacher: ${classData.teacher.name}`
               }
            </p>
          </div>
          
          {isTeacher && (
            <div className="flex flex-wrap gap-2">
               {/* Undo Button */}
              {history.length > 0 && (
                <button 
                  onClick={handleUndo}
                  className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-5 py-2.5 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900/60 transition font-medium text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                  Undo
                </button>
              )}

              <button 
                onClick={() => setShowAddColumn(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 dark:shadow-blue-900/20 font-medium text-sm flex items-center gap-2"
              >
                <span>+</span> Add Column
              </button>
              <button onClick={handleDownloadCSV} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition font-medium text-sm flex items-center gap-2">
                Download CSV
              </button>
              <button onClick={() => window.print()} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition font-medium text-sm">
                Print
              </button>
              <button onClick={handleArchive} className="bg-white dark:bg-gray-700 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-5 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium text-sm">
                Archive
              </button>
            </div>
          )}
        </div>

        {/* Join Requests (Teacher Only) */}
        {isTeacher && classData?.joinRequests?.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-6 rounded-2xl mb-8">
            <h3 className="font-bold text-amber-900 dark:text-amber-400 mb-4 flex items-center gap-2">
               Waiting Room ({classData.joinRequests.length})
            </h3>
            <div className="flex gap-4 flex-wrap">
              {classData.joinRequests.map(reqId => (
                 <div key={reqId} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/30 flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold">
                     ?
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Student ID: {reqId.substring(0,6)}...</p>
                      <div className="flex gap-3 mt-1 text-sm">
                         <button onClick={() => handleApprove(reqId)} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Accept</button>
                         <button onClick={() => handleDecline(reqId)} className="text-red-600 dark:text-red-400 font-bold hover:underline">Decline</button>
                      </div>
                   </div>
                 </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats (Student Only) */}
        {!isTeacher && (
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl mb-8 shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
            <h3 className="text-blue-100 font-medium mb-1">Your Attendance Score</h3>
            <p className="text-4xl font-bold">{getStudentStats(user._id)}</p>
          </div>
        )}

        {/* Dynamic Matrix */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden print:shadow-none print:border-none print:overflow-visible">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs border-r border-gray-100 dark:border-gray-700 w-64 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">Student Name</th>
                  {isTeacher && <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs border-r border-gray-100 dark:border-gray-700 w-24 text-center">Stats</th>}
                  {visibleColumns.map(col => (
                    <th key={col._id} className="p-4 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs border-r border-gray-100 dark:border-gray-700 min-w-[160px] relative group">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-900 dark:text-gray-200 font-bold">{col.name}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                             {new Date(col.date).toLocaleDateString(undefined, {weekday: 'short', month:'short', day:'numeric'})}
                           </span>
                           {isTeacher && <span className={`text-[9px] px-1.5 py-0.5 rounded ${col.access === 'private' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>{col.access}</span>}
                        </div>
                      </div>
                      {isTeacher && (
                         <button 
                           onClick={() => handleDeleteColumn(col._id)}
                           className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                           title="Delete Column"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {(isTeacher ? classData.students : [user]).map((student) => { 
                  const rowStudent = isTeacher ? student : classData.students.find(s => s._id === user._id) || user;
                  
                  return (
                    <tr key={rowStudent._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="p-4 border-r border-gray-50 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-200 sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-blue-50/30 dark:group-hover:bg-gray-800 z-10">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                    {rowStudent.name.charAt(0)}
                                </div>
                                <span>{rowStudent.name}</span>
                            </div>
                            {isTeacher && (
                                <button 
                                  onClick={() => handleRemoveStudent(rowStudent._id)}
                                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove Student"
                                >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                         </div>
                      </td>
                      {isTeacher && (
                        <td className="p-4 border-r border-gray-50 dark:border-gray-700 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {getStudentStats(rowStudent._id)}
                          </span>
                        </td>
                      )}
                      
                      {visibleColumns.map(col => (
                        <td key={col._id} className="p-3 border-r border-gray-50 dark:border-gray-700">
                          {isTeacher ? (
                            col.type === 'attendance' ? (
                               <select 
                                value={getCellValue(rowStudent._id, col._id) || 'Absent'}
                                onChange={(e) => handleCellChange(rowStudent._id, col._id, e.target.value)}
                                className={`w-full p-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer border-transparent ${
                                  getCellValue(rowStudent._id, col._id) === 'Present' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 
                                  getCellValue(rowStudent._id, col._id) === 'Late' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 
                                  'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                }`}
                               >
                                 <option value="Present">Present</option>
                                 <option value="Absent">Absent</option>
                                 <option value="Late">Late</option>
                               </select>
                            ) : (
                              <input
                                type="text"
                                value={getCellValue(rowStudent._id, col._id) || ''}
                                onChange={(e) => handleCellChange(rowStudent._id, col._id, e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-center focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all dark:text-white"
                                placeholder={col.type === 'marks' ? '0' : '-'}
                              />
                            )
                          ) : (
                            <div className="flex justify-center">
                               {col.type === 'attendance' ? (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                     getCellValue(rowStudent._id, col._id) === 'Present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                     getCellValue(rowStudent._id, col._id) === 'Late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>
                                    {getCellValue(rowStudent._id, col._id) || 'Absent'}
                                  </span>
                               ) : (
                                  <span className="font-mono text-gray-700 dark:text-gray-300 font-medium">
                                    {getCellValue(rowStudent._id, col._id) || '-'}
                                  </span>
                               )}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Column Modal */}
        {showAddColumn && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md scale-100 transition-all">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add New Column</h2>
              <form onSubmit={handleAddColumn}>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Column Name</label>
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    placeholder="e.g. Unit Test 1"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                     {['attendance', 'marks', 'remarks'].map(type => (
                       <button
                         key={type}
                         type="button"
                         onClick={() => setNewColumnType(type)}
                         className={`p-2 rounded-lg text-sm font-medium capitalize border ${newColumnType === type ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                       >
                         {type}
                       </button>
                     ))}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Access</label>
                  <div className="grid grid-cols-2 gap-2">
                     {['public', 'private'].map(acc => (
                       <button
                         key={acc}
                         type="button"
                         onClick={() => setNewColumnAccess(acc)}
                         className={`p-2 rounded-lg text-sm font-medium capitalize border ${newColumnAccess === acc ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                       >
                         {acc}
                       </button>
                     ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {newColumnAccess === 'public' ? 'Visible to students immediately.' : 'Hidden from students.'}
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowAddColumn(false)} className="px-5 py-2.5 text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all hover:-translate-y-0.5">Add Column</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
