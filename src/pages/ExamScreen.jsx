import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import QuestionPalette from '../components/QuestionPalette';
import { AlertOctagon, Clock, Maximize2, ArrowRight, ArrowLeft, Send, AlertTriangle, X } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Synchronous guard ref to prevent multiple alerts on unmount/re-render
  const hasHandledExit = useRef(false);

  const strikesStorageKey = `strikes_${id}_${user?.id || 'guest'}`;

  const handleTermination = async (strikeCount) => {
    await submitTest(true, strikeCount);
  };

  const { strikes, isFullscreen, isWarningActive, requestFullscreen } = useAntiCheat(
    3,
    handleTermination,
    strikesStorageKey
  );

  // Initial Load and Status Verification
  useEffect(() => {
    let isMounted = true;

    const fetchExam = async () => {
      if (hasHandledExit.current) return;

      const { data: examData } = await supabase.from('exams').select('*').eq('id', id).single();
      const { data: qData } = await supabase.from('questions').select('*').eq('exam_id', id);

      if (!isMounted) return;

      if (!examData || !qData) {
        if (!hasHandledExit.current) {
          hasHandledExit.current = true;
          alert('Exam not found or inaccessible.');
          navigate('/', { replace: true });
        }
        return;
      }

      // Check if the exam has been concluded by admin
      if (examData.is_ended) {
        if (!hasHandledExit.current) {
          hasHandledExit.current = true;
          alert('This assessment has concluded and is no longer accepting submissions.');
          navigate('/', { replace: true });
        }
        return;
      }

      const { data: existingSub } = await supabase
        .from('submissions')
        .select('id')
        .eq('exam_id', id)
        .eq('student_id', user.id)
        .single();

      if (!isMounted) return;

      if (existingSub) {
        if (!hasHandledExit.current) {
          hasHandledExit.current = true;
          alert('You have already submitted this exam.');
          navigate('/', { replace: true });
        }
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

    if (user) {
      fetchExam();
    }

    return () => {
      isMounted = false;
    };
  }, [id, user, navigate]);

  // Real-time listener for remote admin termination / disqualification
  useEffect(() => {
    if (!id || !user) return;

    const channel = supabase
      .channel(`submission_watch_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && payload.new.is_terminated && payload.new.exam_id === id) {
            if (!hasHandledExit.current) {
              hasHandledExit.current = true;
              alert('Your examination has been remotely disqualified by the administrator.');
              localStorage.removeItem(`exam_${id}_${user.id}`);
              localStorage.removeItem(strikesStorageKey);
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              navigate(`/result/${id}`, { replace: true });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, navigate, strikesStorageKey]);

  // Exam Countdown Timer
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
    if (isSubmitting) return;
    setIsSubmitting(true);

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

    localStorage.removeItem(`exam_${id}_${user.id}`);
    localStorage.removeItem(strikesStorageKey);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate(`/result/${id}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center font-medium text-zinc-600">
        Initializing Secure Assessment Environment...
      </div>
    );
  }

  // Persistent Fullscreen Enforcer Gate: Displays whenever windowed, regardless of previous strikes
  if (!isFullscreen && strikes < 3) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
        <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center shadow-2xl space-y-6">
          <div className="w-14 h-14 bg-teal-950 border border-teal-800 text-teal-400 rounded-xl flex items-center justify-center mx-auto">
            <Maximize2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">{exam.title}</h1>
            <p className="text-zinc-400 text-xs leading-relaxed">
              {strikes > 0
                ? `You currently have ${strikes} of 3 security strikes. Re-enter fullscreen mode to resume your assessment.`
                : 'This assessment enforces strict proctoring. Exiting fullscreen, switching tabs, or navigating away logs security violations. Reaching 3 strikes will automatically disqualify and terminate your session.'}
            </p>
          </div>
          <button
            onClick={requestFullscreen}
            className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-semibold rounded-xl transition shadow-md shadow-teal-950 cursor-pointer"
          >
            {strikes > 0 ? 'Re-enter Fullscreen & Resume' : 'Enter Fullscreen & Begin'}
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isFinalTwoMinutes = timeLeft <= 120;

  const answeredCount = Object.keys(answers).filter((k) => {
    const val = answers[k];
    return Array.isArray(val) ? val.length > 0 : val !== undefined;
  }).length;
  const unattemptedCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col select-none relative">
      {/* 1. Final Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Confirm Final Submission</span>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Are you sure you want to end your assessment? Once submitted, your choices will be permanently finalized and cannot be modified.
            </p>

            <div className="grid grid-cols-2 gap-3 bg-zinc-50 border border-zinc-200/80 p-3.5 rounded-xl text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Attempted</span>
                <span className="text-teal-700 font-bold text-base">{answeredCount} questions</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Unattempted</span>
                <span className="text-amber-700 font-bold text-base">{unattemptedCount} questions</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                Return to Exam
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  submitTest(false, strikes);
                }}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Security Breach Warning Modal */}
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

      {/* Proctoring HUD Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-zinc-900 text-sm tracking-tight">{exam.title}</h2>
            <span className="text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded">
              Strikes: <span className={strikes > 0 ? "text-red-600 font-bold" : "text-zinc-800"}>{strikes} / 3</span>
            </span>
          </div>

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
              <ArrowLeft className="w-4 h-4" /> Previous Question
            </button>

            <button
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((p) => p + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none font-semibold text-white transition text-xs shadow-xs cursor-pointer"
            >
              Next Question <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar: Palette & Isolated Submit Button */}
        <div className="lg:col-span-1 space-y-4">
          <QuestionPalette
            total={questions.length}
            current={currentIndex}
            answers={answers}
            onSelect={(idx) => setCurrentIndex(idx)}
          />

          <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs space-y-3">
            <div className="text-[11px] text-zinc-500 font-medium text-center">
              Done with all questions? Verify your choices above before submitting.
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 font-bold text-white transition text-xs shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Submit Assessment
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}