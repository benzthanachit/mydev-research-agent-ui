"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Heart, Sparkles, Loader2, ClipboardList, HelpCircle } from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: string;
}

interface SecretaryChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  onOpenTasksModal: () => void;
  isGenerating: boolean;
  affectionLevel: number; // 0-100
}

export default function SecretaryChat({
  chatHistory,
  onSendMessage,
  onOpenTasksModal,
  isGenerating,
  affectionLevel
}: SecretaryChatProps) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Automatically scroll chat window to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isGenerating]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  // Render heart rate meter based on secretary affection level
  const renderAffectionHearts = () => {
    const totalHearts = 5;
    const filledHearts = Math.min(5, Math.ceil(affectionLevel / 20));
    let heartsText = "";
    for (let i = 0; i < totalHearts; i++) {
      heartsText += i < filledHearts ? "❤️" : "🤍";
    }
    return (
      <div className="flex items-center gap-1.5 font-mono text-xs">
        <span className="animate-pulse">{heartsText}</span>
        <span className="text-pink-400 font-bold">[ความชอบ: {affectionLevel}%]</span>
      </div>
    );
  };

  const getCleanMessageText = (text: string) => {
    // Strip action and delegate tags from visible chat bubbles
    return text
      .replace(/\[DELEGATE: SCRIBE\]/g, "")
      .replace(/\[DELEGATE: REVIEW\]/g, "")
      .replace(/\[DELEGATE: LIBRARIAN\]/g, "")
      .replace(/\[ACTION: ANALYZE_TASKS\]/g, "")
      .trim();
  };

  return (
    <div className="retro-border-single bg-retro-panel p-4 flex flex-col gap-3 min-h-[500px] h-[580px]">
      
      {/* Secretary Header Profile Panel */}
      <div className="bg-[#12131a] px-3 py-2 border-b-2 border-retro-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Animated Secretary profile avatar */}
          <div className="w-10 h-10 bg-slate-900 border-2 border-retro-border rounded-full flex-shrink-0 flex items-center justify-center relative overflow-hidden">
            <img 
              src="/siamese-cat.svg" 
              alt="เลขาเหมียว Profile" 
              className="w-8 h-8 object-contain pixelated animate-bob"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black animate-pulse" />
          </div>
          <div>
            <h4 className="font-press-start text-[10px] text-pink-400 font-bold uppercase tracking-wider">
              เลขาเหมียว 🐾 วิเชียรมาศ
            </h4>
            <div className="mt-0.5">{renderAffectionHearts()}</div>
          </div>
        </div>

        {/* Dynamic Trust level label */}
        <span className="bg-pink-950/40 border border-pink-500/50 text-pink-300 px-1.5 py-0.5 text-[8px] font-press-start font-bold uppercase">
          เลขาคู่ใจ
        </span>
      </div>

      {/* LINE-style Chat Dialog window */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-black/40 border-2 border-retro-border p-3 flex flex-col gap-3 min-h-[300px] font-mono leading-relaxed"
        style={{ scrollBehavior: "smooth" }}
      >
        
        {/* Welcome Starter bubble */}
        <div className="flex gap-2 mr-6">
          <div className="w-8 h-8 bg-slate-900 border border-retro-border rounded-full flex-shrink-0 flex items-center justify-center">
            <img src="/siamese-cat.svg" alt="เหมียว" className="w-6 h-6 object-contain pixelated" />
          </div>
          <div className="p-3 bg-[#262837] border-2 border-slate-700 text-slate-100 text-xs rounded-lg rounded-tl-none relative shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
            <p>เหมียว! ยินดีต้อนรับสู่ท่อแชทสายตรงเลขาเหมียวค่ะ! ทาสรักสามารถพูดคุย หรือออกคำสั่งวิจัยได้โดยตรงเลยนะคะ 🐾</p>
            <p className="mt-1 text-[9px] text-pink-400 font-bold">ลองพิมพ์สั่งเช่น "เขียนทฤษฎี ARIMA ให้หน่อย" หรือกดวิเคราะห์แผนงานด้านล่างได้เลยค่ะเหมียว!</p>
          </div>
        </div>

        {/* Message history bubbles */}
        {chatHistory.map((m, idx) => {
          const isUser = m.role === "user";
          const textToShow = getCleanMessageText(m.text);
          if (!textToShow) return null; // Don't render empty action tags

          return (
            <div 
              key={idx} 
              className={`flex gap-2 max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar left side (Only for Model) */}
              {!isUser && (
                <div className="w-8 h-8 bg-slate-900 border border-retro-border rounded-full flex-shrink-0 flex items-center justify-center">
                  <img src="/siamese-cat.svg" alt="เหมียว" className="w-6 h-6 object-contain pixelated animate-bob" />
                </div>
              )}

              {/* Chat Speech Bubble */}
              <div 
                className={`p-3 text-xs border-2 rounded-lg relative shadow-[2px_2px_0px_rgba(0,0,0,0.5)] ${
                  isUser 
                    ? "bg-[#182d23] border-emerald-800 text-emerald-200 rounded-tr-none" 
                    : "bg-[#251d38] border-purple-900 text-purple-200 rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-wrap font-mono leading-relaxed">{textToShow}</p>
                <span className="block text-[8px] opacity-40 text-right mt-1 font-sans">
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Active typing loader bubble */}
        {isGenerating && (
          <div className="flex gap-2 mr-6">
            <div className="w-8 h-8 bg-slate-900 border border-retro-border rounded-full flex-shrink-0 flex items-center justify-center">
              <img src="/siamese-cat.svg" alt="เหมียว" className="w-6 h-6 object-contain pixelated animate-pulse" />
            </div>
            <div className="p-3 bg-[#161722] border-2 border-dashed border-retro-border/60 text-slate-400 text-xs rounded-lg rounded-tl-none animate-pulse">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
                เลขาเหมียววิเชียรมาศกำลังใช้สมองกลวิเคราะห์...
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Action controls button area */}
      <div className="flex gap-2">
        <button
          onClick={onOpenTasksModal}
          disabled={isGenerating}
          className="retro-btn bg-[#251d38] border-purple-500 text-purple-200 py-2 px-3 text-xs flex items-center gap-1 font-bold whitespace-nowrap animate-pulse"
          type="button"
        >
          <ClipboardList className="w-4 h-4 text-purple-400" />
          วิเคราะห์ภารกิจวิจัย 📋
        </button>
      </div>

      {/* LINE Input form bottom panel */}
      <form onSubmit={handleSend} className="flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="พิมพ์สั่งเลขาเหมียว เช่น 'สั่ง Scribe ร่างงานที'..."
          className="retro-input flex-1 font-mono text-xs leading-none py-2 px-3 placeholder-slate-700 h-9"
          disabled={isGenerating}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className="retro-btn bg-[#182d23] border-emerald-500 text-emerald-400 py-1 px-3 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
