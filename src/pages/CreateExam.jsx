import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, Save, CheckCircle2 } from 'lucide-react';

export default function CreateExam() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState([
    {
      question_text: '',
      type: 'single',
      options: ['', '', '', ''],
      correct_answers: [0],
    },
  ]);

  const addManualQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: '', type: 'single', options: ['', '', '', ''], correct_answers: [0] },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOptionText = (qIndex, oIndex, text) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = text;
    setQuestions(updated);
  };

  const toggleCorrectAnswer = (qIndex, oIndex) => {
    const updated = [...questions];
    const q = updated[qIndex];

    if (q.type === 'single' || q.type === 'boolean') {
      q.correct_answers = [oIndex];
    } else {
      if (q.correct_answers.includes(oIndex)) {
        q.correct_answers = q.correct_answers.filter((i) => i !== oIndex);
      } else {
        q.correct_answers = [...q.correct_answers, oIndex];
      }
    }
    setQuestions(updated);
  };

  // Robust JSON Upload Parser (Handles "question", "question_text", "answer", and "correct_answers")
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((item) => {
            const question_text = item.question_text || item.question || '';
            const options = Array.isArray(item.options) ? item.options : ['', '', '', ''];
            const type = item.type || 'single';

            let correct_answers = [0];
            if (Array.isArray(item.correct_answers)) {
              correct_answers = item.correct_answers;
            } else if (typeof item.answer === 'string') {
              const matchedIdx = options.findIndex(
                (opt) => opt.trim().toLowerCase() === item.answer.trim().toLowerCase()
              );
              correct_answers = matchedIdx !== -1 ? [matchedIdx] : [0];
            } else if (typeof item.answer === 'number') {
              correct_answers = [item.answer];
            }

            return {
              question_text,
              type,
              options,
              correct_answers,
            };
          });

          setQuestions(normalized);
          alert(`Successfully imported ${normalized.length} questions!`);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveExam = async () => {
    if (!title.trim()) return alert('Please enter an exam title.');
    if (questions.length === 0) return alert('Please add at least one question.');

    // 1. Insert Exam Details
    const { data: examData, error: examErr } = await supabase
      .from('exams')
      .insert({
        title,
        duration_minutes: duration,
        created_by: user.id,
      })
      .select()
      .single();

    if (examErr) return alert(examErr.message);

    // 2. Insert Associated Questions
    const payload = questions.map((q) => ({
      exam_id: examData.id,
      question_text: q.question_text,
      type: q.type,
      options: q.options,
      correct_answers: q.correct_answers,
    }));

    const { error: qErr } = await supabase.from('questions').insert(payload);
    if (qErr) return alert(qErr.message);

    alert('Exam created and saved successfully!');
    navigate('/admin');
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Create New Assessment</h1>

      <div className="bg-white p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Exam Title</label>
          <input
            type="text"
            className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="e.g. IBM Technologies MCQ Exam"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Duration (Minutes)</label>
          <input
            type="number"
            min="1"
            className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Bulk JSON Upload Box */}
      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-semibold text-indigo-900 text-sm">Bulk Upload via JSON</h4>
          <p className="text-xs text-indigo-700">Upload your JSON file to instantly generate questions and answer keys.</p>
        </div>
        <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg cursor-pointer font-medium shadow-sm transition">
          <Upload className="w-4 h-4" />
          Choose File
          <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Rendered Questions */}
      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-slate-700">Question {qIdx + 1}</span>
              <button
                type="button"
                onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))}
                className="text-red-500 hover:text-red-700 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Question statement"
              className="w-full border border-slate-300 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={q.question_text}
              onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
            />

            <div className="text-xs text-slate-500">
              Click the radio/check icon on an option to mark it as the correct answer:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {q.options.map((opt, oIdx) => {
                const isCorrect = q.correct_answers.includes(oIdx);
                return (
                  <div
                    key={oIdx}
                    className={`flex items-center gap-2 p-2 border rounded-lg transition ${
                      isCorrect ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCorrectAnswer(qIdx, oIdx)}
                      className={`p-1 rounded-full ${isCorrect ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      placeholder={`Option ${oIdx + 1}`}
                      className="w-full bg-transparent text-sm focus:outline-none text-slate-800"
                      value={opt}
                      onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={addManualQuestion}
          className="flex-1 flex items-center justify-center gap-2 border border-slate-300 py-3 rounded-xl bg-white font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Question
        </button>
        <button
          type="button"
          onClick={handleSaveExam}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 py-3 rounded-xl font-semibold text-white hover:bg-indigo-700 shadow-md transition"
        >
          <Save className="w-4 h-4" /> Save Exam
        </button>
      </div>
    </div>
  );
}