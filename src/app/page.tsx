"use client";

import React, { useState, useEffect } from "react";
import OfficeCanvas from "../components/OfficeCanvas";
import ChapterWorkbench from "../components/ChapterWorkbench";
import MemoryExplorer from "../components/MemoryExplorer";
import { Terminal, Shield, Sparkles, AlertCircle } from "lucide-react";

export default function Home() {
  // Config States (Persistent in localStorage)
  const [apiKey, setApiKey] = useState("");
  const [obsidianPath, setObsidianPath] = useState("");
  const [notebookWebhook, setNotebookWebhook] = useState("");
  const [notebookMode, setNotebookMode] = useState("webhook"); // 'webhook' | 'mcp'
  const [notebookId, setNotebookId] = useState("");
  
  // Chapter State Machine States
  const [currentChapter, setCurrentChapter] = useState("Chapter 3: Research Methodology");
  const [stage, setStage] = useState<"select" | "drafting" | "reviewing" | "librarian" | "saved">("select");
  
  const [variables, setVariables] = useState({
    title: "A Hybrid Inventory Forecasting Architecture",
    methodology: "Fused LSTM network with a stationary ARIMA forecasting model",
    pipeline: "Data collection -> Kalman noise reduction -> ARIMA linear modeling -> Residual extraction -> LSTM neural training -> Dynamic aggregation."
  });

  const [draft, setDraft] = useState("");
  const [critique, setCritique] = useState("");
  const [citations, setCitations] = useState("");
  
  // UI Display States
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAgent, setActiveAgent] = useState<"none" | "manager" | "scribe" | "reviewer" | "librarian">("manager");
  const [dialogueText, setDialogueText] = useState("Welcome to Meow-nuscript Foundry! 🐾 Select a chapter in the Workbench tab, fill in your methodology concepts, and let Scribe Cat compile a draft.");
  
  // Refresh Trigger to update MemoryExplorer lists
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load localStorage settings on client load
  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiKey(localStorage.getItem("meow_gemini_key") || "");
      setObsidianPath(localStorage.getItem("meow_obsidian_path") || "");
      setNotebookWebhook(localStorage.getItem("meow_notebook_webhook") || "");
      setNotebookMode(localStorage.getItem("meow_notebook_mode") || "webhook");
      setNotebookId(localStorage.getItem("meow_notebook_id") || "");
    }
  }, []);

  // Save changes to localStorage
  const handleSetApiKey = (val: string) => {
    setApiKey(val);
    localStorage.setItem("meow_gemini_key", val);
  };

  const handleSetObsidianPath = (val: string) => {
    setObsidianPath(val);
    localStorage.setItem("meow_obsidian_path", val);
  };

  const handleSetNotebookWebhook = (val: string) => {
    setNotebookWebhook(val);
    localStorage.setItem("meow_notebook_webhook", val);
  };

  const handleSetNotebookMode = (val: string) => {
    setNotebookMode(val);
    localStorage.setItem("meow_notebook_mode", val);
  };

  const handleSetNotebookId = (val: string) => {
    setNotebookId(val);
    localStorage.setItem("meow_notebook_id", val);
  };

  // State Machine Trigger 1: Scribe Cat Drafts
  const handleRunScribe = async () => {
    setIsGenerating(true);
    setActiveAgent("scribe");
    setStage("drafting");
    setDialogueText("Mew! The Scribe Cat is hard at work compiling your academic chapter draft. Accessing Obsidian vault decision logs for local context...");

    try {
      // 1. First, fetch any Obsidian logs to inject context
      let obsidianLogs = "";
      try {
        const obsRes = await fetch("/api/obsidian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "read", filename: "Decision_Logs.md", vaultPath: obsidianPath })
        });
        const obsData = await obsRes.json();
        if (obsData.success) {
          obsidianLogs = obsData.content;
        }
      } catch (err) {
        console.warn("Could not load Obsidian files for context, proceeding without it.");
      }

      // 2. Call Gemini multi-agent endpoint
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "scribe",
          variables,
          critique, // Pass previous critiques if refining
          obsidianLogs,
          apiKey
        })
      });

      const data = await res.json();
      if (data.error) {
        setDialogueText(`Oh noes! The Scribe Cat tripped on a wire: ${data.error}`);
      } else {
        setDraft(data.text);
        setActiveAgent("manager");
        setDialogueText("The Scribe Cat has finished the draft! The academic outline looks robust. Let's send it to Grumpy Reviewer on the review tab!");
      }
    } catch (error: any) {
      setDialogueText(`Error running Scribe Cat: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // State Machine Trigger 2: Grumpy Reviewer critiques
  const handleRunReview = async () => {
    setIsGenerating(true);
    setActiveAgent("reviewer");
    setStage("reviewing");
    setDialogueText("Hiss... Grumpy Reviewer is checking the draft. Scanning for loose parameters, unexplained formulas, and overclaiming of results...");

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "reviewer",
          draft,
          variables,
          apiKey
        })
      });

      const data = await res.json();
      if (data.error) {
        setDialogueText(`Grumpy Reviewer sneezed: ${data.error}`);
      } else {
        setCritique(data.text);
        const isFail = data.text.includes("[FAIL]");
        if (isFail) {
          setActiveAgent("reviewer");
          setDialogueText("Claws out! 😾 Grumpy Reviewer rejected the draft! Check the critique and adjust parameters before attempting a re-draft.");
        } else {
          setActiveAgent("manager");
          setDialogueText("Purr-fect! 🐾 Grumpy Reviewer APPROVED the chapter for Scopus Q3/Q4 publication. Proceed to Citation Verification!");
        }
      }
    } catch (error: any) {
      setDialogueText(`Error running Reviewer: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // State Machine Trigger 3: Librarian citations compliant check
  const handleRunLibrarian = async () => {
    setIsGenerating(true);
    setActiveAgent("librarian");
    setStage("librarian");
    setDialogueText("Librarian Cat is validating references. Sorting citation indexes to ensure consistent Scopus formatting standards...");

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "librarian",
          draft,
          apiKey
        })
      });

      const data = await res.json();
      if (data.error) {
        setDialogueText(`Librarian Cat lost a book page: ${data.error}`);
      } else {
        setCitations(data.text);
        setActiveAgent("manager");
        setDialogueText("Librarian checks complete! APA/IEEE references verified. The chapter is officially ready to lock and archive into cold storage!");
      }
    } catch (error: any) {
      setDialogueText(`Error running Librarian Cat: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // State Machine Trigger 4: Lock & save finalized chapter
  const handleLockChapter = async () => {
    setIsGenerating(true);
    setActiveAgent("manager");
    setDialogueText("🔒 Saving chapter to local working memory vault and uploading finalized PDF index to NotebookLM cold storage...");

    try {
      // 1. Write the Decision Log to Obsidian Working Memory
      const obsidianBody = {
        action: "write",
        filename: "Decision_Logs.md",
        content: `FINALIZED STAGE: Locked ${currentChapter}
- Research Title: ${variables.title}
- Methodology parameters used: ${variables.methodology}
- Resulting pipeline configurations: ${variables.pipeline}
- Status: Transferred to cold storage.`,
        vaultPath: obsidianPath
      };

      await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obsidianBody)
      });

      // 2. Upload finalized draft to NotebookLM cold storage (MCP vs Webhook/Archive)
      let notebookRes;
      if (notebookMode === "mcp") {
        setDialogueText("🤖 Triggering direct MCP tool 'add_source' to sync chapter content straight into Google NotebookLM...");
        notebookRes = await fetch("/api/notebooklm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_source",
            chapter: currentChapter,
            title: variables.title,
            content: draft,
            notebookId: notebookId
          })
        });
      } else {
        notebookRes = await fetch("/api/notebooklm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "archive",
            chapter: currentChapter,
            title: variables.title,
            content: draft,
            webhookUrl: notebookWebhook
          })
        });
      }

      const notebookData = await notebookRes.json();

      if (notebookData.success) {
        setStage("saved");
        if (notebookMode === "mcp") {
          setDialogueText(`🔒 Direct MCP Ingestion complete! '${currentChapter}' has been uploaded straight into your Google NotebookLM via PleasePrompto server!`);
        } else {
          setDialogueText(`🐾 Locked & Loaded! ${currentChapter} has been fully saved. Proceed to select the next chapter and build out your manuscript!`);
        }
        // Increment trigger to refresh MemoryExplorer lists immediately
        setRefreshTrigger(prev => prev + 1);
      } else {
        setDialogueText(`Chapter locked locally, but NotebookLM sync failed: ${notebookData.error || "connection error"}`);
      }

    } catch (error: any) {
      setDialogueText(`Error locking chapter: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset Chapter State Machine back to Select state
  const handleResetWorkflow = () => {
    setStage("select");
    setDraft("");
    setCritique("");
    setCitations("");
    setActiveAgent("manager");
    setDialogueText("Workflow reset. Select a chapter and adjust your methodology parameters to begin a new drafting iteration.");
  };

  return (
    <div className="flex-1 w-full bg-[#0e0f15] py-4 px-2 md:py-6 md:px-6 lg:px-8 font-vt323 antialiased">
      
      {/* Centralized Desktop Area */}
      <main className="w-full max-w-[98vw] mx-auto flex flex-col gap-6">
        
        {/* Game Title Bar */}
        <header className="retro-border-single p-4 bg-[#12131a] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-retro-primary p-2 border-2 border-black rounded shadow-[2px_2px_0px_#000] animate-bounce">
              <Terminal className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="font-press-start text-xs md:text-sm text-retro-primary font-bold uppercase tracking-wider">
                Meow-nuscript Foundry
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                90s RPG Multi-Agent Academic Publishing Assistant (Scopus Q3/Q4 Focus)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-900 border border-emerald-500 text-emerald-400 px-2 py-0.5 text-[10px] font-press-start font-bold uppercase">
              Gemini-SDK Online
            </span>
            <span className="bg-retro-panel-light border border-retro-border text-slate-300 px-2 py-0.5 text-[10px] font-press-start font-bold">
              v1.0.0-RPG
            </span>
          </div>
        </header>

        {/* Informative Alert Tip */}
        <div className="bg-retro-panel-light border-l-4 border-retro-primary p-3 text-xs text-slate-300 font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-retro-primary flex-shrink-0" />
          <span>
            <strong>Pro Tip:</strong> Enter a Gemini API key in the <strong>Cognitive Settings [4]</strong> tab to utilize the live agent models. Without a key, the app runs on high-fidelity localized mock responses for instant offline demonstration.
          </span>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Workspace Column (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* RPG Cat Office Screen Visualizer */}
            <OfficeCanvas
              currentStage={stage}
              dialogueText={dialogueText}
              activeAgent={activeAgent}
            />

            {/* Chapter Interactive Workbench */}
            <ChapterWorkbench
              currentChapter={currentChapter}
              stage={stage}
              draft={draft}
              critique={critique}
              citations={citations}
              variables={variables}
              isGenerating={isGenerating}
              activeAgent={activeAgent}
              onChapterChange={setCurrentChapter}
              onVariablesChange={setVariables}
              onDraftChange={setDraft}
              onRunScribe={handleRunScribe}
              onRunReview={handleRunReview}
              onRunLibrarian={handleRunLibrarian}
              onLockChapter={handleLockChapter}
              onResetWorkflow={handleResetWorkflow}
              apiKey={apiKey}
              setApiKey={handleSetApiKey}
              obsidianPath={obsidianPath}
              setObsidianPath={handleSetObsidianPath}
              notebookWebhook={notebookWebhook}
              setNotebookWebhook={handleSetNotebookWebhook}
              notebookMode={notebookMode}
              setNotebookMode={handleSetNotebookMode}
              notebookId={notebookId}
              setNotebookId={handleSetNotebookId}
            />

          </div>

          {/* Sidebar Memory Explorer Column (Right 1/3) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Database directory list */}
            <MemoryExplorer
              obsidianPath={obsidianPath}
              notebookWebhook={notebookWebhook}
              refreshTrigger={refreshTrigger}
            />

            {/* Visual Specs RPG Stats Card */}
            <div className="retro-border-single p-4 bg-[#12131a] flex flex-col gap-3">
              <h4 className="font-press-start text-[9px] text-retro-primary uppercase border-b border-retro-border/20 pb-1 font-bold">
                Office Character Specs
              </h4>
              <div className="flex flex-col gap-2 font-mono text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>😺 Siamese Cat (แมววิเชียรมาศ)</span>
                  <span className="text-retro-primary">Core Liaison</span>
                </div>
                <div className="flex justify-between">
                  <span>👓 Meow-nager (Agent 1)</span>
                  <span className="text-yellow-300">Level 8 Coordinator</span>
                </div>
                <div className="flex justify-between">
                  <span>✍️ Scribe Cat (Agent 2)</span>
                  <span className="text-indigo-400">Level 9 Academic Scribe</span>
                </div>
                <div className="flex justify-between">
                  <span>🎓 Grumpy Reviewer (Agent 3)</span>
                  <span className="text-retro-accent">Level 99 Strict Peer</span>
                </div>
                <div className="flex justify-between">
                  <span>📚 Librarian Cat (Agent 4)</span>
                  <span className="text-emerald-400">Level 7 Citation Inspector</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
      
      {/* 8-bit Footer */}
      <footer className="w-full text-center py-8 mt-12 border-t border-retro-border/20 font-mono text-xs text-slate-500">
        <p>© 2026 Meow-nuscript Foundry. Made with pixel art passion and agentic precision.</p>
        <p className="mt-1">Powered by the Gemini API & Model Context Protocol routing systems.</p>
      </footer>

    </div>
  );
}
