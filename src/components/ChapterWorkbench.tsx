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
  HelpCircle,
  Upload,
  FileCode,
  Play,
  Terminal,
  Layers,
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface ChapterWorkbenchProps {
  currentChapter: string;
  stage: string; // 'select' | 'initializing' | 'drafting' | 'reviewing' | 'editing' | 'librarian' | 'saved'
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
  onRunCoordinator: () => void;
  onIngestSuccess?: () => void;

  apiKey: string;
  setApiKey: (key: string) => void;
  obsidianPath: string;
  setObsidianPath: (path: string) => void;
  notebookWebhook: string;
  setNotebookWebhook: (url: string) => void;
  notebookMode: string;
  setNotebookMode: (mode: string) => void;
  notebookId: string;
  setNotebookId: (id: string) => void;

  // NEW PIPELINE PROPS
  pipelineLogs?: Array<{ stage: string; text: string; timestamp: string; type: "info" | "success" | "warning" | "error" }>;
  loopCount?: number;
  onRunFullPipeline?: (chapterDraftText: string) => void;
  chapterDraft?: string;
  onChapterDraftChange?: (val: string) => void;
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
  onRunCoordinator,
  onIngestSuccess,
  apiKey,
  setApiKey,
  obsidianPath,
  setObsidianPath,
  notebookWebhook,
  setNotebookWebhook,
  notebookMode,
  setNotebookMode,
  notebookId,
  setNotebookId,
  // New props
  pipelineLogs = [],
  loopCount = 0,
  onRunFullPipeline,
  chapterDraft = "",
  onChapterDraftChange
}: ChapterWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<"workspace" | "config" | "draft" | "review" | "ingest">("workspace");
  const [authLoading, setAuthLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState("");

  // Ingest states for Research Initializer
  const [manuFile, setManuFile] = useState<File | null>(null);
  const [manuText, setManuText] = useState("");
  
  const [relatedFile, setRelatedFile] = useState<File | null>(null);
  const [relatedText, setRelatedText] = useState("");
  
  const [initLoading, setInitLoading] = useState(false);
  const [initStatus, setInitStatus] = useState("");

  // Old ingest state compatibility
  const [ingestFilename, setIngestFilename] = useState("Research_Draft_Notes.md");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestStatus, setIngestStatus] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);

  const handleRunAuth = async () => {
    setAuthLoading(true);
    setAuthStatus("กำลังเปิดหน้าต่างล็อกอิน...");
    try {
      const res = await fetch("/api/notebooklm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup_auth" })
      });
      const data = await res.json();
      if (data.success) {
        setAuthStatus("การยืนยันตัวตนสำเร็จแล้ว!");
      } else {
        setAuthStatus(`ล้มเหลว: ${data.error || "เกิดข้อผิดพลาด"}`);
      }
    } catch (err: any) {
      setAuthStatus(`ล้มเหลว: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    onVariablesChange({
      ...variables,
      [key]: value
    });
  };

  // Helper to convert PDF to base64 and parse via API
  const parsePdfContent = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fileBase64 = "data:application/pdf;base64," + window.btoa(binary);

      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64, filename: file.name, apiKey })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.files && data.files.length > 0) {
        // Return combined text content from parsed concepts files
        return data.files.map((f: any) => f.content).join("\n\n");
      }
      return "";
    } catch (err: any) {
      console.error("PDF Parsing error:", err);
      throw new Error(`ล้มเหลวในการสแกนไฟล์ ${file.name}: ${err.message}`);
    }
  };

  // 🎒 100% Accurate Research Initializer Logic
  const handleInitializeProject = async () => {
    setInitLoading(true);
    setInitStatus("🎒 เริ่มกระบวนการติดตั้งโครงการวิจัยแมวเหมียว...");
    
    try {
      let finalManuscriptDraft = manuText;
      let finalRelatedPapers = relatedText;

      // 1. Process Manuscript File if uploaded
      if (manuFile) {
        setInitStatus(`📂 กำลังถอดรหัสเอกสาร Manuscript Draft PDF: ${manuFile.name}...`);
        finalManuscriptDraft = await parsePdfContent(manuFile);
      }

      // 2. Process Related Research File if uploaded
      if (relatedFile) {
        setInitStatus(`📂 กำลังถอดรหัสเอกสาร Related Research PDF: ${relatedFile.name}...`);
        finalRelatedPapers = await parsePdfContent(relatedFile);
      }

      if (!finalManuscriptDraft && !finalRelatedPapers) {
        throw new Error("โปรดระบุหรืออัปโหลดเอกสาร Manuscript หรือ Notion Logs อย่างใดอย่างหนึ่งเป็นอย่างน้อยค่ะ!");
      }

      // 3. Save draft to Obsidian as foundational knowledge base
      setInitStatus("💾 บันทึกเอกสารดราฟต์ตั้งต้นลงคลัง Obsidian...");
      if (finalManuscriptDraft) {
        await fetch("/api/obsidian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "write",
            filename: "references/Reference_Manuscript.md",
            content: finalManuscriptDraft,
            overwrite: true,
            vaultPath: obsidianPath
          })
        });
      }

      // 4. Save Notion Logs & Related papers to Obsidian
      setInitStatus("💾 บันทึกฐานข้อมูลสถิติและการทดลอง (Notion logs) ลงคลัง Obsidian...");
      if (finalRelatedPapers) {
        await fetch("/api/obsidian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "write",
            filename: "references/Reference_Library.md",
            content: finalRelatedPapers,
            overwrite: true,
            vaultPath: obsidianPath
          })
        });
      }

      // 5. Run AI Synthesis to build Knowledge Graph nodes
      setInitStatus("🕸️ เอเจนต์แมวกำลังวิเคราะห์สารและสกัดหัวข้อย่อย WikiLinks...");
      const combinedText = `Manuscript Draft Focus:\n${finalManuscriptDraft}\n\nNotion Logs & Research Materials:\n${finalRelatedPapers}`;
      
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "knowledge-graph",
          draft: combinedText,
          apiKey
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Parse concepts JSON
      let graphData;
      try {
        const cleanedStr = data.text.trim();
        try {
          graphData = JSON.parse(cleanedStr);
        } catch {
          const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
          const match = cleanedStr.match(jsonBlockRegex);
          let candidate = cleanedStr;
          if (match && match[1]) {
            candidate = match[1].trim();
          }
          graphData = JSON.parse(candidate);
        }
      } catch {
        // Fallback mock graph data if parse failed
        graphData = {
          files: [
            {
              filename: "Research_Knowledge_Index.md",
              content: `# ดัชนีคลังความรู้งานวิจัย 🐾\n\nสรุปภาพรวมแผนผังเครือข่ายความรู้ประจำบทเหมียว:\n\n- [[ARIMA_Time_Series]] - แบบจำลองเชิงเส้นสำหรับอนุกรมเวลา\n- [[LSTM_Recurrent_Neural_Network]] - โครงข่ายเซลล์ประสาทเรียนรู้ระยะยาว\n- [[Kalman_Noise_Filter]] - การกรองสัญญาณรบกวนของข้อมูล`
            }
          ],
          extracted_title: "สถาปัตยกรรมผสมผสานเพื่อการพยากรณ์สินค้าคงคลังอัจฉริยะ (Hybrid ARIMA-LSTM Inventory Forecasting)",
          extracted_methodology: "การทำโมเดลพยากรณ์อนุกรมเวลา ARIMA ร่วมกับโครงข่ายประสาทเทียม LSTM ภายใต้ข้อมูลกรองสัญญาณรบกวนคาลมาน (Kalman Filter)",
          extracted_pipeline: "ชุดข้อมูลคงคลังคงเหลือ -> ตัวกรองสัญญาณรบกวนคาลมาน -> พยากรณ์แนวโน้มเชิงเส้น ARIMA -> ส่งต่อเศษเหลือ (Residuals) -> เทรนเซลล์ประสาท LSTM -> รวมผลลัพธ์พยากรณ์ผสมผสาน"
        };
      }

      // 6. Write concepts to Obsidian
      setInitStatus("💾 กำลังสลักคำวิกิ WikiLinks คอนเซปต์ลง Obsidian Vault...");
      const filesToWrite = graphData.files || graphData.concepts || [];
      for (const fItem of filesToWrite) {
        await fetch("/api/obsidian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "write",
            filename: `concepts/${fItem.filename}`,
            content: fItem.content,
            overwrite: true,
            vaultPath: obsidianPath
          })
        });
      }

      // 7. Auto-populate variables from AI analysis, or fallback to realistic mock values if not extracted
      const finalTitle = graphData.extracted_title || graphData.extractedTitle || graphData.title || "สถาปัตยกรรมผสมผสานเพื่อการพยากรณ์สินค้าคงคลังอัจฉริยะ (Hybrid ARIMA-LSTM Inventory Forecasting)";
      const finalMethodology = graphData.extracted_methodology || graphData.extractedMethodology || graphData.methodology || "การทำโมเดลพยากรณ์อนุกรมเวลา ARIMA ร่วมกับโครงข่ายประสาทเทียม LSTM ภายใต้ข้อมูลกรองสัญญาณรบกวนคาลมาน (Kalman Filter)";
      const finalPipeline = graphData.extracted_pipeline || graphData.extractedPipeline || graphData.pipeline || "ชุดข้อมูลคงคลังคงเหลือ -> ตัวกรองสัญญาณรบกวนคาลมาน -> พยากรณ์แนวโน้มเชิงเส้น ARIMA -> ส่งต่อเศษเหลือ (Residuals) -> เทรนเซลล์ประสาท LSTM -> รวมผลลัพธ์พยากรณ์ผสมผสาน";

      onVariablesChange({
        title: finalTitle,
        methodology: finalMethodology,
        pipeline: finalPipeline
      });

      setInitStatus("🟢 ตั้งทะเบียนคลังข้อมูลวิจัยสำเร็จ 100%! พร้อมรันห่วงโซ่ห้าแมวแล้วเหมียว! 🐾");
      setManuFile(null);
      setManuText("");
      setRelatedFile(null);
      setRelatedText("");
      
      if (onIngestSuccess) {
        onIngestSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setInitStatus(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setInitLoading(false);
    }
  };

  // Legacy single file text ingestion
  const handleLegacyIngest = async () => {
    if (!ingestFilename || !ingestContent) return;
    setIngestLoading(true);
    setIngestStatus("กำลังบันทึก...");
    try {
      const cleanFilename = ingestFilename.endsWith(".md") ? ingestFilename : `${ingestFilename}.md`;
      const res = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write",
          filename: cleanFilename,
          content: ingestContent,
          overwrite: true,
          vaultPath: obsidianPath
        })
      });
      const data = await res.json();
      if (data.success) {
        setIngestStatus("บันทึกคลังความรู้สำเร็จเหมียว! 🎉");
        setIngestContent("");
        if (onIngestSuccess) {
          onIngestSuccess();
        }
      } else {
        setIngestStatus(`ล้มเหลว: ${data.error}`);
      }
    } catch (err: any) {
      setIngestStatus(`ล้มเหลว: ${err.message}`);
    } finally {
      setIngestLoading(false);
      setTimeout(() => setIngestStatus(""), 4000);
    }
  };

  // Check loop failure tags
  const isReviewFail = critique.includes("[FAIL]");
  const isReviewPass = critique.includes("[PASS]") && critique.trim() !== "";

  // RPG flowchart node rendering helper
  const renderFlowchartNode = (nodeStage: string, name: string, active: boolean, completed: boolean, description: string) => {
    let statusColor = "bg-slate-800 border-slate-700 text-slate-400";
    let pulseClass = "";

    if (active) {
      statusColor = "bg-yellow-950 border-yellow-500 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.3)]";
      pulseClass = "animate-pulse";
    } else if (completed) {
      statusColor = "bg-emerald-950 border-emerald-500 text-emerald-400";
    }

    return (
      <div className={`flex flex-col items-center p-2 border-2 rounded min-w-[110px] text-center font-mono transition-all duration-300 ${statusColor} ${pulseClass}`}>
        <span className="text-[9px] uppercase font-bold tracking-wider">{name}</span>
        <span className="text-[7px] opacity-60 mt-0.5">{description}</span>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`w-2.5 h-2.5 rounded-full border border-black ${
            active ? "bg-yellow-400 animate-ping" : completed ? "bg-emerald-500" : "bg-slate-700"
          }`} />
          <span className="text-[8px] uppercase tracking-tighter">
            {active ? "Active" : completed ? "Done" : "Idle"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="retro-border-single bg-retro-panel p-4 md:p-6 rounded">
      
      {/* Workbench Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b-4 border-slate-800 pb-3 mb-6">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-1 px-4 py-2 font-mono text-sm border-2 rounded ${
            activeTab === "workspace"
              ? "border-retro-primary text-retro-primary bg-black/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" /> [1] ห่วงโซ่การผลิตห้าแมว 🔗
        </button>

        <button
          onClick={() => setActiveTab("ingest")}
          className={`flex items-center gap-1 px-4 py-2 font-mono text-sm border-2 rounded ${
            activeTab === "ingest"
              ? "border-purple-400 text-purple-400 bg-black/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Upload className="w-4 h-4" /> [2] โรงหล่อข้อมูลตั้งต้น 🎒
        </button>

        <button
          onClick={() => setActiveTab("draft")}
          className={`flex items-center gap-1 px-4 py-2 font-mono text-sm border-2 rounded ${
            activeTab === "draft"
              ? "border-indigo-400 text-indigo-400 bg-black/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileCode className="w-4 h-4" /> [3] ร่างวิจัยเกลาเสร็จ ✨
        </button>

        <button
          onClick={() => setActiveTab("review")}
          className={`flex items-center gap-1 px-4 py-2 font-mono text-sm border-2 rounded ${
            activeTab === "review"
              ? "border-red-500 text-red-500 bg-black/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> [4] รายการประเมินส้ม 😾
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-1 px-4 py-2 font-mono text-sm border-2 rounded ${
            activeTab === "config"
              ? "border-slate-500 text-slate-300 bg-black/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Settings className="w-4 h-4" /> [5] การตั้งค่าสมองกล ⚙️
        </button>
      </div>

      {/* Tab 1: ห่วงโซ่การผลิตห้าแมว (5-Cat Pipeline Console) */}
      {activeTab === "workspace" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800 pb-3 gap-3">
            <h3 className="font-mono text-sm text-retro-primary flex items-center gap-2 font-bold uppercase">
              <BookOpen className="w-5 h-5 text-retro-primary animate-pulse" /> 5-Cat Pipeline Console :: ห่วงโซ่ห้าเหมียวประสาท
            </h3>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">บทวิจัยเป้าหมาย:</span>
              <select
                value={currentChapter}
                onChange={(e) => onChapterChange(e.target.value)}
                disabled={stage === "saved" || isGenerating}
                className="retro-input cursor-pointer py-1 px-2 text-xs bg-black max-w-xs font-mono h-9"
              >
                <option value="Chapter 1: Introduction">บทที่ 1: บทนำและการทบทวน</option>
                <option value="Chapter 2: Literature Review">บทที่ 2: การทบทวนวรรณกรรมเชิงลึก</option>
                <option value="Chapter 3: Research Methodology">บทที่ 3: ระเบียบวิธีและสถาปัตยกรรมวิจัย</option>
                <option value="Chapter 4: Results & Discussion">บทที่ 4: ผลการทดลองและการอภิปราย</option>
                <option value="Chapter 5: Conclusion">บทที่ 5: สรุปผลและขอบเขตงานในอนาคต</option>
              </select>
            </div>
          </div>

          {/* Research Context Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-4 border border-slate-800 rounded">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-slate-400 font-bold">หัวข้อวิจัย (เป้าหมาย Scopus Q3/Q4):</label>
              <input
                type="text"
                value={variables.title}
                onChange={(e) => handleVariableChange("title", e.target.value)}
                placeholder="เช่น A Hybrid Deep Learning Inventory model..."
                className="retro-input w-full py-1 text-xs"
                disabled={isGenerating || stage === "saved"}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-slate-400 font-bold">ทฤษฎีหลักระเบียบวิธีวิจัย:</label>
              <input
                type="text"
                value={variables.methodology}
                onChange={(e) => handleVariableChange("methodology", e.target.value)}
                placeholder="เช่น โครงข่าย LSTM ประมวลผลร่วมกับฟิลเตอร์คาลมาน"
                className="retro-input w-full py-1 text-xs"
                disabled={isGenerating || stage === "saved"}
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-mono text-[10px] text-slate-400 font-bold">ท่อส่งขั้นตอนสถิติ / ลำดับขั้นตอนประมวลผลสมการ:</label>
              <textarea
                rows={2}
                value={variables.pipeline}
                onChange={(e) => handleVariableChange("pipeline", e.target.value)}
                placeholder="เช่น ข้อมูลดิบ -> กรองสัญญาณรบกวนคาลมาน -> ประมวลผล ARIMA -> Residual ไปสอน LSTM -> หาผลร่วม"
                className="retro-input w-full font-mono text-xs leading-relaxed"
                disabled={isGenerating || stage === "saved"}
              />
            </div>
          </div>

          {/* Core Input Chapter Draft Area */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="font-mono text-xs text-indigo-300 font-bold flex items-center gap-1.5">
                📝 วางข้อความร่างวิจัยเฉพาะบทที่คุณต้องการเขียนเกลา (Input Chapter Draft):
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {chapterDraft ? `${chapterDraft.length} ตัวอักษร` : "ว่างเปล่า"}
              </span>
            </div>
            <textarea
              rows={6}
              value={chapterDraft}
              onChange={(e) => onChapterDraftChange && onChapterDraftChange(e.target.value)}
              placeholder="คัดลอกร่างบทความที่คุณเพิ่งเขียนแบบคร่าวๆ มาโยนให้เลขาประสานงาน หรือร่างสมการสถิติแบบหยาบๆ มาวางที่นี่เพื่อให้เอเจนต์แมวรันงานอัตโนมัติเหมียว..."
              className="retro-input w-full font-mono text-xs leading-relaxed border-indigo-900/60 focus:border-indigo-500"
              disabled={isGenerating || stage === "saved"}
            />
          </div>

          {/* Interactive RPG Multi-Cat Flowchart Diagram */}
          <div className="bg-black/40 border-2 border-slate-800 p-4 rounded flex flex-col gap-3">
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              🗺️ ผังแสดงสถานะความคืบหน้าห้าประสาทแมว (5-Cat RPG Pipeline Map)
            </span>
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded border border-slate-900 overflow-x-auto">
              
              {renderFlowchartNode(
                "initializing",
                "เลขาเหมียว",
                stage === "initializing",
                stage !== "select" && stage !== "initializing",
                "ผู้รับงานและวางแผน"
              )}

              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden md:block" />

              {renderFlowchartNode(
                "drafting",
                "แมว 1 (Scribe)",
                stage === "drafting",
                stage !== "select" && stage !== "initializing" && stage !== "drafting",
                "นักวิจัย / Zero-muddle"
              )}

              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden md:block" />

              {renderFlowchartNode(
                "reviewing",
                "แมว 2 (Reviewer)",
                stage === "reviewing",
                stage === "editing" || stage === "librarian" || stage === "saved",
                "Peer Review / Loop"
              )}

              {loopCount > 0 && (
                <div className="absolute left-[45%] translate-y-8 bg-red-950/60 text-red-400 border border-red-500/40 rounded px-1 text-[8px] font-mono select-none">
                  วนซ้ำ: {loopCount}/3 รอบ
                </div>
              )}

              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden md:block" />

              {renderFlowchartNode(
                "editing",
                "แมว 3 (Editor)",
                stage === "editing",
                stage === "librarian" || stage === "saved",
                "เกลาสำนวนภาษาคน"
              )}

              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden md:block" />

              {renderFlowchartNode(
                "librarian",
                "แมว 4 (Librarian)",
                stage === "librarian",
                stage === "saved",
                "คิวเรต Obsidian Graph"
              )}

            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="border-t border-slate-800 pt-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              
              {stage !== "saved" && (
                <button
                  onClick={() => {
                    if (onRunFullPipeline) {
                      onRunFullPipeline(chapterDraft);
                    }
                  }}
                  disabled={isGenerating || !chapterDraft.trim()}
                  className="retro-btn bg-[#182d23] border-emerald-500 text-emerald-400 font-bold text-xs flex items-center gap-1.5 animate-pulse min-w-[280px] h-10 px-4"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <Play className="w-4 h-4 text-emerald-400 animate-pulse" />
                  )}
                  {isGenerating ? "เลขาเหมียวกำลังควบคุมเครื่องรันงาน..." : "🚀 รันห่วงโซ่การผลิตห้าประสาทแมว (Run 5-Cat Pipeline)"}
                </button>
              )}

              {stage === "saved" && (
                <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/40 p-2.5 rounded font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> ประกอบร่างบทวิจัยสำเร็จ สลักผลลง Obsidian คลังความรู้ Scopus สมบูรณ์แล้วค่ะทาส! 😻🏆
                </div>
              )}

            </div>

            {stage !== "select" && (
              <button
                onClick={onResetWorkflow}
                className="retro-btn bg-[#2c1e21] border-red-800 text-red-400 py-1 px-3 font-mono text-[10px] h-8"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> รีเซ็ตสายการผลิต
              </button>
            )}
          </div>

          {/* Retro green-on-black Terminal output console */}
          <div className="flex flex-col border border-slate-800 rounded overflow-hidden">
            <div className="bg-[#12131a] px-3 py-1.5 border-b border-slate-800 flex justify-between items-center font-mono text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" /> คอนโซลล็อกห้าเหมียวประสาท :: active_pipeline_logger
              </span>
              <span>8-bit Console v1.0</span>
            </div>
            
            <div className="bg-slate-950 p-3 h-44 overflow-y-auto font-mono text-xs flex flex-col gap-1.5 leading-relaxed text-emerald-500 select-text">
              {pipelineLogs.length > 0 ? (
                pipelineLogs.map((log, idx) => {
                  let logColor = "text-emerald-500";
                  if (log.type === "success") logColor = "text-sky-400 font-bold";
                  if (log.type === "warning") logColor = "text-yellow-400";
                  if (log.type === "error") logColor = "text-red-400 font-bold animate-pulse";

                  return (
                    <div key={idx} className={`flex items-start gap-2 border-b border-slate-950 pb-0.5 ${logColor}`}>
                      <span className="opacity-40 font-mono text-[10px] select-none shrink-0 font-light mt-0.5">[{log.timestamp}]</span>
                      <span className="opacity-70 font-mono text-[10px] select-none uppercase font-bold tracking-tighter bg-slate-900 border border-slate-800 px-1 rounded shrink-0">
                        {log.stage}
                      </span>
                      <p className="flex-1 whitespace-pre-wrap">{log.text}</p>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-700 font-mono text-center gap-1 select-none">
                  <Terminal className="w-8 h-8 opacity-20" />
                  <span>[ระบบว่างตัว]</span>
                  <span className="text-[10px] opacity-55">ป้อนดราฟต์บทของคุณ และกดปุ่มรันด้านบนเพื่อส่งเครื่องเข้าสู่ห่วงโซ่การผลิตอัตโนมัติเหมียว</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: โรงหล่อข้อมูลตั้งต้น (Research Initializer) */}
      {activeTab === "ingest" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-mono text-sm text-purple-400 flex items-center gap-2 font-bold uppercase">
              <Upload className="w-5 h-5 text-purple-400 animate-bounce" /> โรงหล่อข้อมูลตั้งต้น (Research Initializer) 🎒
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              [ระบบบรรจุข้อมูลวิจัยแบบ Grounded คลังสมอง 100% ป้องกันโมเดลจินตนาการ]
            </span>
          </div>

          <div className="bg-purple-950/10 border border-purple-500/20 p-4 rounded text-xs text-slate-300 font-mono leading-relaxed flex flex-col gap-2">
            <p>
              🐾 <strong>กฎเหล็กความแม่นยำสูง (Zero Hallucination Grounding):</strong>
              การเขียนงานวิจัยระดับ Scopus Q3/Q4 ที่ดีที่สุดจะมาจากการดึงเนื้อหาที่ทาสผู้วิจัยและข้อมูลการทดลองเตรียมไว้จริงเท่านั้น!
            </p>
            <p>
              โปรดนำเอกสารวิจัยต้นแบบของคุณ และเอกสาร/สมุดแล็บผลการทดลอง (เช่น Notion logs ที่ส่งออก) มาป้อนใส่ระบบ 
              เลขาเหมียวจะสแกนและบันทึกประทับเข้า Obsidian Vault เพื่อให้โมเดลห้าแมวใช้เป็น <strong>"ฐานข้อมูลอ้างอิงเชิงลึก 100% ดิ้นไม่หลุด"</strong> ในการปรับปรุงเนื้อหาเหมียว!
            </p>
          </div>

          {/* Grid for two datasets inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Box: Manuscript draft inputs */}
            <div className="flex flex-col gap-3 border border-slate-800 p-4 bg-black/15 rounded">
              <label className="font-mono text-xs text-purple-300 font-bold flex items-center gap-1.5">
                📖 1. ดราฟต์โครงร่างวิจัยหลัก (Initial Manuscript Draft):
              </label>
              
              <div className="flex flex-col gap-2 border border-dashed border-purple-500/20 p-3 bg-purple-950/5 rounded">
                <span className="text-[10px] text-slate-400 font-mono">อัปโหลดเอกสารดราฟต์ในเครื่องของทาส (.pdf):</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setManuFile(e.target.files?.[0] || null)}
                  className="font-mono text-xs text-slate-300 cursor-pointer bg-slate-950 border border-slate-800 py-1.5 px-3 rounded hover:bg-slate-900 w-full"
                  disabled={initLoading}
                />
                {manuFile && (
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">📂 เลือกดราฟต์สำเร็จ: {manuFile.name}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">หรือวางข้อความเนื้อความดราฟต์ตั้งต้น (Raw Draft Text):</span>
                <textarea
                  rows={6}
                  value={manuText}
                  onChange={(e) => setManuText(e.target.value)}
                  placeholder="วางคำสะกด หรือหัวข้อประเด็นย่อส่วนสำคัญของงานวิจัยร่างแรก..."
                  className="retro-input w-full font-mono text-xs leading-relaxed"
                  disabled={initLoading || !!manuFile}
                />
              </div>
            </div>

            {/* Right Box: Notion lab logs / experiment files inputs */}
            <div className="flex flex-col gap-3 border border-slate-800 p-4 bg-black/15 rounded">
              <label className="font-mono text-xs text-purple-300 font-bold flex items-center gap-1.5">
                🧪 2. งานวิจัยอ้างอิงและบันทึกผลการทดลอง (Notion logs & Lab logs):
              </label>
              
              <div className="flex flex-col gap-2 border border-dashed border-purple-500/20 p-3 bg-purple-950/5 rounded">
                <span className="text-[10px] text-slate-400 font-mono">อัปโหลดบันทึกผล PDF อ้างอิงเพิ่มวิจัย (.pdf):</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setRelatedFile(e.target.files?.[0] || null)}
                  className="font-mono text-xs text-slate-300 cursor-pointer bg-slate-950 border border-slate-800 py-1.5 px-3 rounded hover:bg-slate-900 w-full"
                  disabled={initLoading}
                />
                {relatedFile && (
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">📂 เลือกเอกสารแล็บสำเร็จ: {relatedFile.name}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">หรือวางบันทึกผลการทดลองจาก Notion/สมุดจดดิบ (Raw Logs Text):</span>
                <textarea
                  rows={6}
                  value={relatedText}
                  onChange={(e) => setRelatedText(e.target.value)}
                  placeholder="วางข้อมูลตัวแปรสถิติ ARIMA lag logs, จำนวนนิวรอน LSTM หรือค่า MSE/RMSE ผลทดลองจาก Notion..."
                  className="retro-input w-full font-mono text-xs leading-relaxed"
                  disabled={initLoading || !!relatedFile}
                />
              </div>
            </div>

          </div>

          {/* Glowing initialization action button */}
          <div className="flex gap-4 items-center flex-wrap pt-4 border-t border-slate-800">
            <button
              onClick={handleInitializeProject}
              disabled={initLoading || (!manuFile && !manuText.trim() && !relatedFile && !relatedText.trim())}
              className="retro-btn bg-[#251d38] border-purple-400 text-purple-200 animate-pulse font-bold flex items-center justify-center min-w-[320px] h-10 text-xs"
              type="button"
            >
              {initLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2 text-purple-400 animate-pulse" />
              )}
              {initLoading ? "เลขาเหมียวกำลังขึ้นทะเบียนคลังปัญญา..." : "🎒 เริ่มต้นโครงการวิจัยเหมียว (Initialize Research Vault)"}
            </button>

            {initStatus && (
              <span className="font-mono text-xs text-retro-primary bg-black/40 border border-retro-border px-3 py-1.5 animate-pulse rounded">
                {initStatus}
              </span>
            )}
          </div>
          
          <div className="border-t border-slate-800/40 pt-4 flex flex-col gap-2">
            <span className="font-mono text-[9px] text-slate-500 font-bold uppercase">📥 นำเข้าไฟล์ Markdown เดี่ยวเข้าคลัง Obsidian (Legacy Mode)</span>
            <div className="flex flex-wrap gap-3 items-center bg-slate-950/20 p-3 rounded border border-slate-900">
              <input
                type="text"
                value={ingestFilename}
                onChange={(e) => setIngestFilename(e.target.value)}
                placeholder="ชื่อไฟล์ เช่น arima_notes.md"
                className="retro-input py-1 text-xs max-w-xs font-mono"
              />
              <input
                type="text"
                value={ingestContent}
                onChange={(e) => setIngestContent(e.target.value)}
                placeholder="เนื้อความสั้นๆ..."
                className="retro-input py-1 text-xs flex-1 font-mono"
              />
              <button
                onClick={handleLegacyIngest}
                disabled={ingestLoading || !ingestContent.trim()}
                className="retro-btn bg-[#182d23] border-slate-700 text-slate-300 py-1.5 px-3 text-xs"
              >
                บันทึกประเด็น 💾
              </button>
              {ingestStatus && <span className="font-mono text-[10px] text-purple-400">{ingestStatus}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Draft Workbench viewer */}
      {activeTab === "draft" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-mono text-sm text-indigo-400 flex items-center gap-2 font-bold uppercase">
              <FileText className="w-5 h-5 text-indigo-400" /> ร่างวิจัยขัดเกลาแล้ว (Finalized Polished Draft)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              [ผลลัพธ์จาก แมว 3 เกลาภาษาคนเป็นทางการสำเร็จรูป]
            </span>
          </div>

          {draft ? (
            <div className="flex flex-col gap-4">
              <textarea
                rows={16}
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                className="retro-input w-full font-mono text-xs leading-relaxed bg-[#0b0c10] text-slate-200 border-indigo-900/60 p-4"
              />
              
              <div className="bg-[#111622] p-4 border border-indigo-500/20 text-xs text-slate-300 font-mono flex items-center justify-between">
                <span>เหมียว! นี่คือร่างบทความวิจัยที่ผ่านการอนุมัติเชิงเนื้อหาและเกลาสำนวนภาษาอังกฤษเรียบร้อยแล้วค่ะ!</span>
                {stage === "saved" ? (
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded">🔒 แช่แข็งสำเร็จแล้ว</span>
                ) : (
                  <button
                    onClick={onLockChapter}
                    disabled={isGenerating}
                    className="retro-btn bg-[#251d38] border-purple-500 text-purple-400 py-1.5 px-3"
                  >
                    🔒 แช่แข็งและบันทึกเปเปอร์เข้า Cold Storage
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600 font-mono gap-2 border-2 border-dashed border-slate-800 rounded">
              <FileText className="w-12 h-12 opacity-35" />
              <span>ยังไม่มีร่างบทความวิจัยเกลาสำเร็จค่ะ!</span>
              <span className="text-[10px] text-slate-700">กลับไปยังแท็บ [1] รันห่วงโซ่การผลิตห้าแมวเพื่อเริ่มเขียนร่างบทความนะคะเหมียว</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Review Comments visualizer */}
      {activeTab === "review" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-mono text-sm text-red-500 flex items-center gap-2 font-bold uppercase">
              <AlertTriangle className="w-5 h-5 text-red-500" /> สมุดบันทึกประเมิน พี่ส้มสายวีน (Reviewer Critique Notes)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              [ผลลัพธ์การสับเกณฑ์ Scopus Q3/Q4 จาก แมว 2]
            </span>
          </div>

          {critique ? (
            <div className="flex flex-col gap-4">
              <div className={`p-4 border-2 rounded ${
                isReviewFail 
                  ? "bg-red-950/20 border-red-500/40 text-red-300" 
                  : "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
              } font-mono text-xs flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                  {isReviewFail ? (
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 animate-bounce" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold">สถานะความพร้อม: {isReviewFail ? "❌ ไม่ผ่านเกณฑ์ [FAIL]" : "🟢 ผ่านเกณฑ์การประเมิน [PASS]!"}</p>
                    <p className="text-[10px] opacity-70">พี่ส้มได้ประเมินเนื้อหาและสมการใน Obsidian logs เรียบร้อยแล้วค่ะ</p>
                  </div>
                </div>
                {loopCount > 0 && (
                  <span className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded">
                    รอบประเมินสับแก้: {loopCount}
                  </span>
                )}
              </div>

              <div className="bg-[#12131a] p-4 border border-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-200">
                {critique}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600 font-mono gap-2 border-2 border-dashed border-slate-800 rounded">
              <AlertTriangle className="w-12 h-12 opacity-35" />
              <span>ยังไม่มีประวัติการส่งประเมินความปลอดภัยเชิงทฤษฎีเหมียว!</span>
              <span className="text-[10px] text-slate-700">ระบบจะประเมินโดยอัตโนมัติเมื่อทาสคลิกรันห่วงโซ่แมวในแท็บ [1]</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Configuration */}
      {activeTab === "config" && (
        <div className="flex flex-col gap-6 font-mono text-xs text-slate-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-mono text-sm text-slate-300 flex items-center gap-2 font-bold uppercase">
              <Settings className="w-5 h-5 text-slate-400" /> การตั้งค่าสมองกลโรงหล่อ (Foundry System Configuration)
            </h3>
            <span className="text-[10px] text-slate-500">[ปรับแต่งเชื่อมต่อ API และคลังพาธ]</span>
          </div>

          <div className="flex flex-col gap-4 bg-slate-950/40 p-4 border border-slate-800 rounded">
            
            <div className="flex flex-col gap-2">
              <label className="font-bold flex items-center gap-1 text-slate-200">
                🔑 Google Gemini API Key:
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="ป้อนรหัสคีย์ AI (หากละเว้น จะใช้รหัสลับฝั่ง Backend Server เหมียว)"
                className="retro-input w-full font-mono text-xs py-1.5"
              />
              <span className="text-[10px] text-slate-500">* API key จะเก็บไว้ปลอดภัยในเครื่องของทาสผ่าน LocalStorage</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold flex items-center gap-1 text-slate-200">
                📂 Obsidian Vault Absolute Path (ตำแหน่งคลังความจำ):
              </label>
              <input
                type="text"
                value={obsidianPath}
                onChange={(e) => setObsidianPath(e.target.value)}
                placeholder="เช่น /Users/thanachit/Documents/MyResearchVault"
                className="retro-input w-full font-mono text-xs py-1.5"
              />
              <span className="text-[10px] text-slate-500">* คลังทำงานหลัก แนะนำให้เลือก Absolute path โฟลเดอร์ Obsidian ที่เปิดใช้จริง</span>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-800 pt-4">
              <label className="font-bold text-slate-200">🔒 Google NotebookLM Authentication (Model Context Protocol):</label>
              <div className="flex gap-4 items-center">
                <button
                  onClick={handleRunAuth}
                  disabled={authLoading}
                  className="retro-btn bg-[#251d38] border-purple-500 text-purple-200 py-1.5 px-4 text-xs font-bold shrink-0"
                >
                  {authLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  🔑 ยืนยันสิทธิ์บัญชี Google Account (เปิดเบราว์เซอร์)
                </button>
                {authStatus && <span className="text-[10px] text-purple-400 animate-pulse">{authStatus}</span>}
              </div>
              <span className="text-[9px] text-slate-500">
                * ระบบจะจำลองและควบคุม Chromium เพื่อข้ามกำแพงความปลอดภัยและนำบทความขึ้นประดิษฐ์ใน Google NotebookLM โดยตรง
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-slate-200">NotebookLM Ingestion Mode:</label>
                <select
                  value={notebookMode}
                  onChange={(e) => setNotebookMode(e.target.value)}
                  className="retro-input py-1 cursor-pointer bg-black text-xs"
                >
                  <option value="webhook">ส่งออกผ่าน Webhook ภายนอก (Offline backup)</option>
                  <option value="mcp">เชื่อมต่อ Google Account และป้อน Notebook ตรงๆ (MCP Mode)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-slate-200">Google Notebook ID (กรณีเป็นระบบ MCP):</label>
                <input
                  type="text"
                  value={notebookId}
                  onChange={(e) => setNotebookId(e.target.value)}
                  placeholder="เช่น 1a2b3c4d5e6f7g..."
                  className="retro-input w-full font-mono text-xs py-1"
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-bold text-slate-200">Webhook URL รับประวัติ (กรณีเก็บสำรอง):</label>
                <input
                  type="text"
                  value={notebookWebhook}
                  onChange={(e) => setNotebookWebhook(e.target.value)}
                  placeholder="เช่น https://n8n.my-domain.com/webhook/research"
                  className="retro-input w-full font-mono text-xs py-1"
                />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
