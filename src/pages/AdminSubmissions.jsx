import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Users, ShieldAlert, Award } from 'lucide-react';

export default function AdminSubmissions() {
  const { examId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: examData } = await supabase.from('exams').select('*').eq('id', examId).single();
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('exam_id', examId)
        .order('submitted_at', { ascending: false });

      setExam(examData);
      setSubmissions(subData || []);
      setLoading(false);
    };

    fetchData();
  }, [examId]);

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-teal-800 hover:text-teal-900 text-xs font-bold mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Console
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Submissions: {exam ? exam.title : 'Loading...'}
          </h1>
        </div>
        <div className="bg-white border border-zinc-200/80 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 shadow-xs">
          Total Candidates: <span className="font-extrabold text-teal-800">{submissions.length}</span>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Candidate Name</th>
                <th className="p-4">Candidate Email</th>
                <th className="p-4">Raw Score</th>
                <th className="p-4">Security Strikes</th>
                <th className="p-4 text-right">Final Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-zinc-400">Loading candidate records...</td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-400">No student submissions recorded for this test.</td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="p-4 font-bold text-zinc-900">{sub.student_name}</td>
                    <td className="p-4 text-zinc-500">{sub.student_email}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                        <Award className="w-3.5 h-3.5 text-teal-600" />
                        {sub.score}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded text-xs ${
                          sub.violations_count > 0
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {sub.violations_count > 0 && <ShieldAlert className="w-3 h-3 text-amber-600" />}
                        {sub.violations_count} / 3 Strikes
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {sub.is_terminated ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg">
                          Terminated
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg">
                          Completed
                        </span>
                      )}
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