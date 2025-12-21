"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/utils/api';
import Link from 'next/link';

export default function Dashboard() {
  const [classes, setClasses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data } = await API.get('/classes');
      setClasses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await API.post('/classes', { name: newClassName });
      setShowCreateModal(false);
      setNewClassName('');
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create class');
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    try {
      await API.post('/classes/join', { code: joinCode });
      setShowJoinModal(false);
      setJoinCode('');
      alert('Join request sent! Wait for approval.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join class');
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your academic journey</p>
          </div>
          <div className="flex gap-4">
            {user.role === 'teacher' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-medium flex items-center gap-2"
              >
                <span>+</span> Create Class
              </button>
            )}
            {user.role === 'student' && (
              <button
                onClick={() => setShowJoinModal(true)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 font-medium"
              >
                Join Class
              </button>
            )}
          </div>
        </div>

        {/* Class Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((cls) => (
            <Link href={`/class/${cls._id}`} key={cls._id} className="group">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden relative h-full">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left md:group-hover:scale-x-100 transition-transform duration-500 md:scale-x-0"></div>
                <div className="p-8">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-mono tracking-wider">
                        {cls.code}
                      </span>
                   </div>
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{cls.name}</h2>
                   <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                     {user.role === 'teacher' ? `${cls.students.length} Students Enrolled` : `Teacher: ${cls.teacher.name}`}
                   </p>
                   <div className="flex items-center text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                     View Classroom &rarr;
                   </div>
                </div>
              </div>
            </Link>
          ))}
          {classes.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
               <p className="text-gray-400 text-lg">No classes found. Start by creating or joining one.</p>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md scale-100 transition-all">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Create New Class</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Give your class a name to get started.</p>
              <form onSubmit={handleCreateClass}>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Class Name (e.g. Advanced Math)"
                  className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl mb-6 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  required
                />
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5">Create Class</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Join Class</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Enter the 6-character code provided by your teacher.</p>
              <form onSubmit={handleJoinClass}>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Class Code"
                  className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl mb-6 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all uppercase tracking-widest font-mono text-center text-lg"
                  required
                />
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowJoinModal(false)} className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5">Join Class</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
