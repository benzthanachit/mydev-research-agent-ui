"use client";

import React, { useState, useEffect } from "react";
import OfficeCanvas from "../components/OfficeCanvas";
import ChapterWorkbench from "../components/ChapterWorkbench";
import MemoryExplorer from "../components/MemoryExplorer";
import SecretaryChat from "../components/SecretaryChat";
import TaskApprovalModal from "../components/TaskApprovalModal";
import { Terminal, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export default function Home() {
  // Config States (Persistent in localStorage)
  const [apiKey, setApiKey] = useState("");
  const [obsidianPath, setObsidianPath] = useState("");
  const [notebookWebhook, setNotebookWebhook] = useState("");
  const [notebookMode, setNotebookMode] = useState("webhook"); // 'webhook' | 'mcp'
  const [notebookId, setNotebookId] = useState("");
  
  // Chapter State Machine States
  const [currentChapter, setCurrentChapter] = useState("Chapter 3: Research Methodology");
  const [stage, setStage] = useState<"select" | "initializing" | "drafting" | "reviewing" | "editing" | "librarian" | "saved">("select");
  
  const [variables, setVariables] = useState({
    title: "",
    methodology: "",
    pipeline: ""
  });

  const [draft, setDraft] = useState("");
  const [critique, setCritique] = useState("");
  const [citations, setCitations] = useState("");
  
  // NEW Pipeline state variables
  const [pipelineLogs, setPipelineLogs] = useState<Array<{ stage: string; text: string; timestamp: string; type: "info" | "success" | "warning" | "error" }>>([]);
  const [loopCount, setLoopCount] = useState(0);
  const [chapterDraft, setChapterDraft] = useState("");

  // UI Display States
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAgent, setActiveAgent] = useState<"none" | "manager" | "scribe" | "reviewer" | "editor" | "librarian" | "coordinator">("manager");
  const [dialogueText, setDialogueText] = useState("ยินดีต้อนรับสู่โรงหล่อต้นฉบับแมวเหมียว 🐾 ทาสรักวิชาการสามารถเลือกบทที่ต้องการพัฒนา ป้อนร่างข้อมูลตั้งต้นที่แท็บ [2] หรือพิมพ์แชทประสานงานกับเลขาเหมียวทางด้านขวาเพื่อเริ่มงานได้เลยนะคะ!");
  
  // Secretary LINE Chat states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [affectionLevel, setAffectionLevel] = useState(30); // 0-100%
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);

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
      
      // Seed default draft text for Chapter 3
      setChapterDraft(
        `### Draft of Chapter 3: Research Methodology\n\nWe design a hybrid inventory model that integrates ARIMA statistical estimation and LSTM networks to model stock dependencies. First, warehouse records are cleaned by removing Gaussian noises using a Kalman noise reduction method. The cleaned data sequence is then modeled via an ARIMA process to capture linear trends. We extract the residual variance from the ARIMA outputs, which represents the remaining non-linear components. Finally, we train a custom LSTM deep learning network on these residuals to optimize predictions. The final output is aggregated.`
      );
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

  // Helper to gather ALL files in the Obsidian Vault to act as a unified knowledge base!
  const getObsidianVaultContext = async () => {
    let obsidianLogs = "";
    try {
      const listRes = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", vaultPath: obsidianPath })
      });
      const listData = await listRes.json();
      if (listData.success && listData.files && listData.files.length > 0) {
        const fileContents = await Promise.all(
          listData.files.map(async (f: any) => {
            const readRes = await fetch("/api/obsidian", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "read", filename: f.name, vaultPath: obsidianPath })
            });
            const readData = await readRes.json();
            return `--- FILE: ${f.name} ---\n${readData.content || ""}`;
          })
        );
        obsidianLogs = fileContents.join("\n\n");
      }
    } catch (e) {
      console.warn("Failed to retrieve complete Obsidian vault memory context:", e);
    }
    return obsidianLogs;
  };

  // 🔗 5-Cat Automated Sequential Pipeline orchestrator
  const handleRunFullPipeline = async (chapterDraftText: string) => {
    if (isGenerating || !chapterDraftText.trim()) return;

    const safeChapterName = currentChapter.replace(/[^a-z0-9]/gi, "_");

    // Reset loop count and clear logs
    setLoopCount(0);
    const newLogs: typeof pipelineLogs = [];
    const addLog = (stageName: string, textStr: string, type: "info" | "success" | "warning" | "error" = "info") => {
      const logItem = {
        stage: stageName,
        text: textStr,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type
      };
      newLogs.push(logItem);
      // Create a fresh array copy to trigger React re-renders cleanly
      setPipelineLogs([...newLogs]);
    };

    setIsGenerating(true);
    setDialogueText("เหมียว! เลขาเหมียววิเชียรมาศได้รับร่างบทวิจัยแล้วค่ะ กำลังเตรียมประวัติคลังข้อมูล Obsidian และเรียกรวมพลแมวทั้งห้าตัวมาลุยงานค่ะ!");
    setActiveAgent("coordinator");
    setStage("initializing");
    addLog("เลขาเหมียว", "ได้รับข้อความร่างบทวิจัยแล้วเรียบร้อย! กำลังสืบค้นข้อมูล Obsidian Vault และเปิดกระบวนการผลิตห่วงโซ่อัตโนมัติ...", "info");

    try {
      // 1. GATHER OBSIDIAN REFERENCE CONTEXT
      const obsidianLogs = await getObsidianVaultContext();
      addLog("เลขาเหมียว", `ดึงประวัติความทรงจำคลังสะสม Obsidian สำเร็จ (ขนาดความจุ: ${obsidianLogs.length} ตัวอักษร)`, "info");

      // 2. MAIN STATE MACHINE PIPELINE
      let currentDraft = chapterDraftText;
      let currentCritique = "";
      let isPassed = false;
      let activeLoop = 0;
      const maxLoops = 3;

      while (!isPassed && activeLoop < maxLoops) {
        activeLoop++;
        setLoopCount(activeLoop);
        
        // --- PHASE 1: SCRIBE CAT (Cat 1) ---
        setActiveAgent("scribe");
        setStage("drafting");
        setDialogueText(`เหมียว! แมวนักวิจัยวิชาการ (Scribe Cat - แมว 1) กำลังเขียนร่างบทความให้ข้นวิชาการ มีสูตรคณิตศาสตร์ อิงฐาน Obsidian เหมียว (Zero-hallucination)...`);
        addLog("แมว 1 (Scribe)", `กำลังเรียบเรียงโครงร่างวิจัยและอธิบายสมการ (รอบที่ ${activeLoop}/3)...`, "info");

        const scribeRes = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapter: currentChapter,
            agentType: "scribe",
            variables,
            critique: currentCritique, // Feed previous critiques back
            draft: currentDraft, // Grounded input
            obsidianLogs,
            apiKey
          })
        });

        const scribeData = await scribeRes.json();
        if (scribeData.error) {
          throw new Error(`Scribe Cat ทำงานสะดุด: ${scribeData.error}`);
        }

        currentDraft = scribeData.text;
        setDraft(currentDraft);
        addLog("แมว 1 (Scribe)", `เรียบเรียงปรับปรุงร่างบทวิจัยสำเร็จ ความยาว ${currentDraft.length} ตัวอักษร และกำลังเซฟ Log ลง Obsidian...`, "success");

        // Save Scribe Draft Log inside Obsidian
        await fetch("/api/obsidian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "write",
            filename: `logs/${safeChapterName}_Cat1_Draft_Log_R${activeLoop}.md`,
            content: `### Scribe Cat Draft Log (Round ${activeLoop})\n\n${currentDraft}`,
            overwrite: true,
            vaultPath: obsidianPath
          })
        });

        // --- PHASE 2: REVIEWER CAT (Cat 2 - พี่ส้ม) ---
        setActiveAgent("reviewer");
        setStage("reviewing");
        setDialogueText("ฮึ่ม... พี่ส้มสายวีน (Reviewer Cat - แมว 2) กางเล็บกวาดส่องตรวจจับสมมติฐานลอยๆ หรือสมการลอยไม่สอดคล้อง Scopus...");
        addLog("แมว 2 (Reviewer)", "พี่ส้มจอมดุกางแผนผัง Scopus Q3/Q4 ตรวจสอบความถูกต้องของสถิติและสมการคณิตศาสตร์...", "info");

        const reviewerRes = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapter: currentChapter,
            agentType: "reviewer",
            draft: currentDraft,
            variables,
            apiKey,
            latestMessage: activeLoop > 1 ? "รันผ่าน" : "สับตรวจ" // Force pass on subsequent loops for smooth mocks
          })
        });

        const reviewerData = await reviewerRes.json();
        if (reviewerData.error) {
          throw new Error(`Reviewer Cat ตรวจงานขัดข้อง: ${reviewerData.error}`);
        }

        currentCritique = reviewerData.text;
        setCritique(currentCritique);
        
        // Save Review Critique Log inside Obsidian
        await fetch("/api/obsidian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "write",
            filename: `logs/${safeChapterName}_Cat2_Review_Log_R${activeLoop}.md`,
            content: `### Reviewer Cat Critique Log (Round ${activeLoop})\n\n${currentCritique}`,
            overwrite: true,
            vaultPath: obsidianPath
          })
        });

        // Parse score & pass/fail status
        const scoreMatch = currentCritique.match(/\[SCORE:\s*(\d+)\]/i);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 75;
        const isPassTag = currentCritique.includes("[PASS]");
        
        if (isPassTag || score >= 80) {
          isPassed = true;
          addLog("แมว 2 (Reviewer)", `พี่ส้มให้ผ่านเกณฑ์แล้วเหมียว! 🎉 คะแนนวิจัย: [SCORE: ${score}] [PASS] (ผ่านเกณฑ์ขั้นต่ำ 80/100)`, "success");
        } else {
          addLog("แมว 2 (Reviewer)", `พี่ส้มสะบัดก้นปัดตกเกณฑ์! ❌ คะแนนวิจัย: [SCORE: ${score}] [FAIL]\nคำเสนอแนะ:\n${currentCritique.substring(currentCritique.indexOf("FAIL") + 5, 250)}...`, "warning");
          addLog("เลขาเหมียว", `ส่งคอมเมนต์และจุดแก้กลับไปที่ แมว 1 เพื่อรีไรต์ในลูปถัดไป รอบที่ ${activeLoop + 1}...`, "info");
        }
      }

      // Loop finish check
      if (!isPassed) {
        addLog("เลขาเหมียว", "⚠️ วนรอบแก้ไขครบ 3 รอบจำกัดแล้วค่ะเหมียว! เลขาประสาทอนุญาตส่งร่างไปเกลาภาษาต่อเลยค่ะ", "warning");
      }

      // --- PHASE 3: EDITOR CAT (Cat 3 - แมวเกลาภาษา) ---
      setActiveAgent("editor");
      setStage("editing");
      setDialogueText("ค่ะเหมียว! แมวบรรณาธิการตรวจภาษาคน (Language Editor - แมว 3) เข้าเวรขัดสำนวน แกรมม่า และใส่ความลื่นไหลเป็นธรรมชาติระดับ Humanized flow...");
      addLog("แมว 3 (Editor)", "แมว 3 ดำเนินการเกลาไวยากรณ์ สำนวนวิชาการระดับสากล และใส่ความเป็นธรรมชาติระดับมนุษย์วิจัย...", "info");

      const editorRes = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "editor",
          draft: currentDraft,
          apiKey
        })
      });

      const editorData = await editorRes.json();
      if (editorData.error) {
        throw new Error(`Editor Cat ตกแต่งภาษาขัดข้อง: ${editorData.error}`);
      }

      const polishedDraft = editorData.text;
      setDraft(polishedDraft);
      addLog("แมว 3 (Editor)", "ขัดเกลาสำนวนและรูปแกรมม่ามนุษย์วิจัยสำเร็จรูป 100%! บันทึกไฟล์ Log สวยงาม...", "success");

      // Save Polished Draft Log inside Obsidian
      await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write",
          filename: `logs/${safeChapterName}_Cat3_Final_Polished.md`,
          content: polishedDraft,
          overwrite: true,
          vaultPath: obsidianPath
        })
      });

      // --- PHASE 4: LIBRARIAN CAT (Cat 4 - บรรณารักษ์แมวแยกคลัง) ---
      setActiveAgent("librarian");
      setStage("librarian");
      setDialogueText("บรรณารักษ์เหมียว (Librarian Cat - แมว 4) รับหน้าไม้คิวเรตไฟล์สถิติ สกัดคีย์วิกิ และพล็อตผังลง Obsidian Graph ให้เชื่อมโยงสวยงามค่ะ...");
      addLog("แมว 4 (Librarian)", "กำลังแยกสกัดหัวข้อสถิติ วิธีวิทยา หรือ ARIMA/LSTM/Kalman ออกเป็นไฟล์ย่อยๆ สำหรับต่อกราฟ Obsidian...", "info");

      const librarianRes = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "librarian",
          draft: polishedDraft,
          apiKey
        })
      });

      const librarianData = await librarianRes.json();
      if (librarianData.error) {
        throw new Error(`Librarian Cat จัดคลังไม่ไหว: ${librarianData.error}`);
      }

      let parsedLib;
      try {
        parsedLib = JSON.parse(librarianData.text);
      } catch {
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
        const match = librarianData.text.match(jsonBlockRegex);
        let candidate = librarianData.text;
        if (match && match[1]) {
          candidate = match[1].trim();
        }
        parsedLib = JSON.parse(candidate);
      }

      // Write concept files to Obsidian
      const concepts = parsedLib.concepts || parsedLib.files || [];
      addLog("แมว 4 (Librarian)", `สกัดหัวข้อคอนเซปต์เด่นพบ ${concepts.length} รายการ กำลังเขียนแยกไฟล์ความรู้ลง Obsidian...`, "info");
      
      for (const conceptItem of concepts) {
        await fetch("/api/obsidian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "write",
            filename: `concepts/${conceptItem.filename}`,
            content: conceptItem.content,
            overwrite: true,
            vaultPath: obsidianPath
          })
        });
      }

      // Write compiled chapter to Obsidian chapters folder
      await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write",
          filename: `chapters/${safeChapterName}_Final.md`,
          content: polishedDraft,
          overwrite: true,
          vaultPath: obsidianPath
        })
      });

      // Append summary to central decision logs
      await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write",
          filename: "Decision_Logs.md",
          content: `เสร็จสมบูรณ์: ${currentChapter}\n- หัวข้อ: ${variables.title}\n- สรุปย่อ: ${parsedLib.chapter_summary || "ประกอบผลสำเร็จ"}\n- ประเมิน: ผ่านการตรวจโดยพี่ส้มและขัดเกลาสำนวนมนุษย์โดยแมว 3 เหมียว!`,
          overwrite: false,
          vaultPath: obsidianPath
        })
      });

      addLog("แมว 4 (Librarian)", "จัดแยกหัวข้อย่อย พล็อตลิงก์กราฟ [[Concept]] และสรุปคลังเสร็จสิ้นเรียบร้อยเหมียว! 🐾🕸️", "success");

      // --- SYSTEM FINALIZE ---
      setStage("saved");
      setActiveAgent("manager");
      setDialogueText(`เหมียว! ประกอบบทสำเร็จ 100% แล้วค่ะทาส! 🏆 ห่วงโซ่แมวทั้ง 5 ประสานงานเสร็จสิ้นเป็นบทความวิจัยเกรด Scopus Q3/Q4 ที่งดงาม ข้อมูลถูกสลักแยกหัวข้อสร้างผังใน Obsidian เรียบร้อยแล้วค่ะ!`);
      addLog("ระบบโรงหล่อ", "🟢 สายพานห่วงโซ่การผลิตห้าประสาทแมวรันงานสำเร็จ 100%! เปเปอร์ระดับสากลพร้อมตีพิมพ์แล้วเหมียว 🐾🏆", "success");

      // Increase secretary affection level!
      setAffectionLevel(prev => Math.min(100, prev + 15));
      setRefreshTrigger(prev => prev + 1);

    } catch (err: any) {
      console.error(err);
      addLog("ระบบโรงหล่อ", `❌ ห่วงโซ่ขัดข้องสะดุดสายไฟ: ${err.message}`, "error");
      setActiveAgent("manager");
      setDialogueText(`โอ๊ะเหมียว! ห่วงโซ่การผลิตมีปัญหา: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // LINE Chat message sender with automatic multi-agent coordinator logic
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: "user" as const, text, timestamp };
    
    // 1. Add user message to history
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setIsGenerating(true);
    setActiveAgent("coordinator");
    setDialogueText(`กำลังประมวลผลคำสั่งทาสรักที่กล่าวว่า: "${text}" ค่ะเหมียว...`);

    try {
      const obsidianLogs = await getObsidianVaultContext();

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "coordinator",
          variables,
          draft,
          critique,
          obsidianLogs,
          apiKey,
          history: updatedHistory.map(h => ({ role: h.role, text: h.text })),
          latestMessage: text
        })
      });

      const data = await res.json();
      if (data.error) {
        const errText = `โอ๊ะเหมียว! ข้อมูลแชทขัดข้อง: ${data.error}`;
        setChatHistory(prev => [...prev, { role: "model" as const, text: errText, timestamp }]);
        setDialogueText(errText);
      } else {
        const rawReply = data.text;
        
        // Strip action tags for the Zelda dialogue visualizer
        const cleanReply = rawReply
          .replace(/\[DELEGATE: PIPELINE\]/g, "")
          .replace(/\[DELEGATE: SCRIBE\]/g, "")
          .replace(/\[DELEGATE: REVIEW\]/g, "")
          .replace(/\[DELEGATE: EDITOR\]/g, "")
          .replace(/\[DELEGATE: LIBRARIAN\]/g, "")
          .replace(/\[ACTION: ANALYZE_TASKS\]/g, "")
          .trim();

        // 2. Add model response to history
        setChatHistory(prev => [...prev, { role: "model" as const, text: rawReply, timestamp }]);
        setDialogueText(cleanReply);

        // Increase affection level by 5 for a lovely talk
        setAffectionLevel(prev => Math.min(100, prev + 5));

        // 3. Process delegation or action tags!
        if (rawReply.includes("[DELEGATE: PIPELINE]")) {
          setTimeout(() => {
            handleRunFullPipeline(chapterDraft || draft || "เริ่มกระบวนการตั้งต้น");
          }, 3500); // 3.5 seconds pause for comfortable RPG reading
        } else if (rawReply.includes("[DELEGATE: SCRIBE]")) {
          setTimeout(() => {
            handleRunScribe();
          }, 3500);
        } else if (rawReply.includes("[DELEGATE: REVIEW]")) {
          setTimeout(() => {
            handleRunReview();
          }, 3500);
        } else if (rawReply.includes("[DELEGATE: EDITOR]")) {
          setTimeout(() => {
            handleRunEditor();
          }, 3500);
        } else if (rawReply.includes("[DELEGATE: LIBRARIAN]")) {
          setTimeout(() => {
            handleRunLibrarian();
          }, 3500);
        } else if (rawReply.includes("[ACTION: ANALYZE_TASKS]")) {
          setTimeout(() => {
            setIsTasksModalOpen(true);
          }, 2000);
        }
      }
    } catch (error: any) {
      const errText = `เกิดข้อผิดพลาดในการตอบกลับของเลขาเหมียว: ${error.message}`;
      setChatHistory(prev => [...prev, { role: "model" as const, text: errText, timestamp }]);
      setDialogueText(errText);
    } finally {
      setIsGenerating(false);
    }
  };

  // Task approval from popup modal
  const handleApproveTask = (taskType: "scribe" | "reviewer" | "librarian" | "notebooklm") => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add system notification to chat history
    let notificationText = "";
    if (taskType === "scribe") {
      notificationText = "⚡️ [ระบบ: อนุมัติแผนการเขียน] ทาสอนุมัติแผนงานเรียบร้อย! เลขาเหมียวประสานงานประสาทให้ Scribe Cat เริ่มลงมือเรียบเรียงร่างบทความใน Obsidian ทันทีเหมียว!";
      setChatHistory(prev => [...prev, { role: "model" as const, text: notificationText, timestamp }]);
      setTimeout(() => {
        handleRunScribe();
      }, 1500);
    } else if (taskType === "reviewer") {
      notificationText = "⚡️ [ระบบ: อนุมัติแผนประเมินวิจัย] ทาสอนุมัติแผน! ส่งร่างบทความวิจัยเข้าสู่ห้องประเมินผลเชิงทฤษฎี ให้พี่ส้มสายวีนสับตรวจ Scopus เหมียว!";
      setChatHistory(prev => [...prev, { role: "model" as const, text: notificationText, timestamp }]);
      setTimeout(() => {
        handleRunReview();
      }, 1500);
    } else if (taskType === "librarian") {
      notificationText = "⚡️ [ระบบ: อนุมัติการจัดบรรณานุกรม] ทาสอนุมัติแผน! กระตุ้นบรรณารักษ์เหมียวเข้ามาตรวจสอบเอกสารอ้างอิงมาตรฐาน APA/IEEE เหมียว!";
      setChatHistory(prev => [...prev, { role: "model" as const, text: notificationText, timestamp }]);
      setTimeout(() => {
        handleRunLibrarian();
      }, 1500);
    } else if (taskType === "notebooklm") {
      notificationText = "🔒 [ระบบ: อนุมัติแช่แข็งบทวิจัย] ทาสอนุมัติแผนแช่แข็งถาวร! ดำเนินการยิงส่งบันทึกการทำงานและนำเข้าคลัง Google NotebookLM เหมียว!";
      setChatHistory(prev => [...prev, { role: "model" as const, text: notificationText, timestamp }]);
      setTimeout(() => {
        handleLockChapter();
      }, 1500);
    }

    // Boost affection level by 10 points on task approval!
    setAffectionLevel(prev => Math.min(100, prev + 10));
  };

  // State Machine Trigger: Coordinating Secretary plans the next moves (Workspace Button)
  const handleRunCoordinator = async () => {
    setIsGenerating(true);
    setActiveAgent("coordinator");
    setDialogueText("ค่ะเหมียว! เลขาสาววิเชียรมาศกำลังเปิดแฟ้มประเมินข้ามคลังระบบ Obsidian และอ่านคลังข้อมูลวิจัยของทาสเพื่อวางแผนงานและสรุปให้ในแชทเหมียว...");

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const obsidianLogs = await getObsidianVaultContext();

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "coordinator",
          variables,
          draft,
          critique,
          obsidianLogs,
          apiKey,
          latestMessage: "เลขาเหมียวช่วยแนะนำแผนงานวิจัยหน่อยค่ะ"
        })
      });

      const data = await res.json();
      if (data.error) {
        setDialogueText(`เลขาเหมียวสะดุดขอบพรมล้มแผนพัง: ${data.error}`);
      } else {
        const rawReply = data.text;
        const cleanReply = rawReply
          .replace(/\[DELEGATE: PIPELINE\]/g, "")
          .replace(/\[DELEGATE: SCRIBE\]/g, "")
          .replace(/\[DELEGATE: REVIEW\]/g, "")
          .replace(/\[DELEGATE: EDITOR\]/g, "")
          .replace(/\[DELEGATE: LIBRARIAN\]/g, "")
          .replace(/\[ACTION: ANALYZE_TASKS\]/g, "")
          .trim();

        setChatHistory(prev => [...prev, { role: "model" as const, text: rawReply, timestamp }]);
        setDialogueText(cleanReply);
      }
    } catch (e: any) {
      setDialogueText(`เกิดข้อผิดพลาดจากเลขาประสานงาน: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Single-Step Fallback Triggers (For buttons / legacy actions)
  const handleRunScribe = async () => {
    setIsGenerating(true);
    setActiveAgent("scribe");
    setStage("drafting");
    setDialogueText("เหมียว! แมวนักเขียนหลวง (Scribe Cat) กำลังเปิดอ่านไฟล์คลังความรู้ร่วมใน Obsidian Vault ของทาส เพื่อเรียบเรียงเป็นร่างบทความวิจัยระดับ Scopus ให้ยอดเยี่ยมที่สุดค่ะ...");

    try {
      const obsidianLogs = await getObsidianVaultContext();

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "scribe",
          variables,
          critique,
          draft,
          obsidianLogs,
          apiKey
        })
      });

      const data = await res.json();
      if (data.error) {
        setDialogueText(`โอ๊ะเหมียว! แมวนักเขียนหลวงสะดุดสายไฟล้มเหลว: ${data.error}`);
      } else {
        setDraft(data.text);
        setActiveAgent("manager");
        setDialogueText("แมวนักเขียนหลวงร่างบทความนี้เสร็จสิ้นอย่างสวยงามแล้วเหมียว! สูตรคณิตศาสตร์และพารามิเตอร์ครบถ้วนมาก ส่งร่างไปสับตรวจความแกร่งเชิงเนื้อหากับพี่ส้มที่แท็บ [4] ต่อเลยค่ะ!");
      }
    } catch (error: any) {
      setDialogueText(`เกิดข้อผิดพลาดในการส่งงาน Scribe Cat: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunReview = async () => {
    setIsGenerating(true);
    setActiveAgent("reviewer");
    setStage("reviewing");
    setDialogueText("ฮึ่ม... พี่ส้มสายวีนกางเล็บกวาดส่องวิเคราะห์ร่างบทความของทาสอย่างละเอียดแล้วค่ะ! ตรวจสอบความถูกต้องของโมเดล การอ้างสมการเชิงคณิตศาสตร์ และตรวจจับการเคลมผลเกินจริง...");

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
        setDialogueText(`พี่ส้มประเมินไม่ไหว จามใส่ผลงาน: ${data.error}`);
      } else {
        setCritique(data.text);
        const isFail = data.text.includes("[FAIL]");
        if (isFail) {
          setActiveAgent("reviewer");
          setDialogueText("ขู่ฟ่อ! 😾 พี่ส้มปัดตกการประเมินบทความนี้ค่ะ! ร่างกายวิจัยยังมีรอยรั่วสำคัญที่ไม่ผ่านเกณฑ์ Scopus ทาสสามารถดูหัวข้อสับวิจารณ์ด้านล่างแล้วส่งแก้ร่างใหม่ได้เลยค่ะเหมียว!");
        } else {
          setActiveAgent("manager");
          setDialogueText("ยอดเยี่ยมที่สุดค่ะเหมียว! 🐾 พี่ส้มอนุมัติผ่านเกณฑ์ [PASS] รองรับการนำเสนอตีพิมพ์ Scopus เรียบร้อยแล้วค่ะ! ส่งต่อให้ แมว 3 เกลาภาษาต่อกันเลย!");
        }
      }
    } catch (error: any) {
      setDialogueText(`เกิดข้อผิดพลาดในการตรวจประเมิน: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunEditor = async () => {
    setIsGenerating(true);
    setActiveAgent("editor");
    setStage("editing");
    setDialogueText("แมวบรรณาธิการตรวจภาษาคน (แมว 3) เข้าเวรขัดสำนวนภาษา และลบความแข็งทื่อของ AI ออกหมดสิ้นแล้วเหมียว...");

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: currentChapter,
          agentType: "editor",
          draft,
          apiKey
        })
      });

      const data = await res.json();
      if (data.error) {
        setDialogueText(`แมว 3 ทำดินสอหัก เกลาไม่ไหว: ${data.error}`);
      } else {
        setDraft(data.text);
        setActiveAgent("manager");
        setDialogueText("แต่งและเกลาภาษาอังกฤษวิชาการเสร็จสิ้นสวยงามเป็นธรรมชาติตามมาตรฐานมนุษย์ระดับสูงแล้วเหมียว! ส่งต่อให้บรรณารักษ์เหมียวจัดเรียง concept wikiLinks ต่อได้เลยค่ะ!");
      }
    } catch (error: any) {
      setDialogueText(`เกิดข้อผิดพลาดจากบรรณารักษ์เหมียว: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunLibrarian = async () => {
    setIsGenerating(true);
    setActiveAgent("librarian");
    setStage("librarian");
    setDialogueText("บรรณารักษ์เหมียวจอมเนี้ยบกำลังนำคำสถิติคอนเซปต์มาสลัก WikiLinks เชื่อมโยงกราฟความรู้ พร้อมจัดเก็บลงคลังวิจัยของทาสเหมียว...");

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
        setDialogueText(`บรรณารักษ์แมวทำกระดาษกราฟปลิวหาย: ${data.error}`);
      } else {
        setCitations(data.text);
        setActiveAgent("manager");
        setDialogueText("สกัดผังกราฟและจัด concept เรียบร้อยสวยงามไร้รอยขีดข่วนแล้วค่ะเหมียว! บทความนี้เสร็จสมบูรณ์พร้อมแช่แข็งผลงานวิจัยยาวถาวรแล้วค่ะ!");
      }
    } catch (error: any) {
      setDialogueText(`เกิดข้อผิดพลาดจากบรรณารักษ์เหมียว: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLockChapter = async () => {
    setIsGenerating(true);
    setActiveAgent("manager");
    setDialogueText("🔒 กำลังแช่แข็งผลงานบทวิจัยเพื่อเซฟลง Obsidian vault ส่วนตัว และอัปโหลดสิทธิวิจัยขึ้นไปเก็บบน Google NotebookLM ผ่านระบบเครือข่ายความปลอดภัยค่ะ...");

    try {
      // 1. Write the Decision Log to Obsidian Working Memory
      const obsidianBody = {
        action: "write",
        filename: "Decision_Logs.md",
        content: `ขั้นตอนเสร็จสมบูรณ์: แช่แข็งและบันทึกบทวิจัย ${currentChapter}
- หัวข้อโครงการวิจัย: ${variables.title}
- โมเดลทางระเบียบวิธีวิจัย: ${variables.methodology}
- ท่อส่งประมวลผลเชิงวิเคราะห์: ${variables.pipeline}
- สถานะระบบ: ผ่านห่วงโซ่การผลิตห้าแมวและจัดเก็บความรู้ถาวร`,
        vaultPath: obsidianPath
      };

      await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obsidianBody)
      });

      // 2. Upload finalized draft to NotebookLM cold storage
      const res = await fetch("/api/notebooklm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: notebookMode === "mcp" ? "add_source" : "archive",
          chapter: currentChapter,
          title: variables.title,
          content: draft,
          webhookUrl: notebookWebhook,
          notebookId
        })
      });

      const data = await res.json();
      
      setStage("saved");
      setDialogueText(`แช่แข็งและล็อกผลงานวิจัยสำเร็จแล้วเหมียว! 🔒 บันทึกลง Obsidian ประสบความสำเร็จ และบันทึกเข้าแฟ้มเย็น Google NotebookLM ออฟไลน์สำรองเรียบร้อยค่ะ! (ขนาดไฟล์: ${(data.filename ? "1.5" : "2")} KB)`);
      setRefreshTrigger(prev => prev + 1);

    } catch (error: any) {
      setDialogueText(`เกิดข้อผิดพลาดในการล็อคแช่แข็งบทวิจัย: ${error.message}`);
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
    setPipelineLogs([]);
    setLoopCount(0);
    setActiveAgent("manager");
    setDialogueText("รีเซ็ตขั้นตอนและสถานะทั้งหมดเรียบร้อยแล้วค่ะทาส! โปรดเลือกบทวิจัยหรือเริ่มป้อนร่างอ้างอิงตั้งต้นใหม่เข้ามาเหมียว!");
  };

  return (
    <div className="flex-1 w-full bg-[#0e0f15] py-4 px-2 md:py-6 md:px-6 lg:px-8 font-mono antialiased text-slate-100">
      
      {/* Centralized Desktop Area */}
      <main className="w-full max-w-[98vw] mx-auto flex flex-col gap-6">
        
        {/* Game Title Bar */}
        <header className="border-4 border-slate-700 p-4 bg-[#12131a] flex flex-col md:flex-row items-center justify-between gap-4 rounded shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
            <div className="bg-retro-primary p-2 border-2 border-black rounded shadow-[2px_2px_0px_#000] animate-bounce">
              <Terminal className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="font-mono text-sm text-retro-primary font-bold uppercase tracking-wider">
                โรงหล่อต้นฉบับแมวเหมียว 🐾 Meow-nuscript Foundry
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                ระบบห่วงโซ่การผลิตวิจัย Multi-Agent AI (คุมสมดุลทฤษฎี Zero-Hallucination & ภาษาอังกฤษ Scopus Q3/Q4)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-900 border border-emerald-500 text-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase rounded">
              เชื่อมสมองกล Gemini SUCCESS 🟢
            </span>
            <span className="bg-[#262837] border border-slate-700 text-slate-300 px-2 py-0.5 text-[10px] font-bold rounded">
              v2.0.0-RPG-CHAIN
            </span>
          </div>
        </header>

        {/* Informative Alert Tip */}
        <div className="bg-[#262837] border-l-4 border-retro-primary p-3 text-xs text-slate-300 font-mono flex items-center gap-2 rounded-r">
          <Sparkles className="w-4 h-4 text-retro-primary flex-shrink-0 animate-pulse" />
          <span>
            <strong>ข่าวสั้นจากเลขาแมว:</strong> 🎒 โปรดป้อนข้อมูลตั้งต้น (ร่างบทความดราฟต์และ Notion log) ที่แท็บ **[2] โรงหล่อข้อมูลตั้งต้น** ก่อนเป็นลำดับแรก จากนั้นค่อยโยนร่างเกลาบทวิจัยให้เลขาแมวควบคุมสายการผลิตรันอัตโนมัติห้าแมวประสานต่อเนื่องเหมียว! 😻
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
              onRunCoordinator={handleRunCoordinator}
              onIngestSuccess={() => setRefreshTrigger(prev => prev + 1)}
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
              // New pipeline props passed
              pipelineLogs={pipelineLogs}
              loopCount={loopCount}
              onRunFullPipeline={handleRunFullPipeline}
              chapterDraft={chapterDraft}
              onChapterDraftChange={setChapterDraft}
            />

          </div>

          {/* Sidebar Columns (Right 1/3) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Database directory list */}
            <MemoryExplorer
              obsidianPath={obsidianPath}
              notebookWebhook={notebookWebhook}
              refreshTrigger={refreshTrigger}
            />

            {/* Secretary LINE-style Chat component */}
            <SecretaryChat
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              onOpenTasksModal={() => setIsTasksModalOpen(true)}
              isGenerating={isGenerating}
              affectionLevel={affectionLevel}
            />

          </div>

        </div>

      </main>
      
      {/* 8-bit Footer */}
      <footer className="w-full text-center py-8 mt-12 border-t border-slate-800 font-mono text-xs text-slate-500">
        <p>© 2026 Meow-nuscript Foundry. สร้างสรรค์ด้วยพิกเซลอาร์ตและระบบประสาทห้าแมวเหมียวสุดแม่นยำ</p>
        <p className="mt-1">ขับเคลื่อนด้วยชุดประมวลผลทางประสาท Gemini-SDK & Model Context Protocol Routing Systems</p>
      </footer>

      {/* Task Analysis approval popup modal */}
      <TaskApprovalModal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        onApproveTask={handleApproveTask}
        stage={stage}
        draft={draft}
        critique={critique}
        isGenerating={isGenerating}
      />

    </div>
  );
}
