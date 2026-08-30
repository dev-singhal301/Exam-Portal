import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, Save, CheckCircle2, FileSpreadsheet, Layers } from 'lucide-react';

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

            return { question_text, type, options, correct_answers };
          });

          setQuestions(normalized);
          alert(`Successfully imported ${normalized.length} questions.`);
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

    const payload = questions.map((q) => ({
      exam_id: examData.id,
      question_text: q.question_text,
      type: q.type,
      options: q.options,
      correct_answers: q.correct_answers,
    }));

    const { error: qErr } = await supabase.from('questions').insert(payload);
    if (qErr) return alert(qErr.message);

    alert('Exam created successfully.');
    navigate('/admin');
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      {/* Title & Setup Header */}
      <div className="border-b border-zinc-200/80 pb-4">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Create Examination Set</h1>
        <p className="text-xs text-zinc-500">Provide parameters, define items manually, or bulk import via JSON.</p>
      </div>

      {/* Meta Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-xs">
        <div>
          <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">Assessment Title</label>
          <input
            type="text"
            className="w-full border border-zinc-200 bg-zinc-50/50 p-2.5 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none transition"
            placeholder="e.g. Distributed Systems Final"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">Duration (Minutes)</label>
          <input
            type="number"
            min="1"
            className="w-full border border-zinc-200 bg-zinc-50/50 p-2.5 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none transition"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Bulk Upload Banner */}
      <div className="bg-teal-50/60 border border-teal-200/80 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-800 text-teal-300 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 text-xs">Bulk Item Ingestion (JSON)</h4>
            <p className="text-[11px] text-zinc-600">Import structured JSON arrays with questions, choices, and answer keys.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white text-xs px-4 py-2.5 rounded-xl cursor-pointer font-semibold shadow-xs transition">
          <Upload className="w-4 h-4" />
          Import File
          <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Questions Stack */}
      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white p-6 rounded-2xl border border-zinc-200/80 space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-md">
                Item {qIdx + 1}
              </span>
              <button
                type="button"
                onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))}
                className="text-zinc-400 hover:text-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Question statement..."
              className="w-full border border-zinc-200 bg-zinc-50/50 p-2.5 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none transition"
              value={q.question_text}
              onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {q.options.map((opt, oIdx) => {
                const isCorrect = q.correct_answers.includes(oIdx);
                return (
                  <div
                    key={oIdx}
                    className={`flex items-center gap-2.5 p-2.5 border rounded-xl transition ${
                      isCorrect
                        ? 'border-teal-700 bg-teal-50/60 text-zinc-950'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCorrectAnswer(qIdx, oIdx)}
                      className={`p-0.5 rounded-md cursor-pointer ${
                        isCorrect ? 'text-teal-700 font-bold' : 'text-zinc-300 hover:text-zinc-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      placeholder={`Option ${oIdx + 1}`}
                      className="w-full bg-transparent text-xs font-medium focus:outline-none text-zinc-900"
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

      {/* Action Footer */}
      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={addManualQuestion}
          className="flex-1 flex items-center justify-center gap-2 border border-zinc-300 py-3 rounded-xl bg-white font-semibold text-zinc-700 hover:bg-zinc-50 text-xs shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Append Question
        </button>
        <button
          type="button"
          onClick={handleSaveExam}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-800 py-3 rounded-xl font-bold text-white hover:bg-teal-900 text-xs shadow-xs transition cursor-pointer"
        >
          <Save className="w-4 h-4" /> Commit Assessment
        </button>
      </div>
    </div>
  );
}