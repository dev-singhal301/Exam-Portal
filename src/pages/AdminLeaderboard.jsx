import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Trophy, ArrowLeft, Clock, Award, Medal } from 'lucide-react';

export default function AdminLeaderboard() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      const { data: examData } = await supabase.from('exams').select('*').eq('id', examId).single();
      
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('exam_id', examId)
        .eq('is_terminated', false)
        .order('score', { ascending: false })
        .order('time_taken_seconds', { ascending: true })
        .order('submitted_at', { ascending: true });

      setExam(examData);
      setRankings(subData || []);
      setLoading(false);
    };

    fetchRankings();
  }, [examId]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 font-black"><Medal className="w-4 h-4 inline mr-1 text-amber-600" />#1</span>;
    if (rank === 2) return <span className="p-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold"><Medal className="w-4 h-4 inline mr-1 text-slate-500" />#2</span>;
    if (rank === 3) return <span className="p-1.5 rounded-lg bg-amber-700/10 text-amber-900 font-bold"><Medal className="w-4 h-4 inline mr-1 text-amber-700" />#3</span>;
    return <span className="text-zinc-500 font-semibold pl-2">#{rank}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-200/80 pb-5">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-teal-800 hover:text-teal-900 text-xs font-bold mb-2 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Console
          </Link>
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-600" />
            <h1 className="text-xl font-bold text-zinc-900">
              Official Leaderboard: {exam ? exam.title : 'Loading...'}
            </h1>
          </div>
        </div>
        <div className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg">
          Rank Criteria: <strong>Score (High)</strong> → <strong>Time Taken (Fastest)</strong>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase font-bold tracking-wider text-[11px]">
            <tr>
              <th className="p-4">Rank</th>
              <th className="p-4">Candidate</th>
              <th className="p-4">Score</th>
              <th className="p-4">Time Taken</th>
              <th className="p-4">Completion Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-medium">
            {loading ? (
              <tr><td colSpan="5" className="p-6 text-center text-zinc-400">Loading standings...</td></tr>
            ) : rankings.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-zinc-400">No qualifying submissions recorded.</td></tr>
            ) : (
              rankings.map((row, idx) => (
                <tr key={row.id} className="hover:bg-zinc-50/70 transition">
                  <td className="p-4">{getRankBadge(idx + 1)}</td>
                  <td className="p-4">
                    <span className="font-bold text-zinc-900 block">{row.student_name}</span>
                    <span className="text-[11px] text-zinc-400">{row.student_email}</span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                      <Award className="w-3.5 h-3.5 text-teal-600" />
                      {row.score}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-600">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {formatTime(row.time_taken_seconds)}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-400">
                    {new Date(row.submitted_at).toLocaleDateString()} at {new Date(row.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}