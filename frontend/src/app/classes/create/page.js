"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/utils/api';

export default function CreateClass() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [schedule, setSchedule] = useState([{ day: 'Mon', startTime: '', endTime: '' }]);
  const router = useRouter();

  const handleScheduleChange = (index, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const addScheduleSlot = () => {
    setSchedule([...schedule, { day: 'Mon', startTime: '', endTime: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/classes', { name, code, schedule });
      router.push('/dashboard');
    } catch (error) {
      alert('Failed to create class');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Class</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Class Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded text-gray-900"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Class Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2 border rounded text-gray-900"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Schedule</label>
            {schedule.map((slot, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  value={slot.day}
                  onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                  className="p-2 border rounded text-gray-900"
                >
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                  className="p-2 border rounded text-gray-900"
                  required
                />
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                  className="p-2 border rounded text-gray-900"
                  required
                />
              </div>
            ))}
            <button type="button" onClick={addScheduleSlot} className="text-blue-500 text-sm hover:underline">
              + Add Slot
            </button>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Class
          </button>
        </form>
      </div>
    </div>
  );
}
