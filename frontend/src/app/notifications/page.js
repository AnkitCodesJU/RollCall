"use client";
import { useState, useEffect } from 'react';
import API from '@/utils/api';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      // Update local state
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
             <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
               Notifications
             </h1>
             <p className="text-gray-500 dark:text-gray-400 mt-1">Stay updated with your classes</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'unread' ? 'bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
            >
              Unread
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredNotifications.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
               <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
               </div>
               <p className="text-gray-500 dark:text-gray-400 font-medium">No {filter === 'unread' ? 'unread' : ''} notifications</p>
            </div>
          )}
          {filteredNotifications.map(notification => (
            <div 
              key={notification._id}
              className={`group flex gap-4 p-5 rounded-2xl transition-all duration-300 border ${
                notification.read 
                  ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-75' 
                  : 'bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-900 shadow-lg shadow-blue-50 dark:shadow-none transform hover:-translate-y-1'
              }`}
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                 notification.type === 'attendance' && notification.message.includes('Present') ? 'bg-emerald-100 text-emerald-600' :
                 notification.type === 'attendance' && notification.message.includes('Absent') ? 'bg-red-100 text-red-600' :
                 notification.type === 'marks' ? 'bg-indigo-100 text-indigo-600' :
                 'bg-blue-100 text-blue-600'
              }`}>
                {notification.type === 'attendance' ? (
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                ) : (
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                   <p className={`text-gray-900 dark:text-white font-medium ${!notification.read ? 'font-bold' : ''}`}>
                     {notification.message}
                   </p>
                   {!notification.read && (
                    <button 
                      onClick={() => markAsRead(notification._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-blue-600"
                      title="Mark as read"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                   )}
                </div>
                <div className="flex items-center gap-4 mt-2">
                   <span className="text-xs text-gray-400 font-medium">{new Date(notification.createdAt).toLocaleString()}</span>
                   {notification.link && (
                    <Link href={notification.link} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      View details &rarr;
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
