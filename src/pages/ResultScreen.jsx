import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  Award, CheckCircle2, XCircle, AlertCircle, ShieldAlert, 
  ArrowLeft, Lock, FileText, Trophy, Clock, Medal 
} from 'lucide-react';

export default function ResultScreen() {
  const { id } = useParams();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResultData = async () => {
      if (!user) return;

      const { data: examData } = await supabase.from('exams').select('*').eq('id', id).single();
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('exam_id', id)
        .eq('student_id', user.id)
        .single();

      if (examData?.show_detailed_results) {
        const { data: qData } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', id)
          .order('created_at', { ascending: true });
        setQuestions(qData || []);
      }

      // Fetch leaderboard with Error Handling & Fallback
      if (examData?.show_leaderboard) {
        const { data: topList, error: rpcError } = await supabase
          .rpc('get_exam_leaderboard', { target_exam_id: id });
        
        if (rpcError) {
          console.error("RPC Leaderboard Error (Check Supabase SQL):", rpcError.message);
          
          // Backup standard query if RPC fails (relies on RLS allowing it)
          const { data: fallbackList } = await supabase
            .from('submissions')
            .select('student_id, student_name, score, time_taken_seconds')
            .eq('exam_id', id)
            .eq('is_terminated', false)
            .order('score', { ascending: false })
            .order('time_taken_seconds', { ascending: true })
            .order('submitted_at', { ascending: true });
            
          setLeaderboard(fallbackList || []);
        } else {
          setLeaderboard(topList || []);
        }
      }

      setExam(examData);
      setSubmission(subData);
      setLoading(false);
    };

    fetchResultData();
  }, [id, user]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '0m 0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center font-medium text-zinc-600">
        Loading Assessment Results...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white border border-zinc-200 rounded-2xl text-center space-y-4 shadow-xs">
        <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-900">No Submission Found</h2>
        <p className="text-xs text-zinc-500">We could not locate any recorded responses for your account.</p>
        <Link to="/" className="inline-block px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (!exam.show_results) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-8 bg-white border border-zinc-200 rounded-2xl text-center space-y-5 shadow-xs">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-900">Assessment Submitted Successfully</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Your answers have been securely logged. The administrator has not yet released the scoring results for <strong className="text-zinc-800">{exam.title}</strong>.
          </p>
        </div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-900 pt-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const totalQuestions = questions.length > 0 ? questions.length : Object.keys(submission.answers || {}).length;
  const percentage = totalQuestions > 0 ? Math.round((submission.score / totalQuestions) * 100) : 0;
  
  // Calculate user's rank safely
  const myRank = leaderboard?.length > 0 
    ? leaderboard.findIndex((item) => item.student_id === user.id) + 1 
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      <div className="flex justify-between items-center border-b border-zinc-200/80 pb-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-teal-800 hover:text-teal-900 text-xs font-bold mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-zinc-900">{exam.title} - Results</h1>
        </div>

        {exam.show_leaderboard && (
          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'summary' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              My Score
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'leaderboard' ? 'bg-white text-amber-800 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" /> Leaderboard
            </button>
          </div>
        )}
      </div>

      {activeTab === 'summary' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-teal-800">{submission.score}</span>
                {totalQuestions > 0 && <span className="text-sm font-medium text-zinc-400">/ {totalQuestions}</span>}
              </div>
            </div>

            <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Time Taken</span>
              <div className="text-2xl font-extrabold text-zinc-800">
                {formatTime(submission.time_taken_seconds)}
              </div>
            </div>

            <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Percentage</span>
              <div className="text-3xl font-extrabold text-zinc-800">{percentage}%</div>
            </div>

            <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Rank</span>
              <div className="text-3xl font-extrabold text-amber-700">
                {exam.show_leaderboard && myRank > 0 ? `#${myRank}` : 'Hidden'}
              </div>
            </div>
          </div>

          {exam.show_detailed_results ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-zinc-800 font-bold text-sm">
                <FileText className="w-4 h-4 text-teal-800" />
                <span>Question-by-Question Breakdown</span>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const studentChoice = submission.answers[idx];
                  const correctIndices = q.correct_answers;

                  let isCorrect = false;
                  if (q.type === 'single' || q.type === 'boolean') {
                    isCorrect = studentChoice !== undefined && correctIndices.includes(studentChoice);
                  } else if (q.type === 'multiple') {
                    isCorrect =
                      Array.isArray(studentChoice) &&
                      studentChoice.length === correctIndices.length &&
                      studentChoice.every((v) => correctIndices.includes(v));
                  }

                  return (
                    <div key={q.id} className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="font-semibold text-sm text-zinc-900 leading-snug">
                          <span className="text-zinc-400 mr-1.5">#{idx + 1}</span>
                          {q.question_text}
                        </div>
                        {isCorrect ? (
                          <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+1)
                          </span>
                        ) : (
                          <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect (0)
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const wasSelected =
                            q.type === 'multiple'
                              ? Array.isArray(studentChoice) && studentChoice.includes(oIdx)
                              : studentChoice === oIdx;
                          const isOptionCorrect = correctIndices.includes(oIdx);

                          let badgeStyle = 'border-zinc-200 bg-zinc-50/50 text-zinc-600';
                          if (wasSelected && isOptionCorrect) {
                            badgeStyle = 'border-emerald-300 bg-emerald-50/80 text-emerald-900 font-semibold';
                          } else if (wasSelected && !isOptionCorrect) {
                            badgeStyle = 'border-red-300 bg-red-50/80 text-red-900 font-semibold';
                          } else if (!wasSelected && isOptionCorrect) {
                            badgeStyle = 'border-emerald-300 bg-emerald-50/40 text-emerald-800 font-semibold dashed';
                          }

                          return (
                            <div key={oIdx} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${badgeStyle}`}>
                              <span>{opt}</span>
                              <div className="flex items-center gap-2">
                                {wasSelected && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-700">
                                    Your Choice
                                  </span>
                                )}
                                {isOptionCorrect && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-800">
                                    Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 text-center shadow-xs">
              <p className="text-xs text-zinc-500">
                Detailed question-by-question answer reviews have been disabled by the administrator for this assessment.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Top Performers</span>
            <span className="text-[11px] text-zinc-400">Tie-break resolved by fastest completion time</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/60 border-b border-zinc-100 text-zinc-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3.5">Rank</th>
                <th className="p-3.5">Candidate</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5">Time Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((row, idx) => {
                  const isMe = row.student_id === user.id;
                  return (
                    <tr key={idx} className={isMe ? 'bg-teal-50/60 font-bold' : 'hover:bg-zinc-50/50'}>
                      <td className="p-3.5">
                        {idx === 0 && <Medal className="w-4 h-4 inline text-amber-500 mr-1" />}
                        {idx === 1 && <Medal className="w-4 h-4 inline text-slate-400 mr-1" />}
                        {idx === 2 && <Medal className="w-4 h-4 inline text-amber-700 mr-1" />}
                        #{idx + 1}
                      </td>
                      <td className="p-3.5 text-zinc-900">
                        {row.student_name} {isMe && <span className="text-[10px] text-teal-700 ml-1.5 font-bold">(You)</span>}
                      </td>
                      <td className="p-3.5 text-teal-800 font-extrabold">{row.score}</td>
                      <td className="p-3.5 text-zinc-600">{formatTime(row.time_taken_seconds)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-zinc-400">
                    Leaderboard data is currently unavailable.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}