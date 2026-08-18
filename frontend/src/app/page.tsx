import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, FileText, CheckCircle2, ShieldCheck, Cpu } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex-grow flex flex-col justify-between transition-colors duration-300">
      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[40%] -left-[10%] h-[800px] w-[800px] rounded-full bg-gradient-to-tr from-indigo-500/10 to-amber-500/10 blur-3xl dark:from-indigo-950/20 dark:to-amber-950/10" />
        <div className="absolute top-[60%] right-[0%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-emerald-500/5 to-indigo-500/5 blur-3xl dark:from-emerald-950/10 dark:to-indigo-950/10" />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/50 bg-indigo-50/50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/40 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Bilingual Government Order AI Assistant
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Understand Administrative G.O.s via{" "}
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-amber-400">
                LangGraph AI Agent
              </span>
            </h1>
            
            <p className="max-w-xl text-lg text-slate-600 leading-relaxed dark:text-slate-300">
              Upload G.O. markdown files in English or Malayalam and chat with our intelligent assistant. Ask questions, extract G.O. numbers, dates, departments, and generate structured summaries on-the-fly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/assistant"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-700 hover:to-indigo-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Launch AI Assistant
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/extractor"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Direct NER Extractor
              </Link>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-[450px] rounded-3xl border border-slate-200/50 bg-white/70 p-6 shadow-2xl backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/70">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Live Visualiser</span>
              </div>
              
              {/* Mockup Animation representation */}
              <div className="mt-4 space-y-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
                  <span className="text-indigo-600 dark:text-indigo-400"># Input Document:</span>
                  <p className="mt-1 line-clamp-3">... Order issued under GO (Ms) No 353/2016/Fin Dated 01-09-2016 from Finance (Pension-A) Department ...</p>
                </div>
                
                <div className="flex flex-col gap-2 rounded-lg border border-indigo-100/50 bg-indigo-50/20 p-3 dark:border-indigo-900/30 dark:bg-indigo-950/20">
                  <span className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
                    XLM-RoBERTa NER Pipeline
                  </span>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
                    <div className="h-full w-2/3 bg-indigo-600 rounded-full animate-infinite-loading" />
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50 space-y-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400">✓ Extracted Entities:</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="border border-slate-100 p-1.5 rounded bg-white dark:border-slate-850 dark:bg-slate-900">
                      <span className="block text-[8px] text-slate-400 uppercase">GO Number</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">353/2016/Fin</span>
                    </div>
                    <div className="border border-slate-100 p-1.5 rounded bg-white dark:border-slate-850 dark:bg-slate-900">
                      <span className="block text-[8px] text-slate-400 uppercase">Dept</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Finance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="border-t border-slate-200/50 bg-white py-16 dark:border-slate-800/50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Understanding Government Orders (G.O.s)
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Government Orders serve as the primary official records of executive decisions, budgetary approvals, policy changes, and legal directives issued by government departments.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="rounded-2xl border border-slate-200/40 p-6 space-y-3 bg-slate-50/50 dark:border-slate-800/40 dark:bg-slate-900/50">
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">The Challenge of Manual Parsing</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Orders are structured loosely and published in markdown or PDF formats, containing highly verbose headers. Manually extracting the exact department details, order dates, and serial G.O. numbers is time-consuming and error-prone during public archive building.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/40 p-6 space-y-3 bg-slate-50/50 dark:border-slate-800/40 dark:bg-slate-900/50">
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">AI-Powered Token Classification</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Our fine-tuned XLM-RoBERTa models analyze each character and word token in the document header. Instead of simple regular expression hacks, deep semantic models recognize variations in order prefixes, dates, and official seals regardless of format differences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Experience modular, real-time metadata extraction in 4 steps.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Input Content", desc: "Paste document text or drop a markdown (.md) file." },
              { step: "02", title: "Stream Connection", desc: "Frontend initiates SSE connection to stream extraction milestones." },
              { step: "03", title: "RoBERTa Inference", desc: "XLM-RoBERTa classifies token entities at high speed on CPU." },
              { step: "04", title: "Structured Result", desc: "Receive clean GO Reference tags, ready to copy or export." }
            ].map((item, idx) => (
              <div key={idx} className="relative rounded-2xl border border-slate-200/40 bg-white p-6 dark:border-slate-800/40 dark:bg-slate-900 hover:shadow-lg transition-all duration-300">
                <span className="text-3xl font-black text-slate-200 dark:text-slate-800">{item.step}</span>
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bilingual / Formats Section */}
      <section className="py-16 border-t border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Supported Languages & Formats</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              The system supports bilingual extraction matching two distinct Government Order structures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* English Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/20">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                English Government Orders
              </h3>
              <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                Standard format representing departmental portfolios, dates, and order numbers.
              </p>
              <div className="mt-4 rounded-lg bg-white p-4 font-mono text-xs dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                <span className="text-slate-400"># Expected Output Format:</span>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between border-b border-slate-50 pb-1 dark:border-slate-900">
                    <span className="text-slate-500">GO Number:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">353/2016/Fin</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-1 dark:border-slate-900">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Finance Department</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">01-09-2016</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Malayalam Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/20">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-amber-500" />
                Malayalam Government Orders
              </h3>
              <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                Traditional vernacular structure reflecting state executive and financial orders.
              </p>
              <div className="mt-4 rounded-lg bg-white p-4 font-mono text-xs dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                <span className="text-slate-400"># Expected Output Format:</span>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between border-b border-slate-50 pb-1 dark:border-slate-900">
                    <span className="text-slate-500">GO Reference:</span>
                    <span className="font-bold text-amber-500">സ.ഉ.(സാധാ) നം.9801/2025/FIN</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Language:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Malayalam (മലയാളം)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
