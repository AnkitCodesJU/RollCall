import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex flex-col justify-center items-center text-center p-4 bg-[url('https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center">
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 transition-colors duration-300">
            RollCall
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-10 font-medium max-w-2xl mx-auto">
            The Dynamic Attendance & Academic Management System
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition transform hover:-translate-y-1"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 rounded-xl bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-transparent font-bold text-lg shadow-lg hover:border-blue-600 dark:hover:border-blue-500 transition transform hover:-translate-y-1"
            >
              Register
            </Link>
          </div>
        </div>
      </div>

      {/* Features Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Powerful Features, Beautifully Designed</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Everything you need to manage classes effectively.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Feature 1 */}
          <div className="group relative overflow-hidden rounded-2xl shadow-xl dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
            <img src="/images/main_UI.png" alt="Main UI" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 p-8 z-20">
              <h3 className="text-2xl font-bold text-white mb-2">Intuitive Dashboard</h3>
              <p className="text-gray-300">Clean, responsive overview of all your classes and pending requests.</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative overflow-hidden rounded-2xl shadow-xl dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
            <img src="/images/class_UI.png" alt="Class UI" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 p-8 z-20">
              <h3 className="text-2xl font-bold text-white mb-2">Dynamic Matrix System</h3>
              <p className="text-gray-300">Custom columns for attendance, marks, and remarks in a sleek grid.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group relative overflow-hidden rounded-2xl shadow-xl dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
            <img src="/images/student_side_record.png" alt="Student View" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 p-8 z-20">
              <h3 className="text-2xl font-bold text-white mb-2">Student Analytics</h3>
              <p className="text-gray-300">Students get real-time tracking of their attendance scores and grades.</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="group relative overflow-hidden rounded-2xl shadow-xl dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
            <img src="/images/notification_system.png" alt="Notifications" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 p-8 z-20">
              <h3 className="text-2xl font-bold text-white mb-2">Smart Notifications</h3>
              <p className="text-gray-300">Instant alerts for new marks, attendance updates, and class enrollments.</p>
            </div>
          </div>
          
          {/* Feature 5 */}
          <div className="group relative overflow-hidden rounded-2xl shadow-xl dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
            <img src="/images/export_to_csv_demo.png" alt="Export" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 p-8 z-20">
              <h3 className="text-2xl font-bold text-white mb-2">One-Click Exports</h3>
              <p className="text-gray-300">Download class records to CSV or Print layouts instantly.</p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="group relative overflow-hidden rounded-2xl shadow-xl dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
            <img src="/images/dark_theme_dashboard.png" alt="Dark Mode" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 p-8 z-20">
              <h3 className="text-2xl font-bold text-white mb-2">Premium Dark Mode</h3>
              <p className="text-gray-300">Easy on the eyes, seamlessly integrated across the entire application.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
