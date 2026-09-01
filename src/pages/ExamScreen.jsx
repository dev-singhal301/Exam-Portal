import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import QuestionPalette from '../components/QuestionPalette';
import { AlertOctagon, Clock, Maximize2, ArrowRight, ArrowLeft, Send } from 'lucide-react';

export default function ExamScreen() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  const strikesStorageKey = `strikes_${id}_${user?.id || 'guest'}`;

  const handleTermination = async (strikeCount) => {
    await submitTest(true, strikeCount);
  };

  const { strikes, isFullscreen, isWarningActive, requestFullscreen } = useAntiCheat(
    3,
    handleTermination,
    strikesStorageKey
  );

  useEffect(() => {
    const fetchExam = async () => {
      const { data: examData } = await supabase.from('exams').select('*').eq('id', id).single();
      const { data: qData } = await supabase.from('questions').select('*').eq('exam_id', id);

      if (!examData || !qData) {
        alert('Exam not found or unaccessible.');
        navigate('/');
        return;
      }

      const { data: existingSub } = await supabase
        .from('submissions')
        .select('id')
        .eq('exam_id', id)
        .eq('student_id', user.id)
        .single();

      if (existingSub) {
        alert('You have already submitted this exam.');
        navigate('/');
        return;
      }

      const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

      const randomizedQuestions = shuffle(qData).map((q) => {
        const indexedOptions = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
        return {
          ...q,
          shuffledOptions: shuffle(indexedOptions),
        };
      });

      setExam(examData);
      setQuestions(randomizedQuestions);
      setTimeLeft(examData.duration_minutes * 60);

      const saved = localStorage.getItem(`exam_${id}_${user.id}`);
      if (saved) {
        setAnswers(JSON.parse(saved));
      }

      setLoading(false);
    };

    if (user) fetchExam();
  }, [id, user, navigate]);

  // Timer countdown hook
  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTest(false, strikes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, strikes]);

  const handleSelectOption = (optionOriginalIndex, type) => {
    const nextAnswers = { ...answers };

    if (type === 'single' || type === 'boolean') {
      nextAnswers[currentIndex] = optionOriginalIndex;
    } else if (type === 'multiple') {
      const currentList = nextAnswers[currentIndex] || [];
      if (currentList.includes(optionOriginalIndex)) {
        nextAnswers[currentIndex] = currentList.filter((i) => i !== optionOriginalIndex);
      } else {
        nextAnswers[currentIndex] = [...currentList, optionOriginalIndex];
      }
    }

    setAnswers(nextAnswers);
    localStorage.setItem(`exam_${id}_${user.id}`, JSON.stringify(nextAnswers));
  };

  const submitTest = async (isTerminated = false, finalStrikes = strikes) => {
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      const userAns = answers[idx];
      const correct = q.correct_answers;

      if (q.type === 'single' || q.type === 'boolean') {
        if (userAns !== undefined && correct.includes(userAns)) calculatedScore += 1;
      } else if (q.type === 'multiple') {
        if (
          Array.isArray(userAns) &&
          userAns.length === correct.length &&
          userAns.every((val) => correct.includes(val))
        ) {
          calculatedScore += 1;
        }
      }
    });

    await supabase.from('submissions').insert({
      exam_id: id,
      student_id: user.id,
      student_name: profile?.full_name || 'Student',
      student_email: user.email,
      answers: answers,
      score: calculatedScore,
      violations_count: finalStrikes,
      is_terminated: isTerminated,
    });

    // Clean up local session artifacts
    localStorage.removeItem(`exam_${id}_${user.id}`);
    localStorage.removeItem(strikesStorageKey);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate(`/result/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center font-medium text-zinc-600">
        Initializing Secure Assessment Environment...
      </div>
    );
  }

  // Fullscreen Enforcer Gate
  if (!isFullscreen && strikes === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
        <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center shadow-2xl space-y-6">
          <div className="w-14 h-14 bg-teal-950 border border-teal-800 text-teal-400 rounded-xl flex items-center justify-center mx-auto">
            <Maximize2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">{exam.title}</h1>
            <p className="text-zinc-400 text-xs leading-relaxed">
              This assessment enforces strict proctoring. Exiting fullscreen, switching tabs, or using browser history buttons will trigger strike violations. Reaching 3 strikes results in automated termination.
            </p>
          </div>
          <button
            onClick={requestFullscreen}
            className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-semibold rounded-xl transition shadow-md shadow-teal-950 cursor-pointer"
          >
            Enter Fullscreen & Begin
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isFinalTwoMinutes = timeLeft <= 120;

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col select-none relative">
      {/* Violation Modal */}
      {isWarningActive && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-amber-950 border border-amber-800 text-amber-400 rounded-xl flex items-center justify-center mx-auto animate-pulse">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100">Security Breach Detected</h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Window focus lost, tab switched, or back button triggered. Violation <strong className="text-amber-400">{strikes} of 3</strong> has been logged.
            </p>
            <button
              onClick={requestFullscreen}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 font-semibold rounded-xl text-white transition shadow-sm cursor-pointer"
            >
              Resume Examination
            </button>
          </div>
        </div>
      )}

      {/* Proctoring HUD Bar */}
      <header className="bg-white border-b border-zinc-200 px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-zinc-900 text-sm tracking-tight">{exam.title}</h2>
            <span className="text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded">
              Strikes: <span className={strikes > 0 ? "text-red-600 font-bold" : "text-zinc-800"}>{strikes} / 3</span>
            </span>
          </div>

          {/* Dynamic Urgency Timer */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono text-sm font-bold transition-colors ${
              isFinalTwoMinutes
                ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-md">
                Question {currentIndex + 1} of {questions.length} • {currentQ.type}
              </span>
            </div>

            <p className="text-zinc-900 font-semibold text-lg leading-relaxed">
              {currentQ.question_text}
            </p>

            <div className="space-y-3 pt-2">
              {currentQ.shuffledOptions.map((opt, oIdx) => {
                const isSelected =
                  currentQ.type === 'multiple'
                    ? (answers[currentIndex] || []).includes(opt.originalIndex)
                    : answers[currentIndex] === opt.originalIndex;

                return (
                  <label
                    key={oIdx}
                    onClick={() => handleSelectOption(opt.originalIndex, currentQ.type)}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-700 bg-teal-50/60 text-zinc-950 shadow-xs'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50/80 text-zinc-700'
                    }`}
                  >
                    <input
                      type={currentQ.type === 'multiple' ? 'checkbox' : 'radio'}
                      name={`q_${currentIndex}`}
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 accent-teal-700 focus:ring-0"
                    />
                    <span className="flex-1">{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((p) => p - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-300 font-semibold text-zinc-700 bg-white hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition text-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((p) => p + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 font-semibold text-white transition text-xs shadow-xs cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => submitTest(false, strikes)}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-bold text-white transition text-xs shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Submit Assessment
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <QuestionPalette
            total={questions.length}
            current={currentIndex}
            answers={answers}
            onSelect={(idx) => setCurrentIndex(idx)}
          />
        </div>
      </main>
    </div>
  );
}