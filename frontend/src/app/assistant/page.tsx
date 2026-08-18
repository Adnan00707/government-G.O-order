"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, Cpu, Languages, RefreshCw,
  Send, Sparkles, Calendar, Building, BookOpen, MessageSquare, Copy, Check,
  Info, Loader2, ArrowLeft, Terminal, ClipboardCheck
} from "lucide-react";
import { uploadFile, sendChatMessageStream, UploadResponse } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  intent?: string;
  language?: string;
  isStreaming?: boolean;
}

export default function AssistantPage() {
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [docDetails, setDocDetails] = useState<UploadResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat and processing state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // General state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const stepsList = [
    "Loading Document...",
    "Detecting Language...",
    "Initializing Agent...",
    "Selecting Tool...",
    "Generating Response..."
  ];

  // Map incoming progress logs to step index
  useEffect(() => {
    if (!currentStep) {
      setCurrentStepIndex(-1);
      return;
    }
    const idx = stepsList.findIndex(s => s.toLowerCase() === currentStep.toLowerCase());
    if (idx !== -1) {
      setCurrentStepIndex(idx);
    }
  }, [currentStep]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStep, isProcessing]);

  // File Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".md") && !selectedFile.name.endsWith(".txt")) {
      setUploadError("Only markdown (.md) or text (.txt) files are supported.");
      return;
    }

    setUploadLoading(true);
    setUploadError("");
    try {
      const response = await uploadFile(selectedFile);
      setFile(selectedFile);
      setDocDetails(response);
      
      // Seed default welcome message from AI
      setMessages([
        {
          id: "welcome",
          sender: "ai",
          text: `Successfully uploaded **${selectedFile.name}** (${response.language} document). I have initialized my LangGraph routing network. You can now query details or use the quick actions below!`,
          intent: "WELCOME"
        }
      ]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload and process the document.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setFile(null);
    setDocDetails(null);
    setMessages([]);
    setInputQuery("");
    setIsProcessing(false);
    setCurrentStep("");
    setProgressLog([]);
    setUploadError("");
  };

  // Submit Query
  const handleQuerySubmit = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isProcessing || !docDetails) return;

    // Clear input
    setInputQuery("");

    // Add user message
    const userMsgId = Date.now().toString();
    const newMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: trimmed
    };
    setMessages(prev => [...prev, newMsg]);

    // Start loading
    setIsProcessing(true);
    setCurrentStep("Loading Document...");
    setProgressLog(["Loading Document..."]);

    try {
      await sendChatMessageStream(
        trimmed,
        (progress) => {
          setCurrentStep(progress);
          setProgressLog(prev => {
            if (prev[prev.length - 1] !== progress) {
              return [...prev, progress];
            }
            return prev;
          });
        },
        (result) => {
          setIsProcessing(false);
          setCurrentStep("");
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: "ai",
              text: result.response,
              intent: result.intent,
              language: result.language
            }
          ]);
        },
        (error) => {
          setIsProcessing(false);
          setCurrentStep("");
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: "ai",
              text: `Error resolving query: ${error}`,
              intent: "ERROR"
            }
          ]);
        }
      );
    } catch (err: any) {
      setIsProcessing(false);
      setCurrentStep("");
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `An unexpected system error occurred: ${err.message}`,
          intent: "ERROR"
        }
      ]);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Quick Action Prompts
  const quickActions = [
    { label: "Extract G.O. Number", prompt: "What is the GO number of this order?" },
    { label: "Find Issue Date", prompt: "When was this Government Order issued?" },
    { label: "Find Issuing Department", prompt: "Which department issued this Government Order?" },
    { label: "Summarize Order", prompt: "Can you provide a summary of this Government Order?" }
  ];

  // Helper to render customized result cards depending on intent
  const renderMessageContent = (msg: Message) => {
    if (msg.sender === "user") {
      return (
        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md max-w-full break-words">
          <p className="text-sm">{msg.text}</p>
        </div>
      );
    }

    // Special message renders
    if (msg.intent === "GO_NUMBER") {
      return (
        <div className="border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-2xl p-4 shadow-sm space-y-3 w-full">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Cpu className="h-4 w-4" />
              <span>G.O. Number / Reference Extraction</span>
            </div>
            <button
              onClick={() => copyToClipboard(msg.text, msg.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Copy G.O. Reference"
            >
              {copiedText === msg.id ? (
                <ClipboardCheck className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="py-2">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Extracted Value</p>
            <p className="text-lg font-mono font-bold text-slate-800 dark:text-slate-100 select-all leading-tight break-all mt-1">
              {msg.text}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-2">
            <Info className="h-3 w-3 text-indigo-500 shrink-0" />
            <span>Successfully extracted using the fine-tuned RoBERTa NER pipeline.</span>
          </div>
        </div>
      );
    }

    if (msg.intent === "DATE") {
      return (
        <div className="border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10 rounded-2xl p-4 shadow-sm space-y-3 w-full">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Calendar className="h-4 w-4" />
              <span>Official G.O. Issue Date</span>
            </div>
            <button
              onClick={() => copyToClipboard(msg.text, msg.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {copiedText === msg.id ? (
                <ClipboardCheck className="h-4 w-4 text-amber-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Extracted Date</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {msg.text}
            </p>
          </div>
        </div>
      );
    }

    if (msg.intent === "DEPARTMENT") {
      return (
        <div className="border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/10 rounded-2xl p-4 shadow-sm space-y-3 w-full">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Building className="h-4 w-4" />
              <span>Issuing Administration / Department</span>
            </div>
            <button
              onClick={() => copyToClipboard(msg.text, msg.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {copiedText === msg.id ? (
                <ClipboardCheck className="h-4 w-4 text-indigo-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Government Entity</p>
            <p className="text-md font-semibold text-slate-800 dark:text-slate-100 mt-1">
              {msg.text}
            </p>
          </div>
        </div>
      );
    }

    if (msg.intent === "SUMMARY") {
      return (
        <div className="border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/10 rounded-2xl p-4 shadow-sm space-y-3 w-full">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="h-4 w-4" />
              <span>G.O. Executive Summary</span>
            </div>
            <button
              onClick={() => copyToClipboard(msg.text, msg.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {copiedText === msg.id ? (
                <ClipboardCheck className="h-4 w-4 text-purple-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-line prose dark:prose-invert max-w-none">
            {msg.text}
          </div>
        </div>
      );
    }

    if (msg.intent === "ERROR") {
      return (
        <div className="border border-red-500/30 bg-red-500/5 dark:bg-red-950/10 rounded-2xl p-4 shadow-sm flex gap-3 items-start w-full">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-red-700 dark:text-red-400 text-xs uppercase tracking-wider block">System Exception</span>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{msg.text}</p>
          </div>
        </div>
      );
    }

    // Default chat bubble with simple markdown formatting (bolding etc.)
    return (
      <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-150 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-200/50 dark:border-slate-800/50 max-w-full whitespace-pre-line leading-relaxed text-sm">
        {msg.text}
      </div>
    );
  };

  return (
    <div className="flex-grow flex flex-col h-[calc(100vh-4.1rem)] min-h-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 min-h-0 overflow-hidden">
        
        {/* PANEL 1: LEFT - File Upload & Stats */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-h-0 overflow-y-auto pr-1">
          
          {/* Main Upload Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Upload className="h-4.5 w-4.5 text-indigo-500" />
              Document Upload
            </h2>

            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 min-h-[160px] ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20"
                    : "border-slate-300 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-950/20"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".md,.txt"
                />
                
                {uploadLoading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Analyzing contents...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-inner">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Drag & Drop G.O. file</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Accepts .md and .txt formats</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-indigo-100 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/15 rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(2)} KB • Markdown Document
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-xs font-semibold dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset Upload
                </button>
              </div>
            )}

            {uploadError && (
              <div className="flex gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="text-xs leading-normal font-medium">{uploadError}</span>
              </div>
            )}
          </div>

          {/* Document Stats / Metadata Card */}
          {docDetails && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Info className="h-4.5 w-4.5 text-indigo-500" />
                Document Metadata
              </h2>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/70 pb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Detected Language</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-900/60">
                    <Languages className="h-3 w-3" />
                    {docDetails.language}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/70 pb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Character Count</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {docDetails.char_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Status</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Initialized
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Guides / Features */}
          <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 space-y-3">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Agent Configuration</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Our LangGraph pipeline routes questions dynamically. Asking about G.O. numbers triggers our locally hosted, fine-tuned XLM-RoBERTa models automatically, safeguarding precision.
            </p>
          </div>

        </div>

        {/* PANEL 2: CENTER - Document Content Viewer */}
        <div className="lg:col-span-5 flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm min-h-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Document Source Viewer</span>
            </div>
            {docDetails && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-900">
                {docDetails.filename}
              </span>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto min-h-0 select-text">
            {docDetails ? (
              <div className="prose dark:prose-invert max-w-none text-xs font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-900">
                {docDetails.preview.endsWith("...") ? (
                  <>
                    {docDetails.preview.slice(0, -3)}
                    <span className="text-indigo-500/70 font-semibold block mt-4 p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/30 rounded text-center">
                      ... File preview truncated. Full document uploaded in backend ...
                    </span>
                  </>
                ) : (
                  docDetails.preview
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-900/60 shadow-sm text-slate-400">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Document Uploaded</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1 leading-relaxed">
                    Please upload a Malayalam or English Government Order file in the left panel to display the source text.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: RIGHT - Intelligent Chat Pane */}
        <div className="lg:col-span-4 flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm min-h-0">
          
          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-indigo-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Interactive AI Panel</span>
            </div>
            {isProcessing && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing
              </span>
            )}
          </div>

          {/* Messages Flow */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 min-h-0">
            {!docDetails ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">AI Chat Inactive</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[240px] leading-relaxed">
                  Upload a G.O. file to activate the AI agent conversation routing.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[85%] flex flex-col gap-1.5">
                      <span className={`text-[9px] uppercase tracking-wider font-extrabold text-slate-400 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                        {msg.sender === "user" ? "You" : "G.O. Assistant"}
                      </span>
                      {renderMessageContent(msg)}
                    </div>
                  </div>
                ))}
                
                {/* Visual Agent Stepper Loader while Streaming */}
                {isProcessing && (
                  <div className="border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-100/30 pb-2">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 animate-pulse" />
                        LangGraph Agent Pipeline
                      </span>
                      <span className="text-[9px] font-mono text-indigo-500/80 bg-white dark:bg-slate-900 border border-indigo-100/30 px-1.5 py-0.5 rounded">
                        Active Step
                      </span>
                    </div>

                    {/* Simple stepper display */}
                    <div className="space-y-3">
                      {stepsList.map((step, idx) => {
                        const isDone = idx < currentStepIndex;
                        const isActive = idx === currentStepIndex;
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center">
                              {isDone ? (
                                <div className="h-4 w-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                                  ✓
                                </div>
                              ) : isActive ? (
                                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                              ) : (
                                <div className="h-4 w-4 border border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-400">
                                  {idx + 1}
                                </div>
                              )}
                            </div>
                            <span className={`text-xs ${
                              isActive 
                                ? "font-bold text-slate-900 dark:text-white" 
                                : isDone 
                                ? "text-slate-500 dark:text-slate-450 line-through" 
                                : "text-slate-400 dark:text-slate-500"
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Quick Actions Panel */}
          {docDetails && !isProcessing && (
            <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 block mb-1.5">
                Quick Actions
              </span>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuerySubmit(action.prompt)}
                    className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 py-1 px-2.5 rounded-lg border border-slate-200/50 dark:border-slate-850 transition-colors cursor-pointer"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQuerySubmit(inputQuery);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                disabled={!docDetails || isProcessing}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  !docDetails
                    ? "Upload a document to enable chat..."
                    : "Ask about G.O. details (e.g. date, number)..."
                }
                className="flex-grow text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 py-2.5 px-3.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 transition-colors"
              />
              <button
                type="submit"
                disabled={!docDetails || isProcessing || !inputQuery.trim()}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
