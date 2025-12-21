import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center text-center p-4 bg-[url('https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          RollCall
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-200 mb-8 font-medium">
          The Dynamic Attendance & Academic Management System
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 rounded-xl bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 font-bold text-lg shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition transform hover:-translate-y-1"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
