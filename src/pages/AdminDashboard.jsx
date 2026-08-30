import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Plus, Users, Clock, CheckCircle, Eye, EyeOff, LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    const { data } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
    setExams(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const toggleStatus = async (id, field, currentVal) => {
    await supabase.from('exams').update({ [field]: !currentVal }).eq('id', id);
    fetchExams();
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-teal-300 flex items-center justify-center shadow-xs">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Admin Examination Console</h1>
            <p className="text-xs text-zinc-500">Configure tests, release evaluation results, and monitor test records.</p>
          </div>
        </div>
        <Link
          to="/admin/create"
          className="flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition shadow-xs"
        >
          <Plus className="w-4 h-4" /> Create Assessment
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Assessment Title</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Exam Access</th>
                <th className="p-4">Score Release</th>
                <th className="p-4 text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-zinc-400">Loading exams...</td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-400">No examinations created yet.</td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="p-4 font-bold text-zinc-900 text-sm">{exam.title}</td>
                    <td className="p-4 text-zinc-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {exam.duration_minutes} Mins
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(exam.id, 'is_published', exam.is_published)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          exam.is_published
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${exam.is_published ? 'bg-emerald-600' : 'bg-zinc-400'}`}></span>
                        {exam.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(exam.id, 'show_results', exam.show_results)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          exam.show_results
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200'
                        }`}
                      >
                        {exam.show_results ? <Eye className="w-3.5 h-3.5 text-teal-700" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-400" />}
                        {exam.show_results ? 'Released to Students' : 'Scores Hidden'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/admin/submissions/${exam.id}`}
                        className="inline-flex items-center gap-1.5 text-teal-800 hover:text-teal-900 font-semibold text-xs bg-teal-50/70 hover:bg-teal-100/80 px-3 py-1.5 rounded-lg border border-teal-200/60 transition"
                      >
                        <Users className="w-3.5 h-3.5" /> Submissions
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}