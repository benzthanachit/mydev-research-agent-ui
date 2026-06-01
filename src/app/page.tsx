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
  const [stage, setStage] = useState<"select" | "drafting" | "reviewing" | "librarian" | "saved">("select");
  
  const [variables, setVariables] = useState({
    title: "สถาปัตยกรรมโมเดลผสมพยากรณ์สินค้าคงคลัง (Hybrid Inventory Forecasting)",
    methodology: "การบูรณาการระบบประสาท LSTM ร่วมกับแบบจำลองอนุกรมเวลา ARIMA เชิงคณิตศาสตร์",
    pipeline: "Data collection -> Kalman noise reduction -> ARIMA linear modeling -> Residual extraction -> LSTM neural training -> Dynamic aggregation."
  });

  const [draft, setDraft] = useState("");
  const [critique, setCritique] = useState("");
  const [citations, setCitations] = useState("");
  
  // UI Display States
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAgent, setActiveAgent] = useState<"none" | "manager" | "scribe" | "reviewer" | "librarian" | "coordinator">("manager");
  const [dialogueText, setDialogueText] = useState("ยินดีต้อนรับสู่โรงหล่อต้นฉบับแมวเหมียว 🐾 ทาสรักวิชาการสามารถเลือกบทที่ต้องการพัฒนาบน Workbench แท็บป้อนพารามิเตอร์ หรือแชทโต้ตอบวางแผนงานกับเลขาเหมียวทางด้านขวาได้เลยนะคะ!");
  
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
            try {
              const readRes = await fetch("/api/obsidian", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "read", filename: f.name, vaultPath: obsidianPath })
              });
              const readData = await readRes.json();
              if (readData.success) {
                return `### [เอกสารคลังความรู้: ${f.name}]\n${readData.content}`;
              }
            } catch (e) {}
            return "";
          })
        );
        obsidianLogs = fileContents.filter(Boolean).join("\n\n");
      }
    } catch (err) {
      console.warn("Could not load Obsidian files for context, proceeding without it.");
    }
    return obsidianLogs;
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
          .replace(/\[DELEGATE: SCRIBE\]/g, "")
          .replace(/\[DELEGATE: REVIEW\]/g, "")
          .replace(/\[DELEGATE: LIBRARIAN\]/g, "")
          .replace(/\[ACTION: ANALYZE_TASKS\]/g, "")
          .trim();

        // 2. Add model response to history
        setChatHistory(prev => [...prev, { role: "model" as const, text: rawReply, timestamp }]);
        setDialogueText(cleanReply);

        // Increase affection level by 5 for a lovely talk
        setAffectionLevel(prev => Math.min(100, prev + 5));

        // 3. Process delegation or action tags!
        if (rawReply.includes("[DELEGATE: SCRIBE]")) {
          setTimeout(() => {
            handleRunScribe();
          }, 3500); // 3.5 seconds pause for comfortable RPG reading
        } else if (rawReply.includes("[DELEGATE: REVIEW]")) {
          setTimeout(() => {
            handleRunReview();
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
    const userMsg = { role: "user" as const, text: "เลขาเหมียวช่วยสแกนข้อมูลและวิเคราะห์แผนงานถัดไปให้หน่อยค่ะ", timestamp };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);

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
          latestMessage: "เลขาเหมียวช่วยสแกนข้อมูลและวิเคราะห์แผนงานถัดไปให้หน่อยค่ะ"
        })
      });

      const data = await res.json();
      if (data.error) {
        setDialogueText(`โอ๊ะเหมียว! ข้อมูลเชื่อมต่อเลขาติดขัด: ${data.error}`);
      } else {
        const rawReply = data.text;
        const cleanReply = rawReply
          .replace(/\[DELEGATE: SCRIBE\]/g, "")
          .replace(/\[DELEGATE: REVIEW\]/g, "")
          .replace(/\[DELEGATE: LIBRARIAN\]/g, "")
          .replace(/\[ACTION: ANALYZE_TASKS\]/g, "")
          .trim();

        setChatHistory(prev => [...prev, { role: "model" as const, text: rawReply, timestamp }]);
        setDialogueText(cleanReply);

        // Auto trigger analyze if response matches
        if (rawReply.includes("[ACTION: ANALYZE_TASKS]")) {
          setTimeout(() => {
            setIsTasksModalOpen(true);
          }, 1800);
        }
      }
    } catch (error: any) {
      setDialogueText(`เกิดข้อผิดพลาดในการทำงานของเลขาเหมียว: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // State Machine Trigger 1: Scribe Cat Drafts
  const handleRunScribe = async () => {
    setIsGenerating(true);
    
    // Immersive Multi-Agent delegation transition if triggered from coordinator
    if (activeAgent === "coordinator") {
      setDialogueText("รับทราบคำสั่งจ่ายงานค่ะเหมียว! เลขาสาวสลับบทบาทส่งข้อมูลองค์ความรู้เข้าสู่โต๊ะเขียนร่างวิจัย... ส่งต่อหน้าที่หลักให้ 'แมวนักเขียนหลวง (Scribe Cat)' ลงมือจัดเรียงพารามิเตอร์ทันทีค่ะเหมียว! ⚡️");
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
    
    setActiveAgent("scribe");
    setStage("drafting");
    setDialogueText("เหมียว! แมวนักเขียนหลวง (Scribe Cat) กำลังเปิดอ่านไฟล์คลังความรู้ร่วมใน Obsidian Vault ของทาส เพื่อเรียบเรียงเป็นร่างบทความวิจัยระดับ Scopus ให้ยอดเยี่ยมที่สุดค่ะ...");

    try {
      const obsidianLogs = await getObsidianVaultContext();

      // Call Gemini multi-agent endpoint
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
        setDialogueText(`โอ๊ะเหมียว! แมวนักเขียนสะดุดสายไฟพังทลาย: ${data.error}`);
      } else {
        setDraft(data.text);
        setActiveAgent("manager");
        setDialogueText("แมวนักเขียนหลวงร่างบทความนี้เสร็จสิ้นอย่างสง่างามแล้วเหมียว! สูตรคณิตศาสตร์และพารามิเตอร์ครบถ้วนมาก ลองกดสลับแท็บ [2] เพื่อเกลา หรือส่งร่างไปสับตรวจกับพี่ส้มที่แท็บ [3] กันเถอะค่ะ!");
      }
    } catch (error: any) {
      setDialogueText(`เกิดข้อผิดพลาดในการส่งงาน Scribe Cat: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // State Machine Trigger 2: Grumpy Reviewer critiques
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
          setDialogueText("ขู่ฟ่อ! 😾 พี่ส้มปัดตกการประเมินบทความนี้ค่ะ! ร่างกายวิจัยยังมีรอยรั่วสำคัญที่ไม่ผ่านเกณฑ์ Scopus ทาสสามารถดูหัวข้อสับวิจารณ์ด้านล่างแล้วกดแก้ร่างใหม่ได้เลยค่ะเหมียว!");
        } else {
          setActiveAgent("manager");
          setDialogueText("ยอดเยี่ยมที่สุดค่ะเหมียว! 🐾 พี่ส้มอนุมัติผ่านเกณฑ์ [PASS] รองรับการนำเสนอตีพิมพ์ Scopus Q3/Q4 เรียบร้อยแล้วค่ะ! ส่งร่างไปให้บรรณารักษ์เหมียวจัดเรียงฟอร์แมตต่อเลย!");
        }
      }
    } catch (error: any) {
      setDialogueText(`เกิดข้อผิดพลาดในการตรวจประเมิน: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // State Machine Trigger 3: Librarian citations compliant check
  const handleRunLibrarian = async () => {
    setIsGenerating(true);
    setActiveAgent("librarian");
    setStage("librarian");
    setDialogueText("บรรณารักษ์เหมียวจอมเนี้ยบกำลังนำบรรณานุกรมขึ้นหิ้งเรียงฟอร์แมตแบบ APA/IEEE เพื่อจัดเก็บเข้าฐานข้อมูลวิจัยของทาสอย่างสวยงามไร้รอยต่อเหมียว...");

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
        setDialogueText(`บรรณารักษ์ทำสมุดหนังสืออ้างอิงหล่นกระจาย: ${data.error}`);
      } else {
        setCitations(data.text);
        setActiveAgent("manager");
        setDialogueText("จัดวางและเทียบอ้างอิงเสร็จเรียบร้อยไร้รอยขีดข่วนแล้วค่ะเหมียว! บทความนี้ผ่านเกณฑ์เกียรติยศสูงสุด พร้อมแช่แข็งผลงานส่งออกเข้าคลังเก็บแช่แข็งถาวรแล้วค่ะ!");
      }
    } catch (error: any) {
      setDialogueText(`เกิดข้อผิดพลาดจากบรรณารักษ์เหมียว: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // State Machine Trigger 4: Lock & save finalized chapter
  const handleLockChapter = async () => {
    setIsGenerating(true);
    setActiveAgent("manager");
    setDialogueText("🔒 กำลังแช่แข็งผลงานบทวิจัยเพื่อเซฟลง Obsidianvault ส่วนตัว และอัพโหลดสิทธิวิจัยขึ้นไปเก็บบน Google NotebookLM ผ่านระบบเครือข่ายความปลอดภัยค่ะ...");

    try {
      // 1. Write the Decision Log to Obsidian Working Memory
      const obsidianBody = {
        action: "write",
        filename: "Decision_Logs.md",
        content: `ขั้นตอนเสร็จสมบูรณ์: แช่แข็งและบันทึกบทวิจัย ${currentChapter}
- หัวข้อโครงการวิจัย: ${variables.title}
- โมเดลทางระเบียบวิธีวิจัย: ${variables.methodology}
- ท่อส่งประมวลผลเชิงวิเคราะห์: ${variables.pipeline}
- สถานะระบบ: ผ่านการประเมินและจัดเก็บความรู้ถาวร`,
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
        setDialogueText("🤖 กำลังรันโมเดลระบบประสาท MCP 'add_source' เพื่อดึงข้อมูลบทความยัดเข้าไปใน Google NotebookLM โดยตรงผ่าน Chrome เหมียว...");
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
          setDialogueText(`🔒 นำส่งฐานคลังความรู้ MCP สำเร็จเสร็จสิ้น! ตอนที่ '${currentChapter}' ถูกผนวกรวมเข้าสู่สารบบ Google NotebookLM เรียบร้อยแล้วค่ะทาสรัก!`);
        } else {
          setDialogueText(`🐾 ปิดงานอย่างสมบูรณ์แบบ! ตอนที่ '${currentChapter}' ถูกแช่แข็งถาวรเข้าฐานแล้ว ทาสสามารถเปลี่ยนไปลุยในบทถัดไปต่อได้เลยนะคะเหมียว!`);
        }
        // Increment trigger to refresh MemoryExplorer lists immediately
        setRefreshTrigger(prev => prev + 1);
      } else {
        setDialogueText(`บันทึกลง Obsidian ลำดับโครงงานวิจัยเรียบร้อย แต่เกิดปัญหาขณะอัพโหลดเข้า NotebookLM: ${notebookData.error || "ตรวจสอบการตั้งค่าอีกครั้งเหมียว"}`);
      }

    } catch (error: any) {
      setDialogueText(`เกิดข้อผิดพลาดขณะส่งบันทึกแช่แข็งงานวิจัย: ${error.message}`);
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
    setDialogueText("รีเซ็ตขั้นตอนและสถานะทั้งหมดเรียบร้อยแล้วค่ะทาส! โปรดเลือกบทวิจัยหรือเริ่มเขียนความรู้ใหม่เข้ามาเพื่อปูเส้นทางพัฒนาโมเดลใหม่กันเถอะเหมียว!");
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
                โรงหล่อต้นฉบับแมวเหมียว 🐾 Meow-nuscript Foundry
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                ระบบผู้ประสาทงานวิจัย Multi-Agent AI แนว RPG เรโทรยุค 90s (มุ่งเน้น Scopus Q3/Q4)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-900 border border-emerald-500 text-emerald-400 px-2 py-0.5 text-[10px] font-press-start font-bold uppercase">
              เชื่อมสมองกล Gemini-SDK สำเร็จ 🟢
            </span>
            <span className="bg-retro-panel-light border border-retro-border text-slate-300 px-2 py-0.5 text-[10px] font-press-start font-bold">
              v1.0.0-RPG-TH
            </span>
          </div>
        </header>

        {/* Informative Alert Tip */}
        <div className="bg-retro-panel-light border-l-4 border-retro-primary p-3 text-xs text-slate-300 font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-retro-primary flex-shrink-0 animate-pulse" />
          <span>
            <strong>ข้อแนะนำจากเลขาเหมียว:</strong> พิมพ์คุยและสั่งงานเลขาเหมียวในช่องแชทไลน์สีหวานทางด้านขวา หรือกดวิเคราะห์แผนงานเพื่อให้เลขาแมวจ่ายงานให้เพื่อนๆ ทำการวิจัยโดยอัตโนมัติเหมียว! 😻
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
      <footer className="w-full text-center py-8 mt-12 border-t border-retro-border/20 font-mono text-xs text-slate-500">
        <p>© 2026 Meow-nuscript Foundry. สร้างสรรค์ด้วยพิกเซลอาร์ตและระบบประสาท AI สายเหมียวสุดแม่นยำ</p>
        <p className="mt-1">ขับเคลื่อนด้วยชุดประมวลผลทางประสาท Gemini API & Model Context Protocol Routing Systems</p>
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
