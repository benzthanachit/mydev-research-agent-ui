"use client";

import React, { useState, useEffect, useRef } from "react";
import { Brain, Send, X, Trash2, Loader2, AlertCircle, Plus, MessageSquare, Menu, ChevronLeft, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: string;
}

interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

interface ObsidianBrainChatProps {
  obsidianPath: string;
  apiKey: string;
}

export default function ObsidianBrainChat({ obsidianPath, apiKey }: ObsidianBrainChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting = `สวัสดีค่ะผู้วิจัย! ยินดีต้อนรับสู่ **"ระบบประสาทสมองกลที่สอง" (Obsidian Second Brain Assistant)** 🧠✨\n\nฉันเฝ้าวิเคราะห์ห้องสมุดวิจัย Obsidian ของทาสอยู่ตลอดเวลา ต้องการให้ฉันช่วยค้นหาทฤษฎี เชื่อมโยงตัวแปรผลลัพธ์ หรืออธิบายสถิติจากไฟล์ความรู้ที่เราจดบันทึกไว้ในคลังทั้งหมดเรื่องใด สอบถามเข้ามาได้เลยนะคะเหมียว!`;

  // Load threads from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedThreads = localStorage.getItem("meow_second_brain_threads");
      const savedActiveId = localStorage.getItem("meow_second_brain_active_thread");
      
      let loadedThreads: ChatThread[] = [];
      
      if (savedThreads) {
        try {
          loadedThreads = JSON.parse(savedThreads);
        } catch (e) {
          console.error("Failed to parse saved Second Brain threads:", e);
        }
      }

      if (loadedThreads.length === 0) {
        // Create a default initial thread
        const defaultId = `thread_${Date.now()}`;
        const defaultThread: ChatThread = {
          id: defaultId,
          title: "บทแนะนำสมองที่สอง 🧠",
          messages: [
            {
              role: "model",
              text: initialGreeting,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
          ],
          createdAt: new Date().toISOString()
        };
        loadedThreads = [defaultThread];
        localStorage.setItem("meow_second_brain_threads", JSON.stringify(loadedThreads));
        localStorage.setItem("meow_second_brain_active_thread", defaultId);
        setActiveThreadId(defaultId);
      } else {
        const activeId = savedActiveId && loadedThreads.some(t => t.id === savedActiveId)
          ? savedActiveId
          : loadedThreads[0].id;
        setActiveThreadId(activeId);
      }
      
      setThreads(loadedThreads);
    }
  }, []);

  // Save threads to state and localStorage
  const saveAllThreads = (updatedThreads: ChatThread[]) => {
    setThreads(updatedThreads);
    localStorage.setItem("meow_second_brain_threads", JSON.stringify(updatedThreads));
  };

  // Find active thread helper
  const activeThread = threads.find(t => t.id === activeThreadId);

  // Scroll to bottom helper
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [activeThread?.messages, isOpen, isDrawerOpen]);

  // Create a new empty chat thread
  const handleCreateNewThread = () => {
    const newId = `thread_${Date.now()}`;
    const newThread: ChatThread = {
      id: newId,
      title: "บทสนทนาใหม่ 🐾",
      messages: [
        {
          role: "model",
          text: `เริ่มกระบวนการแชทบทสนทนาขนานใหม่แล้วค่ะทาส!\n\n${initialGreeting}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ],
      createdAt: new Date().toISOString()
    };
    
    const updatedThreads = [newThread, ...threads];
    saveAllThreads(updatedThreads);
    setActiveThreadId(newId);
    localStorage.setItem("meow_second_brain_active_thread", newId);
    setIsDrawerOpen(false);
  };

  // Switch chat threads
  const handleSwitchThread = (id: string) => {
    setActiveThreadId(id);
    localStorage.setItem("meow_second_brain_active_thread", id);
    setIsDrawerOpen(false);
    setError(null);
  };

  // Delete a single thread
  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection
    
    if (threads.length <= 1) {
      alert("ต้องมีประวัติคุยเหลือไว้อย่างน้อย 1 ห้องสนทนานะคะเหมียว!");
      return;
    }
    
    if (confirm("ต้องการลบห้องสนทนานี้ออกถาวรใช่หรือไม่คะ?")) {
      const updatedThreads = threads.filter(t => t.id !== id);
      saveAllThreads(updatedThreads);
      
      if (activeThreadId === id) {
        const nextActiveId = updatedThreads[0].id;
        setActiveThreadId(nextActiveId);
        localStorage.setItem("meow_second_brain_active_thread", nextActiveId);
      }
    }
  };

  // Compile dynamic Obsidian vault contexts
  const getObsidianVaultContext = async (): Promise<string> => {
    setLoadingStatus("กำลังอ่านคลัง Obsidian...");
    const listRes = await fetch("/api/obsidian", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list", vaultPath: obsidianPath })
    });
    const listData = await listRes.json();
    if (!listData.success || !listData.files || listData.files.length === 0) {
      return "";
    }

    setLoadingStatus(`โหลดเอกสาร ${listData.files.length} รายการ...`);
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

    return fileContents.join("\n\n");
  };

  // Auto-generate conversation title using AI after first user interaction
  const generateTitleForThread = async (threadId: string, userPrompt: string) => {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "summarize-title",
          apiKey,
          latestMessage: userPrompt
        })
      });
      const data = await res.json();
      if (data.success || data.text) {
        const cleanTitle = data.text.replace(/["'“”«»]/g, "").trim().substring(0, 22);
        setThreads(prev => {
          const updated = prev.map(t => t.id === threadId ? { ...t, title: cleanTitle } : t);
          localStorage.setItem("meow_second_brain_threads", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.warn("Failed to auto-title thread:", e);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isGenerating || !activeThreadId) return;

    const userText = inputValue;
    setInputValue("");
    setError(null);

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { role: "user", text: userText, timestamp };

    // Update active thread with user message
    const updatedThreads = threads.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: [...t.messages, userMsg]
        };
      }
      return t;
    });
    
    setThreads(updatedThreads);
    setIsGenerating(true);

    try {
      // 1. Gather dynamic second brain context from Obsidian
      const obsidianLogs = await getObsidianVaultContext();
      setLoadingStatus("สมองกลที่สองกำลังประมวลคำตอบ...");

      // 2. Query Agent API with full history and context
      const threadToQuery = updatedThreads.find(t => t.id === activeThreadId);
      const messagesHistory = threadToQuery ? threadToQuery.messages : [userMsg];

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "second-brain",
          obsidianLogs,
          apiKey,
          history: messagesHistory.map(h => ({ role: h.role, text: h.text })),
          latestMessage: userText
        })
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const modelMsg: ChatMessage = {
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      // Update active thread with AI response
      const finalizedThreads = threads.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            messages: [...t.messages, userMsg, modelMsg]
          };
        }
        return t;
      });

      saveAllThreads(finalizedThreads);

      // Check if thread title is "บทสนทนาใหม่ 🐾" and this is the first turn (length is now 3: initial, user, model)
      const currentTh = finalizedThreads.find(t => t.id === activeThreadId);
      if (currentTh && (currentTh.title === "บทสนทนาใหม่ 🐾" || currentTh.title === "บทแนะนำสมองที่สอง 🧠")) {
        // Trigger auto-titling asynchronously so chat remains fast and snappy
        generateTitleForThread(activeThreadId, userText);
      }

    } catch (err: any) {
      console.error(err);
      setError(`ไม่สามารถประมวลผลคำตอบได้: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setLoadingStatus("");
    }
  };

  // Helper to format Wikilinks [[conceptName]] as glowing badges
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(\[\[[a-zA-Z0-9_/.\-_\sก-๙]+\]\])/g);
    return parts.map((part, index) => {
      if (part.startsWith("[[") && part.endsWith("]]")) {
        const linkTarget = part.substring(2, part.length - 2);
        return (
          <span
            key={index}
            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 border border-purple-500/50 text-purple-300 shadow-[0_0_5px_rgba(168,85,247,0.2)] mx-0.5"
            title={` Obsidian WikiLink: ${linkTarget}`}
          >
            🕸️ {linkTarget}
          </span>
        );
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] border-2 border-purple-400 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group"
        title="ถามสมองกลที่สอง (Obsidian Second Brain Chat)"
      >
        <Brain className="w-6 h-6 animate-pulse text-white group-hover:rotate-12 transition-transform duration-200" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-purple-500"></span>
        </span>
      </button>

      {/* Floating Chat Popup Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-[420px] h-[550px] rounded-lg border-2 border-purple-500 bg-slate-950/95 backdrop-blur-md shadow-[0_0_30px_rgba(147,51,234,0.3)] flex flex-col font-mono overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          
          {/* Header */}
          <div className="bg-purple-900/40 border-b-2 border-purple-500 px-4 py-3 flex justify-between items-center z-20 relative">
            <div className="flex items-center gap-2 max-w-[65%]">
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="p-1.5 hover:bg-purple-800/30 rounded border border-purple-500/20 text-purple-400 hover:text-purple-300 transition-all duration-200"
                title="รายการแชททั้งหมด"
              >
                {isDrawerOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
              <div className="truncate">
                <h4 className="text-[10px] font-press-start text-purple-300 font-bold uppercase tracking-wider truncate">
                  {isDrawerOpen ? "HISTORY LIST" : (activeThread?.title || "Second Brain AI")}
                </h4>
                <p className="text-[8px] text-purple-400 mt-0.5 select-none font-sans truncate">
                  {isDrawerOpen ? "เลือกหรือสลับหัวข้อสนทนา" : "คลังปัญญาสองจาก Obsidian 🕸️"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCreateNewThread}
                className="p-1.5 bg-purple-800/20 hover:bg-purple-700/30 rounded border border-purple-500/40 text-purple-300 hover:text-white transition-all duration-200 flex items-center gap-1 text-[9px] font-bold"
                title="สร้างห้องแชทใหม่"
              >
                <Plus className="w-3.5 h-3.5" /> แชทใหม่
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsDrawerOpen(false);
                }}
                className="p-1.5 hover:bg-red-950/40 rounded border border-transparent hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sliding Drawer for Multiple Threads Explorer */}
          {isDrawerOpen && (
            <div className="absolute inset-0 bg-slate-950/98 z-10 pt-[52px] flex flex-col transition-all duration-300">
              <div className="p-3 border-b border-purple-500/20 bg-purple-950/10 flex justify-between items-center">
                <span className="text-[9px] text-purple-400 uppercase font-bold tracking-wider">
                  📂 รายการห้องสนทนาของทาส ({threads.length}):
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                {threads.map((t) => {
                  const isActive = t.id === activeThreadId;
                  const lastMsg = t.messages[t.messages.length - 1]?.text || "";
                  
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSwitchThread(t.id)}
                      className={`group w-full p-3 rounded text-left border cursor-pointer font-mono text-xs flex items-center justify-between transition-all duration-150 ${
                        isActive
                          ? "bg-purple-900/20 border-purple-500 text-purple-300"
                          : "bg-black/30 border-slate-800 hover:bg-purple-950/10 hover:border-purple-900/40 text-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 max-w-[80%]">
                        <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? "text-purple-400 animate-pulse" : "text-slate-500"}`} />
                        <div className="truncate">
                          <div className="font-bold truncate text-xs">{t.title}</div>
                          <div className="text-[9px] opacity-40 font-sans truncate mt-0.5">{lastMsg}</div>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => handleDeleteThread(t.id, e)}
                        className="p-1 hover:bg-red-950/50 rounded border border-transparent hover:border-red-900/30 text-slate-500 hover:text-red-400 opacity-80 group-hover:opacity-100 transition-all duration-150 shrink-0"
                        title="ลบแชทนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-3 border-t border-purple-500/20 bg-slate-950 flex gap-2">
                <button
                  onClick={handleCreateNewThread}
                  className="flex-1 py-2 px-3 bg-purple-700 hover:bg-purple-600 border border-purple-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all duration-100"
                >
                  <Plus className="w-4 h-4" /> สร้างห้องสนทนาใหม่ 🐾
                </button>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto bg-black/40 flex flex-col gap-4 custom-scrollbar">
            {activeThread?.messages.map((msg, index) => {
              const isModel = msg.role === "model";
              return (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] ${
                    isModel ? "self-start items-start" : "self-end items-end"
                  }`}
                >
                  {/* Sender Label */}
                  <span className="text-[8px] text-slate-500 mb-1 select-none font-sans">
                    {isModel ? "🧠 สมองที่สอง" : "ทาสผู้วิจัย"} - {msg.timestamp}
                  </span>

                  {/* Message Bubble */}
                  <div
                    className={`p-3 rounded text-xs leading-relaxed border shadow-sm ${
                      isModel
                        ? "bg-purple-950/20 border-purple-900/60 text-slate-300 rounded-bl-none"
                        : "bg-purple-600/10 border-purple-500/40 text-purple-200 rounded-br-none"
                    }`}
                  >
                    {renderMessageContent(msg.text)}
                  </div>
                </div>
              );
            })}

            {/* AI Generation State Loader */}
            {isGenerating && (
              <div className="self-start flex flex-col items-start max-w-[85%]">
                <span className="text-[8px] text-slate-500 mb-1 select-none font-sans">
                  🧠 สมองที่สองกำลังอ่านหอสมุด...
                </span>
                <div className="p-3 rounded rounded-bl-none text-xs bg-purple-950/15 border border-purple-900/40 text-purple-400/80 flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="animate-pulse">{loadingStatus}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-950/20 border border-red-800 text-red-400 text-xs flex items-start gap-2 rounded">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-purple-500/30 p-3 bg-slate-950 flex gap-2 items-center z-10"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                obsidianPath.trim() === ""
                  ? "โปรดตั้งค่าโฟลเดอร์ Obsidian ก่อนเหมียว..."
                  : "ถามเกี่ยวกับ ARIMA/LSTM/Kalman..."
              }
              disabled={isGenerating || obsidianPath.trim() === ""}
              className="flex-1 bg-black border border-purple-500/30 rounded py-2 px-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
            />
            <button
              type="submit"
              disabled={isGenerating || !inputValue.trim() || obsidianPath.trim() === ""}
              className="p-2 rounded bg-purple-700 hover:bg-purple-600 text-purple-200 disabled:opacity-40 disabled:hover:bg-purple-700 border border-purple-500/50 cursor-pointer active:scale-95 transition-all duration-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
