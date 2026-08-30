import React from 'react';

export default function QuestionPalette({ total, current, answers, onSelect }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-semibold text-slate-800 text-sm mb-3">Question Palette</h3>
      <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
        {Array.from({ length: total }).map((_, idx) => {
          const isAnswered = answers[idx] !== undefined && (Array.isArray(answers[idx]) ? answers[idx].length > 0 : true);
          const isCurrent = current === idx;
          
          let btnColor = "bg-slate-100 text-slate-700 hover:bg-slate-200";
          if (isAnswered) btnColor = "bg-emerald-600 text-white font-semibold";
          if (isCurrent) btnColor = "ring-2 ring-indigo-600 font-bold bg-indigo-50 text-indigo-700";

          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`h-9 rounded-lg text-xs transition-all ${btnColor}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-xs space-y-1.5 text-slate-500 border-t pt-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span> Answered
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-slate-100 border inline-block"></span> Unanswered
        </div>
      </div>
    </div>
  );
}