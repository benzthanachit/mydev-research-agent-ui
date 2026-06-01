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
  onRunCoordinator: () => void; // New prop for coordinating secretary
  onIngestSuccess?: () => void; // Callback to refresh memory explorer

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
  setNotebookId
}: ChapterWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<"workspace" | "config" | "draft" | "review" | "ingest">("workspace");
  const [authLoading, setAuthLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState("");

  // Ingest states for uploading manuscript draft
  const [ingestFilename, setIngestFilename] = useState("manuscript_base.md");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState("");
  const [localPdfPath, setLocalPdfPath] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [directSave, setDirectSave] = useState(false);

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

  const handleIngestSubmit = async () => {
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

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setLocalPdfPath(""); // Clear local path to prevent conflict
    setIngestStatus(`เลือกไฟล์ PDF สำเร็จเหมียว: ${file.name} 📂 (กดปุ่มนำเข้าด้านล่างเพื่อเริ่มสร้างโครงข่ายความรู้)`);
  };

  const handleUploadPdfFile = async (file: File) => {
    setPdfLoading(true);
    setIngestStatus("เลขาเหมียวกำลังแปลงไฟล์ PDF เป็น Base64 ในเครื่องของทาส... 😻🔌");

    try {
      // 1. Read PDF file as Base64 on client side using modern arrayBuffer API (extremely robust!)
      let fileBase64 = "";
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileBase64 = "data:application/pdf;base64," + window.btoa(binary);
      } catch (nativeErr) {
        console.warn("Modern arrayBuffer failed, falling back to FileReader:", nativeErr);
        const reader = new FileReader();
        fileBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error || new Error("ไม่สามารถอ่านหรือเข้าถึงไฟล์ PDF ในเครื่องของทาสได้เหมียว"));
          reader.readAsDataURL(file);
        });
      }

      setIngestStatus("ส่งข้อมูล Base64 ไปให้ Gemini 2.5 Flash ช่วยวิเคราะห์และวางผังความรู้... 😻🕸️");

      // 2. Fetch the /api/pdf endpoint with standard JSON (no multipart, completely safe from ECONNRESET!)
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileBase64,
          filename: file.name,
          apiKey,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setIngestStatus(`ถอดรหัสเอกสารล้มเหลว: ${data.error}`);
        return;
      }

      if (data.files && data.files.length > 0) {
        setIngestStatus(`วิเคราะห์เสร็จแล้วเหมียว! กำลังบันทึกไฟล์ความรู้ ${data.files.length} รายการลง Obsidian...`);
        
        for (const fileItem of data.files) {
          await fetch("/api/obsidian", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "write",
              filename: fileItem.filename,
              content: fileItem.content,
              overwrite: true,
              vaultPath: obsidianPath
            })
          });
        }

        // Find the index file to show in the text area preview
        const indexFile = data.files.find((f: any) => f.filename.includes("Index")) || data.files[0];
        setIngestContent(indexFile.content);
        setPdfFile(null); // Reset file state
        
        setIngestStatus(
          data.mode === "mock" 
            ? `⚠️ โหมดจำลองเหมียว: สร้างคลังไฟล์ ${data.files.length} รายการสำเร็จเรียบร้อย!`
            : `สแกนสำเร็จเหมียว! 😻🕸️ สร้างไฟล์โครงข่ายความรู้ ${data.files.length} รายการลง Obsidian เรียบร้อยแล้วค่ะ!`
        );

        if (onIngestSuccess) {
          onIngestSuccess();
        }
      } else {
        setIngestStatus("ระบบ AI ไม่ได้สร้างผังคอนเซปต์เหมียว!");
      }
    } catch (err: any) {
      console.error("PDF ingest error detail:", err);
      let errMsg = "";
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (err && typeof err === "object") {
        errMsg = err.message || err.description || JSON.stringify(err);
      } else {
        errMsg = String(err);
      }
      setIngestStatus(`เกิดข้อผิดพลาดในการวิเคราะห์ PDF: ${errMsg}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleLocalPdfIngest = async () => {
    if (!localPdfPath) return;
    setPdfLoading(true);
    setIngestStatus("เลขาเหมียวกำลังเปิดอ่านไฟล์ PDF จากดิสก์ตรงๆ เพื่อความแข็งแกร่ง... 😻🔌");

    try {
      setIngestStatus("ส่งข้อมูล Base64 ไปให้ Gemini 2.5 Flash ช่วยวิเคราะห์และวางผังความรู้... 😻🕸️");

      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath: localPdfPath,
          apiKey,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setIngestStatus(`ถอดรหัสเอกสารล้มเหลว: ${data.error}`);
        return;
      }

      if (data.files && data.files.length > 0) {
        setIngestStatus(`วิเคราะห์เสร็จแล้วเหมียว! กำลังบันทึกไฟล์ความรู้ ${data.files.length} รายการลง Obsidian...`);
        
        for (const fileItem of data.files) {
          await fetch("/api/obsidian", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "write",
              filename: fileItem.filename,
              content: fileItem.content,
              overwrite: true,
              vaultPath: obsidianPath
            })
          });
        }

        const indexFile = data.files.find((f: any) => f.filename.includes("Index")) || data.files[0];
        setIngestContent(indexFile.content);
        setLocalPdfPath(""); // Reset path input
        
        setIngestStatus(
          data.mode === "mock" 
            ? `⚠️ โหมดจำลองเหมียว: สร้างคลังไฟล์ ${data.files.length} รายการสำเร็จเรียบร้อย!`
            : `สแกนสำเร็จเหมียว! 😻🕸️ สร้างไฟล์โครงข่ายความรู้ ${data.files.length} รายการลง Obsidian เรียบร้อยแล้วค่ะ!`
        );

        if (onIngestSuccess) {
          onIngestSuccess();
        }
      } else {
        setIngestStatus("ระบบ AI ไม่ได้สร้างผังคอนเซปต์เหมียว!");
      }
    } catch (err: any) {
      console.error("PDF local ingest error detail:", err);
      let errMsg = "";
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (err && typeof err === "object") {
        errMsg = err.message || err.description || JSON.stringify(err);
      } else {
        errMsg = String(err);
      }
      setIngestStatus(`เกิดข้อผิดพลาดในการวิเคราะห์ PDF: ${errMsg}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const getIngestButtonLabel = () => {
    if (pdfLoading || ingestLoading) return "เลขาเหมียวกำลังดำเนินการ... 🐾";
    if (localPdfPath.trim() !== "") return "🕸️ สแกน PDF จากพาธในเครื่องตรงๆ ด้วย AI (Unified Ingest)";
    if (pdfFile) return `🕸️ สแกนไฟล์ PDF ที่อัปโหลดด้วย AI (Unified Ingest)`;
    if (ingestContent.trim() !== "") {
      if (directSave) {
        return `💾 บันทึกเป็นไฟล์ ${ingestFilename} เข้า Vault ตรงๆ`;
      }
      return "🕸️ แยกวิเคราะห์สร้าง Obsidian Knowledge Graph ด้วย AI";
    }
    return "🕸️ นำข้อมูลเข้าสู่คลังความรู้ Obsidian (Unified Ingest)";
  };

  const handleUnifiedIngest = async () => {
    if (localPdfPath.trim() !== "") {
      await handleLocalPdfIngest();
    } else if (pdfFile) {
      await handleUploadPdfFile(pdfFile);
    } else if (ingestContent.trim() !== "") {
      if (directSave) {
        await handleIngestSubmit();
      } else {
        await handleCreateKnowledgeGraph();
      }
    } else {
      setIngestStatus("⚠️ โปรดเลือกไฟล์ PDF, ป้อนพาธไฟล์ หรือกรอกข้อความร่างวิจัยเพื่อนำเข้าเหมียว!");
    }
  };

  const handleCreateKnowledgeGraph = async () => {
    if (!ingestContent) return;
    setIngestLoading(true);
    setIngestStatus("เลขาเหมียววิเคราะห์ผังความรู้...");
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "knowledge-graph",
          draft: ingestContent,
          apiKey,
        })
      });
      const data = await res.json();
      if (data.error) {
        setIngestStatus(`ล้มเหลว: ${data.error}`);
        setIngestLoading(false);
        return;
      }

      let graphData;
      try {
        const cleanedStr = data.text.trim();
        // 1. Try direct parse first
        try {
          graphData = JSON.parse(cleanedStr);
        } catch (directErr) {
          // 2. Extract from markdown code block if present
          const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
          const match = cleanedStr.match(jsonBlockRegex);
          let candidate = cleanedStr;
          if (match && match[1]) {
            candidate = match[1].trim();
          }
          
          // 3. Try parsing candidate or substring inside first { and last }
          try {
            graphData = JSON.parse(candidate);
          } catch (candErr) {
            const firstBrace = candidate.indexOf("{");
            const lastBrace = candidate.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              const braceJson = candidate.substring(firstBrace, lastBrace + 1);
              // 4. Try cleaning trailing commas
              const safeJson = braceJson.replace(/,(\s*[\]}])/g, "$1");
              graphData = JSON.parse(safeJson);
            } else {
              throw candErr;
            }
          }
        }
      } catch (err: any) {
        console.error("JSON parsing error on response text:", err, data.text);
        throw new Error(`รูปแบบ JSON สแตกโครงสร้างผิดพลาด: ${err.message || "ไม่สามารถแปลงข้อมูลที่ได้จาก AI ได้"}`);
      }

      if (graphData.files && graphData.files.length > 0) {
        setIngestStatus(`พบหัวข้อเชื่อมโยง ${graphData.files.length} รายการ กำลังสร้างกราฟลง Obsidian...`);
        for (const file of graphData.files) {
          await fetch("/api/obsidian", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "write",
              filename: file.filename,
              content: file.content,
              overwrite: true,
              vaultPath: obsidianPath
            })
          });
        }
        setIngestStatus("สร้างคลังและ Obsidian Knowledge Graph สำเร็จ! 🎉🕸️");
        setIngestContent("");
        if (onIngestSuccess) {
          onIngestSuccess();
        }
      } else {
        setIngestStatus("ระบบ AI ไม่ได้สร้างผังคอนเซปต์เหมียว!");
      }
    } catch (err: any) {
      setIngestStatus(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIngestLoading(false);
      setTimeout(() => setIngestStatus(""), 4000);
    }
  };

  React.useEffect(() => {
    if (notebookMode === "mcp") {
      setAuthStatus("กำลังตรวจสภาพ MCP เหมียว...");
      fetch("/api/notebooklm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_health" })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.authenticated) {
            setAuthStatus("เชื่อมต่อแล้ว 🟢 (เข้าสู่ระบบแล้ว)");
          } else if (data.success && !data.authenticated) {
            setAuthStatus("รอเชื่อมต่อ 🟡 (รัน setup_auth)");
          } else {
            setAuthStatus("เซิร์ฟเวอร์ MCP ปิดอยู่ 🔴");
          }
        })
        .catch(() => {
          setAuthStatus("เซิร์ฟเวอร์ MCP ปิดอยู่ 🔴");
        });
    }
  }, [notebookMode]);

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
            ขั้นตอนภารกิจโรงหล่อแมววิจัย:
          </span>
          <span className="font-mono text-xs text-slate-400">
            สถานะปัจจุบัน: {stage.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-press-start font-bold">
          
          <div className={`p-2 border-2 ${
            getStageStep() >= 1 ? "border-retro-primary text-retro-primary bg-retro-panel-light" : "border-slate-800 text-slate-600"
          }`}>
            1. เลือกบทวิจัย
          </div>
          
          <div className={`p-2 border-2 ${
            getStageStep() >= 2 ? "border-sky-400 text-sky-400 bg-retro-panel-light" : "border-slate-800 text-slate-600"
          } ${stage === "drafting" ? "animate-pulse" : ""}`}>
            2. แมวหลวงร่างงาน
          </div>
          
          <div className={`p-2 border-2 ${
            getStageStep() >= 3 ? "border-red-400 text-red-400 bg-retro-panel-light" : "border-slate-800 text-slate-600"
          } ${isReviewFail ? "border-dashed border-red-600 bg-red-950/20 text-red-500 animate-pulse" : ""}`}>
            3. พี่ส้มสับวิจารณ์
          </div>
          
          <div className={`p-2 border-2 ${
            getStageStep() >= 4 ? "border-emerald-400 text-emerald-400 bg-retro-panel-light" : "border-slate-800 text-slate-600"
          }`}>
            4. ตรวจอ้างอิง
          </div>
          
          <div className={`p-2 border-2 ${
            getStageStep() >= 5 ? "border-retro-success text-retro-success bg-[#152317]" : "border-slate-800 text-slate-600"
          }`}>
            5. แช่แข็งผลงาน 🔒
          </div>

        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-wrap gap-2 font-press-start text-[10px]">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`px-4 py-2 border-t-4 border-x-4 transition-all ${
            activeTab === "workspace"
              ? "bg-retro-panel border-retro-border text-retro-primary -mb-[4px] z-10"
              : "bg-[#161722] border-transparent text-slate-400 hover:text-white"
          }`}
        >
          [1] โต๊ะทำงานวิจัย
        </button>
        <button
          onClick={() => setActiveTab("ingest")}
          className={`px-4 py-2 border-t-4 border-x-4 transition-all ${
            activeTab === "ingest"
              ? "bg-retro-panel border-retro-border text-purple-400 -mb-[4px] z-10"
              : "bg-[#161722] border-transparent text-slate-400 hover:text-white"
          }`}
        >
          [5] นำเข้าเอกสารร่างวิจัย
        </button>
        <button
          onClick={() => setActiveTab("draft")}
          className={`px-4 py-2 border-t-4 border-x-4 transition-all ${
            activeTab === "draft"
              ? "bg-retro-panel border-retro-border text-sky-400 -mb-[4px] z-10"
              : "bg-[#161722] border-transparent text-slate-400 hover:text-white"
          }`}
        >
          [2] ร่างต้นฉบับบทความ ({draft ? "พร้อมตรวจ" : "ยังไม่มีข้อมูล"})
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-4 py-2 border-t-4 border-x-4 transition-all ${
            activeTab === "review"
              ? "bg-retro-panel border-retro-border text-retro-accent -mb-[4px] z-10"
              : "bg-[#161722] border-transparent text-slate-400 hover:text-white"
          }`}
        >
          [3] ผลการตรวจสับและอ้างอิง
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 border-t-4 border-x-4 transition-all ${
            activeTab === "config"
              ? "bg-retro-panel border-retro-border text-slate-200 -mb-[4px] z-10"
              : "bg-[#161722] border-transparent text-slate-400 hover:text-white"
          }`}
        >
          [4] ตั้งค่าสมองกล AI
        </button>
      </div>

      {/* Workspace Panel Box */}
      <div className="retro-border-double p-6 bg-retro-panel flex-1 min-h-[400px]">
        
        {activeTab === "workspace" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-retro-border/30 pb-3 gap-3">
              <h3 className="font-press-start text-xs text-retro-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> ข้อมูลอภิวิจัยเป้าหมาย (Scopus Target)
              </h3>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">บทที่กำลังเขียน:</span>
                <select
                  value={currentChapter}
                  onChange={(e) => onChapterChange(e.target.value)}
                  disabled={stage === "saved" || isGenerating}
                  className="retro-input max-w-xs cursor-pointer py-1 text-sm bg-black"
                >
                  <option value="Chapter 1: Introduction & Literature">บทที่ 1: บทนำและการทบทวนเบื้องต้น</option>
                  <option value="Chapter 2: Literature Review">บทที่ 2: การทบทวนวรรณกรรมเชิงลึก</option>
                  <option value="Chapter 3: Research Methodology">บทที่ 3: ระเบียบวิธีและสถาปัตยกรรมวิจัย</option>
                  <option value="Chapter 4: Results & Discussion">บทที่ 4: ผลการทดลองและการอภิปราย</option>
                  <option value="Chapter 5: Conclusion & Future Scope">บทที่ 5: สรุปผลและขอบเขตงานในอนาคต</option>
                </select>
              </div>
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  หัวข้อบทความวิจัย (เป้าหมาย Scopus Q3/Q4):
                </label>
                <input
                  type="text"
                  value={variables.title}
                  onChange={(e) => handleVariableChange("title", e.target.value)}
                  placeholder="เช่น A Hybrid Deep Learning Inventory model..."
                  className="retro-input w-full"
                  disabled={isGenerating || stage === "saved"}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  ระเบียบวิธีวิจัย / ทฤษฎีหลัก:
                </label>
                <input
                  type="text"
                  value={variables.methodology}
                  onChange={(e) => handleVariableChange("methodology", e.target.value)}
                  placeholder="เช่น โครงข่าย LSTM ประมวลผลร่วมกับฟิลเตอร์คาลมาน"
                  className="retro-input w-full"
                  disabled={isGenerating || stage === "saved"}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  ท่อส่งขั้นตอนประมวลผล / ตัวแปรสมการเชิงลึก:
                </label>
                <textarea
                  rows={3}
                  value={variables.pipeline}
                  onChange={(e) => handleVariableChange("pipeline", e.target.value)}
                  placeholder="เช่น การนำเข้าข้อมูลดิบ -> กำจัดสัญญาณรบกวนด้วย Kalman -> ฝึกสอน LSTM Residuals -> ประเมินผล"
                  className="retro-input w-full font-mono text-sm"
                  disabled={isGenerating || stage === "saved"}
                />
              </div>

            </div>

            {/* Actions Trigger Panel */}
            <div className="border-t border-retro-border/30 pt-6 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3">
                
                {/* Secretary command is always available during active work */}
                {stage !== "saved" && (
                  <button
                    onClick={onRunCoordinator}
                    disabled={isGenerating}
                    className="retro-btn bg-[#3a253f] border-purple-400 text-purple-200"
                  >
                    {isGenerating && activeAgent === "coordinator" ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1 text-purple-400 animate-pulse" />
                    )}
                    ถามเลขาเหมียววางแผนงาน 📋
                  </button>
                )}

                {stage === "select" && (
                  <button
                    onClick={onRunScribe}
                    disabled={isGenerating}
                    className="retro-btn bg-[#1e2e38] border-sky-400 text-sky-200"
                  >
                    {isGenerating && activeAgent === "scribe" ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1" />
                    )}
                    สั่ง SCRIBE CAT ร่างบทความ ✍️
                  </button>
                )}

                {(stage === "drafting" || (stage === "reviewing" && isReviewFail)) && (
                  <>
                    <button
                      onClick={onRunScribe}
                      disabled={isGenerating}
                      className="retro-btn bg-slate-800 border-indigo-400 text-sky-200 mr-2"
                    >
                      {isGenerating && activeAgent === "scribe" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      {isReviewFail ? "เขียนร่างใหม่ (แก้ไขรอยรั่ว)" : "เกลาร่างใหม่"}
                    </button>

                    {draft && (
                      <button
                        onClick={onRunReview}
                        disabled={isGenerating}
                        className="retro-btn bg-[#3c1d27] border-retro-accent text-retro-accent"
                      >
                        {isGenerating && activeAgent === "reviewer" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                        ส่งให้พี่ส้มสายวีนสับตรวจ 😾
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
                    {isGenerating && activeAgent === "librarian" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    ส่งให้บรรณารักษ์เหมียวตรวจอ้างอิง 📚
                  </button>
                )}

                {stage === "librarian" && (
                  <button
                    onClick={onLockChapter}
                    disabled={isGenerating}
                    className="retro-btn bg-[#251d38] border-purple-500 text-purple-400"
                  >
                    🔒 แช่แข็งและบันทึกบทวิจัย
                  </button>
                )}

                {stage === "saved" && (
                  <div className="flex items-center gap-2 font-press-start text-[10px] text-retro-success bg-[#152317] border border-retro-success p-2 rounded">
                    <CheckCircle className="w-4 h-4" /> แช่แข็งและนำส่งคลังวิจัย Scopus สำเร็จแล้วค่ะทาส! 😻
                  </div>
                )}

              </div>

              {stage !== "select" && (
                <button
                  onClick={onResetWorkflow}
                  className="retro-btn bg-[#2c1e21] border-red-800 text-red-400 py-1 font-mono text-[10px]"
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> รีเซ็ตขั้นตอนทำงาน
                </button>
              )}

            </div>

          </div>
        )}

        {/* Tab 5: Ingest manuscript draft into Obsidian working memory */}
        {activeTab === "ingest" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-retro-border/30 pb-3">
              <h3 className="font-press-start text-xs text-purple-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> นำเข้าและสร้างคลังความรู้ต้นฉบับวิจัย 📂
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                [บันทึกเข้า Obsidian Vault เพื่อปูคลังสมองให้เอเจนต์]
              </span>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              ทาสสามารถป้อนเอกสารหรือโครงสร้างร่างวิจัยเดิมที่เตรียมไว้ เพื่อนำมาสร้างเป็น **"ไฟล์คลังความรู้สะสม"** ประจำตัว
              เมื่อ Scribe Cat ร่างบทวิจัย หรือเลขาเหมียววิเคราะห์แผนงาน จะเปิดอ่านเอกสารความรู้นี้จาก Obsidian โดยอัตโนมัติ เพื่อนำความรู้มาประยุกต์เขียนงานได้ลึกซึ้งสูงสุดเหมียว!
            </p>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  ตั้งชื่อไฟล์ความรู้ (ภาษาอังกฤษ ลงท้ายด้วย .md เหมียว):
                </label>
                <input
                  type="text"
                  value={ingestFilename}
                  onChange={(e) => setIngestFilename(e.target.value)}
                  placeholder="เช่น manuscript_base.md หรือ deep_learning_method.md"
                  className="retro-input w-full font-mono text-sm"
                />
              </div>

              {/* PDF Ingestion Area */}
              <div className="border-2 border-dashed border-purple-500/40 p-4 bg-purple-950/10 rounded flex flex-col gap-2">
                <label className="font-press-start text-[9px] text-purple-400 flex items-center gap-1.5 font-bold">
                  📂 นำเข้าและสร้างคลังความรู้จากไฟล์วิจัย PDF ผ่าน Gemini Multimodal (Gemini PDF Ingest):
                </label>
                <div className="flex items-center gap-4 flex-wrap">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="font-mono text-xs text-slate-300 cursor-pointer bg-black/40 border border-slate-700 py-1.5 px-3 rounded hover:bg-slate-900"
                    disabled={pdfLoading}
                  />
                  {pdfLoading && (
                    <span className="font-mono text-xs text-purple-400 flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      เลขาเหมียวกำลังวิเคราะห์เอกสาร PDF ด้วย Gemini...
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  เมื่อเลือกไฟล์ PDF ระบบจะส่งข้อมูลแบบ Base64 ไปยัง Gemini 2.5 Flash เพื่อแยกวิเคราะห์โครงข่ายความรู้เชื่อมโยงและสร้างไฟล์ Markdown เข้า Obsidian คลังของทาสรักทันทีเหมียว! 😻🕸️
                </p>

                {/* Local Path Ingest Bypass */}
                <div className="border-t border-purple-500/20 pt-3 mt-2 flex flex-col gap-2">
                  <label className="font-press-start text-[8px] text-purple-300">
                    🔗 หรือป้อนพาธไฟล์ PDF ในเครื่องโดยตรง (Bypass หลบหน้าต่างทราย):
                  </label>
                  <input
                    type="text"
                    value={localPdfPath}
                    onChange={(e) => setLocalPdfPath(e.target.value)}
                    placeholder="ระบุพาธ เช่น ./my-paper.pdf หรือ /Users/thanachit/Downloads/research.pdf"
                    className="retro-input w-full font-mono text-xs py-1"
                    disabled={pdfLoading}
                  />
                  <p className="text-[10px] text-slate-400 font-mono">
                    *กรณีเบราว์เซอร์ติดสิทธิ์ macOS Sandbox หรือ iCloud ทาสสามารถนำไฟล์มาวางในโฟลเดอร์โปรเจกต์นี้ (เช่น <code className="text-purple-400">./document.pdf</code>) แล้วป้อนพาธเพื่ออ่านตรงจากฝั่งเซิร์ฟเวอร์ได้เลยเหมียว!
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  ป้อน/วางข้อความต้นฉบับร่างงานวิจัยวิชาการของคุณ (หรือแก้ไขที่มาจากการสกัด PDF ด้านบน):
                </label>
                <textarea
                  rows={8}
                  value={ingestContent}
                  onChange={(e) => setIngestContent(e.target.value)}
                  placeholder="คัดลอกบทความ สถิติ สมการ หรือทฤษฎีเด่นของคุณมาวางได้ที่นี่ หรือปล่อยให้ PDF Extractor สกัดข้อความลงมาเหมียว..."
                  className="retro-input w-full font-mono text-sm leading-relaxed"
                />
              </div>

              {/* Dynamic Ingestion Configuration Options */}
              {!pdfFile && !localPdfPath && ingestContent.trim() !== "" && (
                <div className="flex items-center gap-2 bg-slate-950/40 border border-purple-500/20 p-2.5 rounded max-w-fit">
                  <input
                    type="checkbox"
                    id="direct-save-checkbox"
                    checked={directSave}
                    onChange={(e) => setDirectSave(e.target.checked)}
                    className="cursor-pointer accent-purple-500 w-4 h-4"
                  />
                  <label htmlFor="direct-save-checkbox" className="font-press-start text-[8px] text-purple-300 cursor-pointer select-none">
                    💾 บันทึกเป็นไฟล์เดี่ยวตรงๆ (ไม่แยกไฟล์ด้วย AI)
                  </label>
                </div>
              )}

              <div className="flex gap-4 items-center flex-wrap">
                <button
                  onClick={handleUnifiedIngest}
                  disabled={pdfLoading || ingestLoading || (!pdfFile && !localPdfPath && !ingestContent)}
                  className="retro-btn bg-[#251d38] border-purple-400 text-purple-200 animate-pulse font-bold flex items-center justify-center min-w-[280px]"
                  type="button"
                >
                  {pdfLoading || ingestLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2 text-purple-400 animate-pulse" />
                  )}
                  {getIngestButtonLabel()}
                </button>

                {ingestStatus && (
                  <span className="font-mono text-xs text-retro-primary bg-black/40 border border-retro-border px-3 py-1 animate-pulse">
                    {ingestStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "draft" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-retro-border/30 pb-2">
              <h3 className="font-press-start text-xs text-sky-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> 📄 ต้นฉบับร่างบทวิจัยปัจจุบันที่กำลังเขียน
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                [จำนวนตัวอักษร: {draft.length}]
              </span>
            </div>

            {draft ? (
              <div className="flex flex-col gap-4 flex-1">
                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  ด้านล่างนี้คือเนื้อหาร่างบทวิจัยที่แมวนักเขียนรวบรวมขึ้นมา ทาสสามารถเลือกเขียน ขัดเกลา หรือเพิ่มเติมตัวเลขและโมเดลการคำนวณลงไปได้โดยตรงก่อนส่งประเมินค่ะ
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
                  หน้ากระดาษร่างวิจัยยังว่างเปล่าอยู่ค่ะเหมียว!
                </p>
                <p className="text-xs text-slate-600 font-mono mt-1 font-bold">
                  กรอกพารามิเตอร์ด้านบน หรือนำเข้าร่างวิจัยในแท็บนำเข้า แล้วสั่งการ Scribe Cat หรือวิเคราะห์ร่วมกับเลขาได้เลยค่ะ
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
                <AlertTriangle className="w-4 h-4" /> การสับตรวจโดยพี่ส้มสายวีน (Grumpy Reviewer QA)
              </h4>

              {critique ? (
                <div className={`p-4 retro-border-single flex-1 min-h-[300px] flex flex-col justify-between ${
                  isReviewFail ? "bg-[#251515] border-red-600 text-red-300" : "bg-[#15251a] border-emerald-600 text-emerald-300"
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {isReviewFail ? (
                        <div className="bg-red-600 text-white font-press-start text-[8px] px-1 py-0.5 rounded">
                          ผลประเมิน: ไม่ผ่านเกณฑ์เชิงวิชาการ (FAIL) 😾
                        </div>
                      ) : (
                        <div className="bg-emerald-600 text-white font-press-start text-[8px] px-1 py-0.5 rounded">
                          ผลประเมิน: ผ่านฉลุยเหมาะตีพิมพ์ (PASS) 😻
                        </div>
                      )}
                    </div>
                    <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {critique}
                    </pre>
                  </div>

                  {isReviewFail && (
                    <div className="mt-4 p-2 bg-black/40 border border-red-700 text-xs font-mono text-red-200">
                      🐾 Scribe Cat แนะนำ: ทาสสามารถปรับโมเดลวิจัยด้านบนเพิ่มเติมเพื่อแก้ไขจุดรั่วไหลที่พี่ส้มสายวีนบ่น แล้วลองสั่งร่างโมเดลใหม่อีกรอบนะคะ
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center border-4 border-dashed border-retro-border/20 rounded">
                  <HelpCircle className="w-12 h-12 text-slate-600 mb-2" />
                  <p className="font-press-start text-[10px] text-slate-500 uppercase">
                    ยังไม่มีบันทึกการสับผลงานโดยพี่ส้มเหมียว!
                  </p>
                  <p className="text-xs text-slate-600 font-mono mt-1">
                    เมื่อร่างบทวิจัยเรียบร้อยแล้ว ปุ่มส่งตรวจประเมินจะปรากฏขึ้นมาค่ะ
                  </p>
                </div>
              )}
            </div>

            {/* Librarian Citation Card */}
            <div className="flex flex-col gap-3">
              <h4 className="font-press-start text-[10px] text-sky-300 flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> บรรณารักษ์เหมียวจอมเนี้ยบ ตรวจสไตล์เอกสารอ้างอิง
              </h4>

              {citations ? (
                <div className="parchment p-5 flex-1 min-h-[300px] font-mono text-sm text-[#3b2f2f] leading-relaxed shadow-lg">
                  <div className="border-b border-[#8f7457] pb-2 mb-3 flex justify-between items-center text-[10px]">
                    <span className="font-bold">รายงานบรรณารักษ์เหมียว</span>
                    <span>มาตรฐาน APA / IEEE</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono">
                    {citations}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center border-4 border-dashed border-retro-border/20 rounded bg-black/10">
                  <BookOpen className="w-12 h-12 text-slate-600 mb-2" />
                  <p className="font-press-start text-[10px] text-slate-500 uppercase">
                    ยังไม่ได้เริ่มวิเคราะห์สไตล์อ้างอิง
                  </p>
                  <p className="text-xs text-slate-600 font-mono mt-1">
                    บทความต้องได้รับการไฟเขียว [PASS] จากพี่ส้มสายวีนก่อนถึงจะส่งต่อเพื่อกรองบรรณานุกรมได้ค่ะเหมียว!
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

        {activeTab === "config" && (
          <div className="flex flex-col gap-6">
            <h3 className="font-press-start text-xs text-slate-200 border-b border-retro-border/30 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-retro-primary" /> ระบบวิเคราะห์ประสาทปัญญาประดิษฐ์ & คลังเก็บข้อมูล 🧠
            </h3>

            <div className="grid grid-cols-1 gap-6 max-w-2xl">
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="font-press-start text-[9px] text-slate-300 flex items-center gap-1">
                    รหัสสมองกล GEMINI API KEY (สำหรับการทำงานเชื่อมต่อจริง):
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    {apiKey ? "🔑 สมองกลพร้อมทำงานจริง" : "⚠️ โหมดจำลองเรโทรเหมียวโลคัล"}
                  </span>
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="ป้อนรหัสผ่าน Gemini API Key ของคุณที่นี่..."
                  className="retro-input w-full placeholder-slate-700"
                />
                <p className="text-xs text-slate-500 font-mono">
                  หากปล่อยเว้นว่างไว้ โรงหล่อต้นฉบับจะรันโดยใช้ชุดจำลองข้อความงานวิจัยระดับ Scopus ภาษาไทยสุดเข้มข้นเพื่อให้คุณสามารถเห็นความสอดคล้องได้ทันที
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-press-start text-[9px] text-slate-300">
                  โฟลเดอร์หลักสำหรับคลังความรู้ OBSIDIAN VAULT PATH (ความจำระยะยาว):
                </label>
                <input
                  type="text"
                  value={obsidianPath}
                  onChange={(e) => setObsidianPath(e.target.value)}
                  placeholder="เช่น /Users/thanachit/Documents/MyResearchVault"
                  className="retro-input w-full placeholder-slate-700"
                />
                <p className="text-xs text-slate-500 font-mono">
                  ไฟล์บันทึกการวิจัยและการอัพโหลดนำเข้าความรู้จะเซฟลงโฟลเดอร์นี้ หากเว้นว่างไว้จะบันทึกในโฟลเดอร์ <code className="text-retro-primary">obsidian-vault</code> เริ่มต้นภายในโครงการนี้เหมียว!
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-press-start text-[9px] text-slate-300">
                  รูปแบบการบันทึกเชื่อมต่อ NOTEBOOKLM:
                </label>
                <select
                  value={notebookMode}
                  onChange={(e) => setNotebookMode(e.target.value)}
                  className="retro-input w-full cursor-pointer bg-black"
                >
                  <option value="webhook">Webhook / บันทึกไฟล์ลงเครื่องแบบออฟไลน์</option>
                  <option value="mcp">เชื่อมต่อ Google NotebookLM ตรงผ่านระบบเซิร์ฟเวอร์ MCP</option>
                </select>
                <p className="text-xs text-slate-500 font-mono">
                  เลือกว่าคุณต้องการแช่แข็งงานโดยอัพโหลดลงเครื่องและเรียกยิง Webhook หรือส่งข้อมูลเข้า Google NotebookLM ตรงผ่านPleasePromptoเซิร์ฟเวอร์
                </p>
              </div>

              {notebookMode === "mcp" ? (
                <div className="flex flex-col gap-4 border-2 border-dashed border-retro-border/40 p-4 bg-black/20">
                  <div className="flex flex-col gap-2">
                    <label className="font-press-start text-[9px] text-purple-400">
                      รหัสหรือลิงก์สมุดบันทึก GOOGLE NOTEBOOK ID (ถ้ามี):
                    </label>
                    <input
                      type="text"
                      value={notebookId}
                      onChange={(e) => setNotebookId(e.target.value)}
                      placeholder="เช่น 1a2b3c4d-..."
                      className="retro-input w-full placeholder-slate-700 font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 font-mono">
                      หากระบุ รหัสจะถูกส่งนำความรู้เข้าไปใส่สมุดวิจัยเล่มนั้น หากเว้นไว้จะใช้เล่มที่กำลังเปิดแอคทีฟล่าสุดบนเครื่องค่ะ
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-retro-border/20 pt-4">
                     <label className="font-press-start text-[9px] text-slate-300">
                      ตั้งค่า Google Authentication สำหรับระบบคลังตรง MCP:
                    </label>
                    <div className="flex items-center gap-4 flex-wrap">
                      <button
                        onClick={handleRunAuth}
                        disabled={authLoading}
                        className="retro-btn bg-[#251d38] border-purple-500 text-purple-200"
                        type="button"
                      >
                        {authLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : null}
                        ⚡️ เชื่อมบัญชี GOOGLE AUTH (setup_auth)
                      </button>
                      
                      {authStatus && (
                        <span className="font-mono text-xs text-retro-primary bg-[#0e0f15] border border-retro-border px-2 py-1">
                          {authStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      เรียกเปิดหน้าต่างล็อกอินเพื่อเชื่อมต่อบัญชี Google ของคุณให้เซิร์ฟเวอร์เข้าอัพโหลดข้อมูลใน NotebookLM ได้อย่างปลอดภัย (ทำเพียงครั้งแรกครั้งเดียว)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="font-press-start text-[9px] text-slate-300">
                    ยิงส่งข้อมูลเก็บเข้าด้วยระบบ WEBHOOK URL:
                  </label>
                  <input
                    type="text"
                    value={notebookWebhook}
                    onChange={(e) => setNotebookWebhook(e.target.value)}
                    placeholder="เช่น https://api.notebooklm.google.com/webhook/..."
                    className="retro-input w-full placeholder-slate-700"
                  />
                  <p className="text-xs text-slate-500 font-mono">
                    ไฟล์บทความที่แช่แข็งเสร็จสิ้นจะเซฟแบ็คอัพไว้ในโฟลเดอร์ย่อย <code className="text-retro-primary">notebooklm-cold-storage</code> ภายในโปรเจกต์และส่งยิง POST ไปยัง Webhook นี้
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
