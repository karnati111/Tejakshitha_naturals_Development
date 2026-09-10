import React, { useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  X,
  ChevronRight,
} from 'lucide-react';
import { TEST_CASES } from './VerificationWalkthroughPage';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ isOpen, onClose }) => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);

  if (!isOpen) return null;

  const testCases = TEST_CASES;

  const currentCase = testCases[activeCaseIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Verification &amp; Test Walkthrough Specifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Executable step-by-step test cases for automated QA or manual verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Sidebar list + Detail panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Navigation: Test cases */}
          <div className="w-full md:w-72 bg-slate-50/80 dark:bg-slate-950/60 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-2 space-y-1">
            {testCases.map((tc, idx) => {
              const Icon = tc.icon;
              const isActive = activeCaseIndex === idx;
              return (
                <button
                  key={tc.id}
                  onClick={() => setActiveCaseIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                    <div className="truncate">
                      <div className="text-[10px] opacity-80">{tc.id} • {tc.category}</div>
                      <div className="truncate">{tc.title}</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>

          {/* Right Detail Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-slate-900 text-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold font-mono">
                  {currentCase.id}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  {currentCase.category}
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {currentCase.title}
              </h4>
            </div>

            {/* Preconditions */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Pre-condition:
              </span>
              <p className="text-slate-600 dark:text-slate-400">{currentCase.precondition}</p>
            </div>

            {/* Test Steps */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Verification Steps:
              </span>
              <ol className="space-y-2 list-decimal list-inside text-slate-700 dark:text-slate-300">
                {currentCase.steps.map((step, sIdx) => (
                  <li key={sIdx} className="leading-relaxed pl-1">
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Expected Result */}
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center space-x-1.5 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Expected Functional Outcome:</span>
              </div>
              <p className="leading-relaxed text-xs">{currentCase.expectedResult}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-500">
          <span>{TEST_CASES.length} of {TEST_CASES.length} automated/manual test cases documented (TC-01 to TC-13)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded-lg transition font-medium"
          >
            Close Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};
