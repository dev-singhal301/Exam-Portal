import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, Save } from 'lucide-react';

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (Array.isArray(parsed)) {
          setQuestions(parsed);
          alert(`Successfully imported ${parsed.length} questions.`);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveExam = async () => {
    if (!title) return alert('Enter exam title.');

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

    alert('Exam created successfully!');
    navigate('/admin');
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Create New Assessment</h1>

      <div className="bg-white p-6 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Title</label>
          <input
            type="text"
            className="w-full border p-2.5 rounded-lg text-sm"
            placeholder="e.g. Science Midterm Exam"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Duration (Minutes)</label>
          <input
            type="number"
            className="w-full border p-2.5 rounded-lg text-sm"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-indigo-900 text-sm">Bulk Upload via JSON</h4>
          <p className="text-xs text-indigo-700">Upload a JSON array with questions, options, and correct answers.</p>
        </div>
        <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg cursor-pointer font-medium">
          <Upload className="w-4 h-4" />
          Choose File
          <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white p-6 rounded-xl border border-slate-200 space-y-3 relative">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-slate-700">Question {qIdx + 1}</span>
              <button
                onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Question statement"
              className="w-full border p-2.5 rounded-lg text-sm"
              value={q.question_text}
              onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, oIdx) => (
                <input
                  key={oIdx}
                  type="text"
                  placeholder={`Option ${oIdx + 1}`}
                  className="border p-2 rounded-lg text-sm"
                  value={opt}
                  onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={addManualQuestion}
          className="flex-1 flex items-center justify-center gap-2 border border-slate-300 py-3 rounded-xl bg-white font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Plus className="w-4 h-4" /> Add Question
        </button>
        <button
          onClick={handleSaveExam}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 py-3 rounded-xl font-semibold text-white hover:bg-indigo-700 shadow-md"
        >
          <Save className="w-4 h-4" /> Save Exam
        </button>
      </div>
    </div>
  );
}