import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Clock, PlayCircle, CheckCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState({});

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: examsData } = await supabase.from('exams').select('*').eq('is_published', true);
      const { data: subsData } = await supabase.from('submissions').select('*').eq('student_id', user.id);

      const subMap = {};
      (subsData || []).forEach((s) => {
        subMap[s.exam_id] = s;
      });

      setExams(examsData || []);
      setSubmissions(subMap);
    };

    if (user) loadDashboard();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Available Exams</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((exam) => {
          const submission = submissions[exam.id];

          return (
            <div key={exam.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{exam.title}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                  <Clock className="w-4 h-4" /> {exam.duration_minutes} minutes
                </div>
              </div>

              {submission ? (
                <Link
                  to={`/result/${exam.id}`}
                  className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> View Status
                </Link>
              ) : (
                <Link
                  to={`/exam/${exam.id}`}
                  className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow"
                >
                  <PlayCircle className="w-4 h-4" /> Start Exam
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}