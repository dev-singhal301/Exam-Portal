import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Lock } from 'lucide-react';

export default function ResultScreen() {
  const { id } = useParams();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const { data: examData } = await supabase.from('exams').select('*').eq('id', id).single();
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('exam_id', id)
        .eq('student_id', user.id)
        .single();

      setExam(examData);
      setSubmission(subData);
    };
    if (user) fetchStatus();
  }, [id, user]);

  if (!exam || !submission) return <div className="p-8 text-center">Loading results...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-lg text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Test Submitted!</h1>
        <p className="text-slate-500 text-sm mb-6">{exam.title}</p>

        {exam.show_results ? (
          <div className="bg-slate-50 border p-4 rounded-xl mb-6">
            <span className="text-xs text-slate-500 block uppercase font-bold">Your Score</span>
            <span className="text-4xl font-extrabold text-indigo-600">{submission.score}</span>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6 flex items-center gap-3 text-left">
            <Lock className="w-5 h-5 text-slate-400" />
            <p className="text-xs text-slate-500">
              The administrator has not published test scores yet. Check back later.
            </p>
          </div>
        )}

        <Link to="/" className="inline-block w-full py-2.5 bg-slate-900 text-white font-medium rounded-xl">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}