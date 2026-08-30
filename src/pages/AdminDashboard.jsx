import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Plus, ListFilter } from 'lucide-react';

export default function AdminDashboard() {
  const [exams, setExams] = useState([]);

  const fetchExams = async () => {
    const { data } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
    setExams(data || []);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const toggleStatus = async (id, field, currentVal) => {
    await supabase.from('exams').update({ [field]: !currentVal }).eq('id', id);
    fetchExams();
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Admin Control Center</h1>
        <Link
          to="/admin/create"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Create Exam
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Published</th>
              <th className="p-4">Scores Released</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exams.map((exam) => (
              <tr key={exam.id} className="hover:bg-slate-50/80">
                <td className="p-4 font-medium text-slate-800">{exam.title}</td>
                <td className="p-4 text-slate-600">{exam.duration_minutes} mins</td>
                <td className="p-4">
                  <button
                    onClick={() => toggleStatus(exam.id, 'is_published', exam.is_published)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      exam.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {exam.is_published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleStatus(exam.id, 'show_results', exam.show_results)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      exam.show_results ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {exam.show_results ? 'Visible to Students' : 'Hidden'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <Link
                    to={`/admin/submissions/${exam.id}`}
                    className="inline-flex items-center gap-1 text-indigo-600 font-medium hover:underline text-xs"
                  >
                    <ListFilter className="w-3.5 h-3.5" /> View Submissions
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}