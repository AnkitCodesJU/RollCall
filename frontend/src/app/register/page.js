"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/utils/api';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/users', form);
      localStorage.setItem('user', JSON.stringify(data));
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm"></div>
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/50 dark:border-gray-700/50">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Join RollCall today</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white/50 dark:bg-gray-800/50 dark:text-white"
                placeholder="John Doe"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white/50 dark:bg-gray-800/50 dark:text-white"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white/50 dark:bg-gray-800/50 dark:text-white"
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
                title="10 digit numeric value only"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white/50 dark:bg-gray-800/50 dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                 <button
                   type="button"
                   onClick={() => setForm({...form, role: 'student'})}
                   className={`py-2 px-4 border rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${form.role === 'student' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                 >
                   Student
                 </button>
                 <button
                   type="button"
                   onClick={() => setForm({...form, role: 'teacher'})}
                   className={`py-2 px-4 border rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${form.role === 'teacher' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                 >
                   Teacher
                 </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-200 dark:shadow-none text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5 mt-6"
            >
              Create Account
            </button>
            
            <div className="text-center text-sm mt-4">
              <span className="text-gray-500">Already have an account? </span>
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
