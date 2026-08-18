import React from "react";
import { ShieldCheck, Cpu, Code } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/40 bg-slate-50 transition-colors duration-300 dark:border-slate-800/40 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: System Purpose */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Official Verification
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
              A state-of-the-art Natural Language Processing (NLP) system designed to automate the parsing, structure identification, and reference extraction of Government Orders (G.O.s) issued by state departments.
            </p>
          </div>

          {/* Column 2: Tech Specs */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-500" />
              Machine Learning Specs
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
              Powered by fine-tuned **XLM-RoBERTa Token Classification** neural networks. Models are trained separately on custom English and Malayalam annotated corpus splits to extract identifiers directly on CPU/GPU.
            </p>
          </div>

          {/* Column 3: Source Code & Standards */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Code className="h-4 w-4 text-amber-500" />
              Standards & Security
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
              Compliant with secure government digitization directives. No uploaded texts are stored permanently. Extraction is performed on-the-fly via zero-state memory buffers.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200/50 pt-6 text-center dark:border-slate-800/50">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} GovOrder NER Digitization Portal. Developed with Next.js & FastAPI.
          </p>
        </div>
      </div>
    </footer>
  );
}
