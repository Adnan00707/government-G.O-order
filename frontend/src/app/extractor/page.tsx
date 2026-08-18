"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, FileText, CheckCircle2, Copy, Check, RefreshCw, AlertTriangle, 
  Cpu, Languages, Download, Eye, FileUp, Sparkles, ChevronRight
} from "lucide-react";
import { extractMetadataStream } from "@/lib/api";

type ExtractionResult = {
  department_name?: string;
  go_number?: string;
  date?: string;
  go_reference?: string; // fallback or Malayalam alternative keys
};

export default function Extractor() {
  const [lang, setLang] = useState<"en" | "ml">("en");
  const [textInput, setTextInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  
  // Loading & SSE states
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState("");
  
  // UI states
  const [copied, setCopied] = useState(false);
  const [viewRaw, setViewRaw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stepper milestones
  const steps = [
    "Initializing Model...",
    "Loading Tokenizer...",
    "Running Inference...",
    lang === "en" ? "Extracting GO Number..." : "Extracting GO Reference..."
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.name.endsWith(".md") || file.type === "text/markdown" || file.type === "text/plain") {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        setTextInput(fileContent);
      };
      reader.readAsText(file);
    } else {
      setError("Only markdown (.md) or text files are supported.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError("");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setTextInput("");
    setFileName("");
    setResult(null);
    setError("");
    setLoading(false);
    setCurrentStep("");
    setCompletedSteps([]);
  };

  const handleCopy = () => {
    const textToCopy = lang === "en" 
      ? result?.go_number || "" 
      : result?.go_number || result?.go_reference || "";
      
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `go_extraction_${lang}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExtract = () => {
    if (!textInput.trim()) {
      setError("Please paste some text content or upload a markdown file.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");
    setCurrentStep("Connecting to API...");
    setCompletedSteps([]);

    extractMetadataStream(
      lang,
      textInput,
      (progressStatus) => {
        setCurrentStep(progressStatus);
        // Add step to completed list if it is one of our standard steps
        const stepIndex = steps.indexOf(progressStatus);
        if (stepIndex > 0) {
          setCompletedSteps(steps.slice(0, stepIndex));
        }
      },
      (predictionResult) => {
        setResult(predictionResult);
        setLoading(false);
        setCurrentStep("");
        setCompletedSteps(steps); // Complete all steps
      },
      (errorMessage) => {
        setError(errorMessage);
        setLoading(false);
        setCurrentStep("");
      }
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full flex flex-col justify-start">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-6 dark:border-slate-800/50">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">NER Metadata Extraction Panel</h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Submit Government Orders (G.O.s) to extract verified references via neural sequence labelling.
          </p>
        </div>
        
        {/* Language Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 self-start md:self-center">
          <button
            onClick={() => { setLang("en"); handleReset(); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              lang === "en"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            English Extractor
          </button>
          <button
            onClick={() => { setLang("ml"); handleReset(); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              lang === "ml"
                ? "bg-white text-amber-500 shadow-sm dark:bg-slate-800 dark:text-amber-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            Malayalam Extractor
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Panel (Col span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {/* Header info */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileText className={`h-4 w-4 ${lang === "en" ? "text-indigo-500" : "text-amber-500"}`} />
                {lang === "en" ? "English Order Source" : "Malayalam Order Source (മലയാളം)"}
              </span>
              {fileName && (
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/30">
                  {fileName}
                </span>
              )}
            </div>

            {/* Dropzone & Text Area */}
            <div className="p-6 space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={textInput ? undefined : triggerFileSelect}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-6 px-4 text-center transition-all ${
                  textInput ? "border-transparent py-0 pointer-events-none" : "cursor-pointer"
                } ${
                  dragActive 
                    ? "border-indigo-500 bg-indigo-50/30 dark:border-indigo-500 dark:bg-indigo-950/10" 
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-705"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                {!textInput ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 mb-3 border border-slate-100 dark:border-slate-700">
                      <FileUp className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Drag and drop your markdown (.md) file here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      or click to browse local files (Markdown or Plain Text)
                    </p>
                  </>
                ) : null}
              </div>

              {/* Text Input Area */}
              {textInput && (
                <div className="relative">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste order header content here..."
                    className="w-full min-h-[300px] max-h-[500px] p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:focus:ring-indigo-900/30"
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5 pointer-events-auto">
                    <button
                      onClick={handleReset}
                      className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors shadow-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Error messages */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200/50 bg-red-50/30 p-4 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-950/10 dark:text-red-400">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                  <div>
                    <span className="font-bold">Execution Error:</span> {error}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors ${
                    !textInput ? "opacity-0 pointer-events-none" : ""
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload different file
                </button>

                <button
                  onClick={handleExtract}
                  disabled={loading || !textInput.trim()}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all active:scale-[0.98] ${
                    loading || !textInput.trim()
                      ? "bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-650 cursor-not-allowed shadow-none"
                      : lang === "en"
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10 hover:scale-[1.01]"
                      : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10 hover:scale-[1.01]"
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Cpu className="h-3.5 w-3.5" />
                      Extract Metadata
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results / Status Panel (Col span 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Stepper Progress Loader */}
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                <Cpu className={`h-5 w-5 animate-spin ${lang === "en" ? "text-indigo-500" : "text-amber-500"}`} />
                <h3 className="text-sm font-bold text-slate-950 dark:text-white">Active NER Pipeline</h3>
              </div>
              
              {/* Steps display */}
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isCompleted = completedSteps.includes(step);
                  const isActive = currentStep === step;
                  
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold border transition-colors ${
                          isCompleted
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : isActive
                            ? lang === "en" 
                              ? "border-indigo-600 text-indigo-600 animate-pulse"
                              : "border-amber-500 text-amber-500 animate-pulse"
                            : "border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-650"
                        }`}>
                          {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : idx + 1}
                        </div>
                        <span className={`text-xs font-semibold ${
                          isActive 
                            ? "text-slate-800 dark:text-slate-100" 
                            : isCompleted 
                            ? "text-slate-500 dark:text-slate-400" 
                            : "text-slate-400 dark:text-slate-600"
                        }`}>
                          {step}
                        </span>
                      </div>
                      
                      {isActive && (
                        <div className="flex gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Progress</span>
                  <span>{Math.round((completedSteps.length / steps.length) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      lang === "en" ? "bg-indigo-600" : "bg-amber-500"
                    }`}
                    style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-300 hover:shadow-md animate-fade-in">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  Extraction Output
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="flex h-7 px-2.5 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                    title="Copy value"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy GO
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                    title="Download JSON"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {lang === "en" ? (
                  <>
                    {/* English G.O. Number Card */}
                    <div className="p-4 rounded-xl border border-indigo-100/50 bg-indigo-50/20 dark:border-indigo-900/30 dark:bg-indigo-950/15 space-y-1">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        GO Number
                      </span>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        {result.go_number || "Not Found"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Malayalam G.O. Reference Card */}
                    <div className="p-4 rounded-xl border border-amber-100/50 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-950/15 space-y-1">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-amber-500">
                        GO Reference (മലയാളം സ.ഉ. നമ്പർ)
                      </span>
                      <p className="text-lg font-black text-slate-900 dark:text-white leading-normal">
                        {result.go_number || result.go_reference || "Not Found"}
                      </p>
                    </div>
                  </>
                )}

                {/* Raw JSON viewer toggle */}
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    onClick={() => setViewRaw(!viewRaw)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {viewRaw ? "Hide Raw Response" : "View Raw JSON"}
                  </button>
                  
                  {viewRaw && (
                    <pre className="mt-3 overflow-x-auto p-3 rounded-lg border border-slate-100 bg-slate-50 text-[10px] font-mono text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 max-h-[150px]">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State Prompt */}
          {!loading && !result && (
            <div className="rounded-2xl border border-slate-200 border-dashed bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/30 h-full flex flex-col items-center justify-center py-16">
              <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Waiting for Inference</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                Paste an official Government Order or upload its markdown draft to invoke XLM-RoBERTa classification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
