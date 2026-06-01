"use client";

import React, { useState } from "react";
import { 
  BookOpen, 
  Settings, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Lock, 
  RotateCcw,
  Sparkles,
  HelpCircle
} from "lucide-react";

interface ChapterWorkbenchProps {
  currentChapter: string;
  stage: string; // 'select' | 'drafting' | 'reviewing' | 'librarian' | 'saved'
  draft: string;
  critique: string;
  citations: string;
  variables: {
    title: string;
    methodology: string;
    pipeline: string;
  };
  isGenerating: boolean;
  activeAgent: string;
  
  onChapterChange: (ch: string) => void;
  onVariablesChange: (vars: any) => void;
  onDraftChange: (text: string) => void;
  
  onRunScribe: () => void;
  onRunReview: () => void;
  onRunLibrarian: () => void;
  onLockChapter: () => void;
  onResetWorkflow: () => void;

  apiKey: string;
  setApiKey: (key: string) => void;
  obsidianPath: string;
  setObsidianPath: (path: string) => void;
  notebookWebhook: string;
  setNotebookWebhook: (url: string) => void;
}

export default function ChapterWorkbench({
  currentChapter,
  stage,
  draft,
  critique,
  citations,
  variables,
  isGenerating,
  activeAgent,
  onChapterChange,
  onVariablesChange,
  onDraftChange,
  onRunScribe,
  onRunReview,
  onRunLibrarian,
  onLockChapter,
  onResetWorkflow,
  apiKey,
  setApiKey,
  obsidianPath,
  setObsidianPath,
  notebookWebhook,
  setNotebookWebhook
}: ChapterWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<"workspace" | "config" | "draft" | "review">("workspace");

  const handleVariableChange = (field: string, val: string) => {
    onVariablesChange({
      ...variables,
      [field]: val
    });
  };

  const getStageStep = () => {
    switch (stage) {
      case "select": return 1;
      case "drafting": return 2;
      case "reviewing": return 3;
      case "librarian": return 4;
      case "saved": return 5;
      default: return 1;
    }
  };

  const isReviewFail = critique && critique.includes("[FAIL]");
  const isReviewPass = critique && critique.includes("[PASS]");

  return (
    <div className="flex flex-col gap-6">
      
      {/* 8-bit State Machine Process Bar */}
      <div className="retro-border-single p-4 bg-[#12131a]">
        <div className="flex justify-between items-center mb-2">
          <span className="font-press-start text-[10px] text-retro-primary uppercase">
            Workflow Progress State:
          </span>
          <span className="font-mono text-xs text-slate-400">
            Current Stage: {stage.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-press-start font-bold">
          
          <div className={`p-2 border-2 ${
            getStageStep() >= 1 ? "border-retro-primary text-retro-primary bg-retro-panel-light" : "border-slate-800 text-slate-600"
          }`}>
            1. SELECT
          </div>
          
          <div className={`p-2 border-2 ${
            getStageStep() >= 2 ? "border-sky-400 text-sky-400 bg-retro-panel-light animate-pulse" : "border-slate-800 text-slate-600"
          } ${stage === "drafting" ? "animate-pulse" : ""}`}>
            2. DRAFT
          </div>
          
          <div className={`p-2 border-2 ${
            getStageStep() >= 3 ? "border-red-400 text-red-400 bg-retro-panel-light" : "border-slate-800 text-slate-600"
          } ${isReviewFail ? "border-dashed border-red-600 bg-red-950/20 text-red-500 animate-pulse" : ""}`}>
            3. REVIEW
          </div>
          
          <div className={`p-2 border-2 ${
            getStageStep() >= 4 ? "border-emerald-400 text-emerald-400 bg-retro-panel-light" : "border-slate-800 text-slate-600"
          }`}>
            4. CITATION
          </div>
          
          <div className={`p-2 border-2 ${
            getStageStep() >= 5 ? "border-retro-success text-retro-success bg-[#152317]" : "border-slate-800 text-slate-600"
          }`}>
            5. LOCK 🔒
          </div>

        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex gap-2 font-press-start text-[10px]">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`px-4 py-2 border-t-4 border-x-4 transition-all ${
            activeTab === "workspace"
              ? "bg-retro-panel border-retro-border text-retro-primary -mb-[4px] z-10"
              : "bg-[#161722] border-transparent text-slate-400 hover:text-white"
          }`}
        >
          [1] WORKBENCH
        </button>
        <button
          onClick={() => setActiveTab("draft")}
          className={`px-4 py-2 border-t-4 border-x-4 transition-all ${
            activeTab === "draft"
              ? "bg-retro-panel border-retro-border text-sky-400 -mb-[4px] z-10"
              : "bg-[#161722] border-transparent text-slate-400 hover:text-white"
          }`}
        >
          [2] MANUSCRIPT DRAFT ({draft ? "READY" : "EMPTY"})
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-4 py-2 border-t-4 border-x-4 transition-all ${
            activeTab === "review"
              ? "bg-retro-panel border-retro-border text-retro-accent -mb-[4px] z-10"
              : "bg-[#161722] border-transparent text-slate-400 hover:text-white"
          }`}
        >
          [3] REVIEW & CITATIONS
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 border-t-4 border-x-4 transition-all ${
            activeTab === "config"
              ? "bg-retro-panel border-retro-border text-slate-200 -mb-[4px] z-10"
              : "bg-[#161722] border-transparent text-slate-400 hover:text-white"
          }`}
        >
          [4] COGNITIVE SETTINGS
        </button>
      </div>

      {/* Workspace Panel Box */}
      <div className="retro-border-double p-6 bg-retro-panel flex-1 min-h-[400px]">
        
        {activeTab === "workspace" && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-retro-border/30 pb-3">
              <h3 className="font-press-start text-xs text-retro-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> CAT ACADEMIC METADATA
              </h3>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">SELECT SECTION:</span>
                <select
                  value={currentChapter}
                  onChange={(e) => onChapterChange(e.target.value)}
                  disabled={stage === "saved" || isGenerating}
                  className="retro-input max-w-xs cursor-pointer py-1 text-sm bg-black"
                >
                  <option value="Chapter 1: Introduction & Literature">Chapter 1: Introduction</option>
                  <option value="Chapter 2: Literature Review">Chapter 2: Literature Review</option>
                  <option value="Chapter 3: Research Methodology">Chapter 3: Methodology</option>
                  <option value="Chapter 4: Results & Discussion">Chapter 4: Results & Discussion</option>
                  <option value="Chapter 5: Conclusion & Future Scope">Chapter 5: Conclusion</option>
                </select>
              </div>
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  RESEARCH TITLE (SCOPUS Q3/Q4 TARGET):
                </label>
                <input
                  type="text"
                  value={variables.title}
                  onChange={(e) => handleVariableChange("title", e.target.value)}
                  placeholder="e.g. A Hybrid Forecasting Inventory Model..."
                  className="retro-input w-full"
                  disabled={isGenerating || stage === "saved"}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  METHODOLOGY CONCEPTS / PIPELINE:
                </label>
                <input
                  type="text"
                  value={variables.methodology}
                  onChange={(e) => handleVariableChange("methodology", e.target.value)}
                  placeholder="e.g. LSTM networks, Kalman noise filters"
                  className="retro-input w-full"
                  disabled={isGenerating || stage === "saved"}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  DATA PIPELINE SEQUENCE / EQUATION VARIABLES:
                </label>
                <textarea
                  rows={3}
                  value={variables.pipeline}
                  onChange={(e) => handleVariableChange("pipeline", e.target.value)}
                  placeholder="e.g., Ingestion -> Kalman filtration -> ARIMA forecasting -> LSTM residuals prediction -> Aggregation."
                  className="retro-input w-full font-mono text-sm"
                  disabled={isGenerating || stage === "saved"}
                />
              </div>

            </div>

            {/* Actions Trigger Panel */}
            <div className="border-t border-retro-border/30 pt-6 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3">
                
                {stage === "select" && (
                  <button
                    onClick={onRunScribe}
                    disabled={isGenerating}
                    className="retro-btn bg-[#2d3748] border-sky-400 text-sky-200"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1" />
                    )}
                    RUN SCRIBE CAT DRAFT
                  </button>
                )}

                {(stage === "drafting" || (stage === "reviewing" && isReviewFail)) && (
                  <>
                    <button
                      onClick={onRunScribe}
                      disabled={isGenerating}
                      className="retro-btn bg-slate-800 border-indigo-400 text-sky-200 mr-2"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      {isReviewFail ? "RE-DRAFT (FIX ISSUES)" : "RE-DRAFT"}
                    </button>

                    {draft && (
                      <button
                        onClick={onRunReview}
                        disabled={isGenerating}
                        className="retro-btn bg-[#3c1d27] border-retro-accent text-retro-accent"
                      >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                        SEND TO GRUMPY REVIEWER
                      </button>
                    )}
                  </>
                )}

                {stage === "reviewing" && isReviewPass && (
                  <button
                    onClick={onRunLibrarian}
                    disabled={isGenerating}
                    className="retro-btn bg-[#182d23] border-emerald-500 text-emerald-400"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    RUN LIBRARIAN CITATION
                  </button>
                )}

                {stage === "librarian" && (
                  <button
                    onClick={onLockChapter}
                    disabled={isGenerating}
                    className="retro-btn bg-[#251d38] border-purple-500 text-purple-400"
                  >
                    🔒 LOCK & SAVE CHAPTER
                  </button>
                )}

                {stage === "saved" && (
                  <div className="flex items-center gap-2 font-press-start text-[10px] text-retro-success bg-[#152317] border border-retro-success p-2 rounded">
                    <CheckCircle className="w-4 h-4" /> CHAPTER INGESTED & ARCHIVED!
                  </div>
                )}

              </div>

              {stage !== "select" && (
                <button
                  onClick={onResetWorkflow}
                  className="retro-btn bg-[#2c1e21] border-red-800 text-red-400 py-1 font-mono text-[10px]"
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> RESET WORKFLOW
                </button>
              )}

            </div>

          </div>
        )}

        {activeTab === "draft" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-retro-border/30 pb-2">
              <h3 className="font-press-start text-xs text-sky-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> ACTIVE SCRIBE MANUSCRIPT
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                [Characters: {draft.length}]
              </span>
            </div>

            {draft ? (
              <div className="flex flex-col gap-4 flex-1">
                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  Below is the generated chapter draft. You are human-in-the-loop; feel free to edit the text directly before submitting to review.
                </p>
                <textarea
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  className="retro-border-terminal p-4 font-mono text-sm leading-relaxed text-emerald-400 bg-black min-h-[350px] w-full outline-none focus:ring-1 focus:ring-retro-terminal"
                  style={{ fontFamily: "'Courier Prime', monospace" }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center border-4 border-dashed border-retro-border/20 rounded">
                <FileText className="w-12 h-12 text-slate-600 mb-2 animate-pulse" />
                <p className="font-press-start text-[10px] text-slate-500 uppercase">
                  No draft compiled yet.
                </p>
                <p className="text-xs text-slate-600 font-mono mt-1">
                  Fill in metadata and press "RUN SCRIBE CAT DRAFT" on the Workbench tab.
                </p>
              </div>
            )}

          </div>
        )}

        {activeTab === "review" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Grumpy Reviewer Critique Card */}
            <div className="flex flex-col gap-3">
              <h4 className="font-press-start text-[10px] text-retro-accent flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> GRUMPY REVIEWER QA
              </h4>

              {critique ? (
                <div className={`p-4 retro-border-single flex-1 min-h-[300px] flex flex-col justify-between ${
                  isReviewFail ? "bg-[#251515] border-red-600 text-red-300" : "bg-[#15251a] border-emerald-600 text-emerald-300"
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {isReviewFail ? (
                        <div className="bg-red-600 text-white font-press-start text-[8px] px-1 py-0.5 rounded">
                          STATUS: REJECTED (FAIL)
                        </div>
                      ) : (
                        <div className="bg-emerald-600 text-white font-press-start text-[8px] px-1 py-0.5 rounded">
                          STATUS: APPROVED (PASS)
                        </div>
                      )}
                    </div>
                    <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {critique}
                    </pre>
                  </div>

                  {isReviewFail && (
                    <div className="mt-4 p-2 bg-black/40 border border-red-700 text-xs font-mono text-red-200">
                      🐾 Scribe Cat advises: Address these critiques by adjusting your variables or tweaking the draft, then click Re-Draft.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center border-4 border-dashed border-retro-border/20 rounded">
                  <HelpCircle className="w-12 h-12 text-slate-600 mb-2" />
                  <p className="font-press-start text-[10px] text-slate-500 uppercase">
                    No critiques compiled yet.
                  </p>
                  <p className="text-xs text-slate-600 font-mono mt-1">
                    Send a compiled draft to the reviewer.
                  </p>
                </div>
              )}
            </div>

            {/* Librarian Citation Card */}
            <div className="flex flex-col gap-3">
              <h4 className="font-press-start text-[10px] text-sky-300 flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> LIBRARIAN CITATIONS Compliance
              </h4>

              {citations ? (
                <div className="parchment p-5 flex-1 min-h-[300px] font-mono text-sm text-[#3b2f2f] leading-relaxed shadow-lg">
                  <div className="border-b border-[#8f7457] pb-2 mb-3 flex justify-between items-center text-[10px]">
                    <span className="font-bold">CITATION SYSTEM CHECK</span>
                    <span>APA / IEEE</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono">
                    {citations}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center border-4 border-dashed border-retro-border/20 rounded bg-black/10">
                  <BookOpen className="w-12 h-12 text-slate-600 mb-2" />
                  <p className="font-press-start text-[10px] text-slate-500 uppercase">
                    No Citation Check run.
                  </p>
                  <p className="text-xs text-slate-600 font-mono mt-1">
                    Approval by Grumpy Reviewer is required first.
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

        {activeTab === "config" && (
          <div className="flex flex-col gap-6">
            <h3 className="font-press-start text-xs text-slate-200 border-b border-retro-border/30 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-retro-primary" /> COGNITIVE ROUTING & KEYS
            </h3>

            <div className="grid grid-cols-1 gap-6 max-w-2xl">
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="font-press-start text-[9px] text-slate-300 flex items-center gap-1">
                    GEMINI API KEY (PRIMARY AI):
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    {apiKey ? "🔑 ACTIVE" : "⚠️ OFFLINE LOCAL DEMO"}
                  </span>
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API Key..."
                  className="retro-input w-full placeholder-slate-700"
                />
                <p className="text-xs text-slate-500 font-mono">
                  If left blank, Meow-nuscript Foundry runs on a comprehensive local mock model generating authentic Scopus drafts.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  OBSIDIAN LOCAL VAULT PATH (WORKING MEMORY):
                </label>
                <input
                  type="text"
                  value={obsidianPath}
                  onChange={(e) => setObsidianPath(e.target.value)}
                  placeholder="e.g. /Users/thanachit/Documents/MyResearchVault"
                  className="retro-input w-full placeholder-slate-700"
                />
                <p className="text-xs text-slate-500 font-mono">
                  Markdown decision logs and micro-facts are written to this folder. If left blank, it defaults to the local <code className="text-retro-primary">obsidian-vault</code> folder inside this repository!
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  NOTEBOOKLM COLD STORAGE WEBHOOK:
                </label>
                <input
                  type="text"
                  value={notebookWebhook}
                  onChange={(e) => setNotebookWebhook(e.target.value)}
                  placeholder="e.g. https://api.notebooklm.google.com/webhook/..."
                  className="retro-input w-full placeholder-slate-700"
                />
                <p className="text-xs text-slate-500 font-mono">
                  Finalized locked chapters trigger a POST webhook. Backed up locally to <code className="text-retro-primary">notebooklm-cold-storage</code> within the workspace directory.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
