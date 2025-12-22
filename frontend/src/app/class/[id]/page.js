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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printIncludePrivate, setPrintIncludePrivate] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
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

      // Sort students by Roll Number (handle strings or numbers)
      if (classRes.data?.students) {
         classRes.data.students.sort((a, b) => {
            const rA = a.rollNumber || '';
            const rB = b.rollNumber || '';
            // Try numeric sort logic if it looks like a number
            return rA.toString().localeCompare(rB.toString(), undefined, { numeric: true });
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

  const handleUnarchive = async () => {
    if (!confirm('Are you sure you want to unarchive this class? It will act as a running class.')) return;
    try {
      await API.put(`/classes/${id}/unarchive`);
      alert('Class unarchived');
      window.location.href = '/dashboard';
    } catch (err) {
      alert('Failed to unarchive');
    }
  };

  const confirmDownloadCSV = (includePrivate) => {
    setShowExportModal(false);
    const colsToExport = includePrivate ? classData.columns : classData.columns.filter(c => c.access === 'public');
    const headers = ['Roll No', 'Student Name', 'Stats', ...colsToExport.map(c => `${c.name} (${new Date(c.date).toLocaleDateString()})`)];
    
    const rows = classData.students.map(s => {
      if (!s || !s.student) return null;
      const student = s.student; 
      const roll = s.rollNumber || '-';
      const stats = getStudentStats(student._id);
      const values = colsToExport.map(col => getCellValue(student._id, col._id) || '-');
      return [roll, student.name, stats, ...values]; 
    }).filter(r => r !== null);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classData.name}_Report.csv`;
    a.click();
  };

  const handleDownloadCSV = () => {
    setShowExportModal(true);
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const confirmPrint = (includePrivate) => {
    setShowPrintModal(false);
    setPrintIncludePrivate(includePrivate);
    setIsPrinting(true);
    
    // Allow React to render changes before printing
    setTimeout(() => {
        window.print();
        // Reset after print dialog closes (approximate, since window.print blocks JS execution in many browsers)
        setIsPrinting(false);
    }, 100);
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
  
  // Check student status
  const studentId = user._id;
  const isEnrolled = classData.students?.some(s => {
    if (!s || !s.student) return false;
    const sId = s.student._id || s.student; 
    return sId.toString() === studentId;
  }) || false;
  
  const isPending = classData.joinRequests?.some(r => {
     if (!r || !r.student) return false;
     const rId = r.student._id || r.student;
     return rId.toString() === studentId;
  }) || false;

  if (!isTeacher && !isEnrolled) {
     if (isPending) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-4">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-amber-100 dark:border-amber-900/30">
               <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Request Pending</h1>
               <p className="text-gray-500 dark:text-gray-400 mb-6">
                 Your request to join <span className="font-bold text-gray-900 dark:text-white">{classData.name}</span> is awaiting teacher approval.
               </p>
               <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                 Back to Dashboard
               </button>
             </div>
          </div>
        );
     }
     
     // Not enrolled and not pending (should generally not happen if they got here via dashboard, but possible via direct link)
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-4">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100 dark:border-red-900/30">
               <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               </div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
               <p className="text-gray-500 dark:text-gray-400 mb-6">
                 You are not enrolled in <span className="font-bold text-gray-900 dark:text-white">{classData.name}</span>.
               </p>
               <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
                 Go to Dashboard
               </button>
             </div>
          </div>
     );
  }

  // Filter columns for students
  // Filter columns for students
  // If isPrinting is true, use print config. Otherwise use standard logic.
  const visibleColumns = (() => {
    if (isPrinting) {
       return printIncludePrivate ? classData.columns : classData.columns.filter(c => c.access === 'public');
    }
    return isTeacher 
      ? classData.columns 
      : classData.columns.filter(c => c.access === 'public');
  })();

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
              <div className="w-10 h-10 relative">
                 <img src="/logo.png" alt="RollCall Logo" className="w-full h-full object-contain" />
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
               {!isTeacher && `Teacher: ${classData.teacher.name}`}
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
              <button onClick={handlePrint} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition font-medium text-sm">
                Print
              </button>
              {classData.isArchived ? (
                <button onClick={handleUnarchive} className="bg-white dark:bg-gray-700 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-5 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition font-medium text-sm">
                  Unarchive
                </button>
              ) : (
                <button onClick={handleArchive} className="bg-white dark:bg-gray-700 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-5 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium text-sm">
                  Archive
                </button>
              )}
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
              {classData.joinRequests.map(req => (
                 <div key={req._id || req.student?._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/30 flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold">
                     {req.student.name.charAt(0)}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{req.student.name}</p>
                      <p className="text-xs text-gray-500">Roll: {req.rollNumber || 'N/A'}</p>
                      <div className="flex gap-3 mt-1 text-sm">
                         <button onClick={() => handleApprove(req.student._id)} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Accept</button>
                         <button onClick={() => handleDecline(req.student._id)} className="text-red-600 dark:text-red-400 font-bold hover:underline">Decline</button>
                      </div>
                   </div>
                 </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Actions */}
        {!isTeacher && (
           <div className="flex justify-end mb-4 print:hidden">
              <button 
                 onClick={async () => {
                    if(!confirm("Are you sure you want to leave this class?")) return;
                    try {
                       await API.put(`/classes/${id}/leave`);
                       alert("You have left the class.");
                       window.location.href = "/dashboard";
                    } catch(err) {
                       alert("Failed to leave class");
                    }
                 }} 
                 className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200"
              >
                 Leave Class
              </button>
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
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 print:bg-white print:border-black">
                  <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 print:text-black uppercase tracking-wider text-xs border-r border-gray-100 dark:border-gray-700 print:border-black w-24 min-w-[6rem] sticky left-0 bg-gray-50 dark:bg-gray-800 print:bg-white z-10 text-center">Roll No</th>
                  <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 print:text-black uppercase tracking-wider text-xs border-r border-gray-100 dark:border-gray-700 print:border-black w-64 min-w-[16rem] sticky left-24 bg-gray-50 dark:bg-gray-800 print:bg-white z-10">Student Name</th>
                  {isTeacher && <th className="p-4 font-semibold text-gray-500 dark:text-gray-400 print:text-black uppercase tracking-wider text-xs border-r border-gray-100 dark:border-gray-700 print:border-black w-24 text-center">Stats</th>}
                  {visibleColumns.map(col => (
                    <th key={col._id} className="p-4 font-semibold text-gray-500 dark:text-gray-400 print:text-black uppercase tracking-wider text-xs border-r border-gray-100 dark:border-gray-700 print:border-black min-w-[160px] relative group">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-900 dark:text-gray-200 print:text-black font-bold">{col.name}</span>
                        <div className="flex items-center gap-2 print:hidden">
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
                {(isTeacher ? classData.students : [classData.students.find(s => {
                    if (!s || !s.student) return false;
                    const sId = s.student._id || s.student; // Handle population
                    return sId.toString() === user._id.toString();
                })]).filter(x=>x).map((sObject) => { 
                  // sObject is { student: {...}, rollNumber: 123 }
                  // For teacher: sObject is one of classData.students
                  // For student: we found the specific record
                  
                  // Handle potential missing data if DB inconsistent during migration
                  if (!sObject || !sObject.student) return null;

                  const rowStudent = sObject.student;
                  const rowRoll = sObject.rollNumber || '-';

                  return (
                    <tr key={rowStudent._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group print:bg-white">
                      <td className="p-4 font-medium text-gray-900 dark:text-white print:text-black border-r border-gray-50 dark:border-gray-700 print:border-black w-24 min-w-[6rem] sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 print:bg-white z-10 text-center">
                        {rowRoll}
                      </td>
                      <td className="p-4 border-r border-gray-50 dark:border-gray-700 print:border-black w-64 min-w-[16rem] sticky left-24 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 print:bg-white z-10">
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
                      
                      {visibleColumns.map(col => {
                        const cellValue = getCellValue(rowStudent._id, col._id);
                        return (
                        <td key={col._id} className="p-3 border-r border-gray-50 dark:border-gray-700 print:border-black">
                          {isTeacher ? (
                            <>
                              <div className="print:hidden">
                                {col.type === 'attendance' ? (
                                  <select 
                                    value={cellValue || 'Absent'}
                                    onChange={(e) => handleCellChange(rowStudent._id, col._id, e.target.value)}
                                    className={`w-full p-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer border-transparent ${
                                      cellValue === 'Present' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 
                                      cellValue === 'Late' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 
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
                                    value={cellValue || ''}
                                    onChange={(e) => handleCellChange(rowStudent._id, col._id, e.target.value)}
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-center focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all dark:text-white"
                                    placeholder={col.type === 'marks' ? '0' : '-'}
                                  />
                                )}
                              </div>
                              <div className="hidden print:block text-center font-bold text-black">
                                {col.type === 'attendance' ? (
                                   cellValue === 'Present' ? 'P' : cellValue === 'Late' ? 'L' : 'A'
                                ) : (
                                   cellValue || '-'
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-center">
                               {col.type === 'attendance' ? (
                                  <>
                                    <span className={`print:hidden px-3 py-1 rounded-full text-xs font-bold ${
                                       cellValue === 'Present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                       cellValue === 'Late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                      {cellValue || 'Absent'}
                                    </span>
                                    <span className="hidden print:block font-bold text-black">
                                       {cellValue === 'Present' ? 'P' : cellValue === 'Late' ? 'L' : 'A'}
                                    </span>
                                  </>
                               ) : (
                                  <span className="font-mono text-gray-700 dark:text-gray-300 font-medium text-black">
                                    {cellValue || '-'}
                                  </span>
                               )}
                            </div>
                          )}
                        </td>
                        );
                      })}
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm scale-100 transition-all border border-gray-100 dark:border-gray-700">
             <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             </div>
             <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Export to CSV</h2>
             <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Do you want to include private columns (hidden from students) in this export?</p>
             
             <div className="flex flex-col gap-3">
               <button 
                 onClick={() => confirmDownloadCSV(true)}
                 className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
               >
                 Include Private Data
                 <span className="bg-blue-500 px-2 py-0.5 rounded text-xs">Recommended</span>
               </button>
               <button 
                 onClick={() => confirmDownloadCSV(false)}
                 className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors"
               >
                 Public Data Only
               </button>
             </div>
             <button 
               onClick={() => setShowExportModal(false)}
               className="mt-4 w-full text-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium"
             >
               Cancel
             </button>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm scale-100 transition-all border border-gray-100 dark:border-gray-700">
             <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             </div>
             <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Print Options</h2>
             <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Choose what data to include in the printout.</p>
             
             <div className="flex flex-col gap-3">
               <button 
                 onClick={() => confirmPrint(true)}
                 className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
               >
                 Include Private Data
               </button>
               <button 
                 onClick={() => confirmPrint(false)}
                 className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
               >
                 Public Data Only
                 <span className="bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded text-xs">Recommended</span>
               </button>
             </div>
             <button 
               onClick={() => setShowPrintModal(false)}
               className="mt-4 w-full text-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium"
             >
               Cancel
             </button>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
