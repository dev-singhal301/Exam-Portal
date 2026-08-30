import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AdminSubmissions() {
  const { examId } = useParams();
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('exam_id', examId)
        .order('submitted_at', { ascending: false });
      setSubmissions(data || []);
    };
    fetchSubmissions();
  }, [examId]);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Exam Submissions</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="p-4">Student</th>
              <th className="p-4">Email</th>
              <th className="p-4">Score</th>
              <th className="p-4">Strikes</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.map((sub) => (
              <tr key={sub.id}>
                <td className="p-4 font-medium">{sub.student_name}</td>
                <td className="p-4 text-slate-500">{sub.student_email}</td>
                <td className="p-4 font-bold text-indigo-600">{sub.score}</td>
                <td className="p-4 text-amber-600 font-medium">{sub.violations_count}</td>
                <td className="p-4">
                  {sub.is_terminated ? (
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      Terminated
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      Completed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}