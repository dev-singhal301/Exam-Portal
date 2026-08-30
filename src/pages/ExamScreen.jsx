import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import QuestionPalette from '../components/QuestionPalette';
import { AlertTriangle, Clock, Maximize, CheckCircle2 } from 'lucide-react';

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

  const handleTermination = async (strikeCount) => {
    await submitTest(true, strikeCount);
  };

  const { strikes, isFullscreen, isWarningActive, requestFullscreen } = useAntiCheat(3, handleTermination);

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
        const shuffled = shuffle(indexedOptions);
        return {
          ...q,
          shuffledOptions: shuffled,
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

    localStorage.removeItem(`exam_${id}_${user.id}`);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate(`/result/${id}`);
  };

  if (loading) return <div className="p-8 text-center">Preparing secure exam session...</div>;

  if (!isFullscreen && strikes === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center shadow-xl">
          <Maximize className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
          <p className="text-slate-400 text-sm mb-6">
            This is a monitored exam. Fullscreen mode is mandatory. Any attempt to exit or switch tabs will count as a violation (Max 3 strikes).
          </p>
          <button
            onClick={requestFullscreen}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-xl transition shadow-lg"
          >
            Enter Fullscreen & Start
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col select-none relative">
      {isWarningActive && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6">
          <AlertTriangle className="w-16 h-16 text-amber-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold mb-2">Proctoring Warning ({strikes}/3)</h2>
          <p className="text-slate-300 text-center max-w-md mb-6">
            Fullscreen exit or tab-switch detected. Return to fullscreen immediately. 3 violations will terminate your test.
          </p>
          <button
            onClick={requestFullscreen}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-lg shadow-md"
          >
            Resume Test
          </button>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0">
        <div>
          <h2 className="font-bold text-slate-800">{exam.title}</h2>
          <span className="text-xs text-red-600 font-medium">Strikes: {strikes} / 3</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-lg border border-slate-200 font-mono text-slate-800 font-bold">
          <Clock className="w-4 h-4 text-indigo-600" />
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md uppercase">
                Question {currentIndex + 1} of {questions.length} • {currentQ.type}
              </span>
            </div>
            <p className="text-lg font-medium text-slate-900 mb-6">{currentQ.question_text}</p>

            <div className="space-y-3">
              {currentQ.shuffledOptions.map((opt, oIdx) => {
                const isSelected =
                  currentQ.type === 'multiple'
                    ? (answers[currentIndex] || []).includes(opt.originalIndex)
                    : answers[currentIndex] === opt.originalIndex;

                return (
                  <label
                    key={oIdx}
                    onClick={() => handleSelectOption(opt.originalIndex, currentQ.type)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type={currentQ.type === 'multiple' ? 'checkbox' : 'radio'}
                      name={`q_${currentIndex}`}
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-indigo-600 focus:ring-0"
                    />
                    <span>{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((p) => p - 1)}
              className="px-5 py-2.5 rounded-lg border border-slate-300 font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((p) => p + 1)}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 font-medium text-white hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => submitTest(false, strikes)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                Final Submit
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-1">
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