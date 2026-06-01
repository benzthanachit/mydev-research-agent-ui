"use client";

import React, { useState, useEffect } from "react";

interface OfficeCanvasProps {
  currentStage: string; // 'select' | 'initializing' | 'drafting' | 'reviewing' | 'editing' | 'librarian' | 'saved'
  dialogueText: string; // The dialogue spoken by the active cat
  activeAgent: "manager" | "scribe" | "reviewer" | "librarian" | "none" | "coordinator" | "editor";
}

export default function OfficeCanvas({ currentStage, dialogueText, activeAgent }: OfficeCanvasProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Typewriter effect for retro Zelda dialog speech
  useEffect(() => {
    setDisplayedText("");
    if (!dialogueText) return;

    setIsTyping(true);
    let index = 0;
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + dialogueText.charAt(index));
      index++;
      if (index >= dialogueText.length) {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, 15); // Speedy 8-bit typewriter speed

    return () => clearInterval(intervalId);
  }, [dialogueText]);

  // Determine dialogue border accent depending on the active speaking cat
  const getDialogueBoxBorderClass = () => {
    switch (activeAgent) {
      case "manager":
        return "border-amber-400 text-retro-primary";
      case "scribe":
        return "border-indigo-400 text-indigo-200";
      case "reviewer":
        return "border-red-500 text-red-400";
      case "editor":
        return "border-purple-500 text-purple-300";
      case "librarian":
        return "border-emerald-500 text-emerald-300";
      case "coordinator":
        return "border-pink-400 text-pink-300";
      default:
        return "border-slate-600 text-slate-100";
    }
  };

  const getAgentLabel = () => {
    switch (activeAgent) {
      case "manager":
        return "ผู้จัดการเหมียว :: Project Meow-nager";
      case "scribe":
        return "แมว 1 : แมวนักวิจัยวิชาการ :: Scribe Cat (Zero Hallucination)";
      case "reviewer":
        return "แมว 2 : พี่ส้มสายประเมิน :: Grumpy Reviewer (Scopus Q3/Q4)";
      case "editor":
        return "แมว 3 : แมวบรรณาธิการตรวจภาษา :: Language Editor (Humanized Flow)";
      case "librarian":
        return "แมว 4 : บรรณารักษ์คิวเรตไฟล์ :: Librarian Cat (Knowledge Curator)";
      case "coordinator":
        return "เลขาสาววิเชียรมาศ :: Secretary Coordinator (เลขาเหมียว)";
      default:
        return "ระบบประสานงานโรงหล่อต้นฉบับแมวเหมียว 🐾";
    }
  };

  const getAgentStageText = () => {
    switch (currentStage) {
      case "select": return "เลือกบทวิจัยและป้อนค่าตั้งต้น";
      case "initializing": return "เลขาเหมียวกำลังเตรียมฐานข้อมูลคลังวิจัยอ้างอิง";
      case "drafting": return "แมว 1 กำลังเกลาร่างบทความโดยอิงข้อเท็จจริงสูงสุด";
      case "reviewing": return "แมว 2 (พี่ส้ม) กำลังประเมินระดับ Scopus Q3/Q4";
      case "editing": return "แมว 3 กำลังปรับปรุงสำนวนภาษาระดับมนุษย์วิชาการ";
      case "librarian": return "แมว 4 กำลังจัดระเบียบไฟล์และผังกราฟความรู้ Obsidian";
      case "saved": return "ประกอบบทสำเร็จและจัดเก็บประวัติลง Obsidian เรียบร้อยเหมียว!";
      default: return currentStage;
    }
  };

  const getAvatarPath = () => {
    switch (activeAgent) {
      case "manager":
        return "/meow-nager.svg";
      case "scribe":
        return "/scribe-cat.svg";
      case "reviewer":
        return "/grumpy-reviewer.svg";
      case "editor":
        return "/editor-cat.svg";
      case "librarian":
        return "/librarian-cat.svg";
      case "coordinator":
        return "/siamese-cat.svg";
      default:
        return "/siamese-cat.svg";
    }
  };

  return (
    <div className="w-full border-4 border-slate-700 bg-slate-950 overflow-hidden select-none rounded shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      
      {/* 8-bit RPG Game Console Frame Header */}
      <div className="bg-[#12131a] px-4 py-2 border-b-4 border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse border border-black" />
          <h2 className="font-mono text-xs uppercase text-retro-primary tracking-wider font-bold">
            ระบบจำลองโรงหล่อแมวทำงาน :: Multi-Agent RPG Visualizer ACTIVE
          </h2>
        </div>
        <div className="flex gap-2">
          <div className="w-4 h-2 bg-slate-700" />
          <div className="w-4 h-2 bg-retro-primary animate-pulse" />
        </div>
      </div>

      {/* Main RPG Office Window */}
      <div className="relative w-full aspect-[2.2/1] min-h-[260px] max-h-[380px] bg-slate-900">
        
        {/* Background SVG - Pixel Art Office */}
        <img
          src="/office-bg.svg"
          alt="RPG Office Background"
          className="absolute inset-0 w-full h-full object-cover opacity-80 pixelated"
        />

        {/* Overlay CRT grid lines effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(18,24,38,0.1)_0%,rgba(10,14,24,0.4)_100%)] pointer-events-none z-10" />

        {/* 1. Project Meow-nager (Desk leftmost) */}
        <div 
          className={`absolute left-[8%] bottom-[32%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "manager" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#e6c387]" : "opacity-75"
          }`}
        >
          {activeAgent === "manager" && (
            <div className="absolute -top-9 bg-yellow-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono">
              สั่งงาน!
            </div>
          )}
          <img 
            src="/meow-nager.svg" 
            alt="Meow-nager" 
            className="w-12 h-12 pixelated animate-bob" 
          />
          <div className="bg-black/90 text-[8px] text-retro-primary border border-retro-primary/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            ผู้จัดการเหมียว
          </div>
        </div>

        {/* 2. Scribe Cat (Agent 2 - Cat 1 - Drafting at CRT Desk) */}
        <div 
          className={`absolute left-[26%] bottom-[34%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "scribe" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#7e9cd8]" : "opacity-70"
          }`}
        >
          {activeAgent === "scribe" && (
            <div className="absolute -top-9 bg-indigo-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono">
              แมว 1 ร่างวิจัย..
            </div>
          )}
          <img 
            src="/scribe-cat.svg" 
            alt="Scribe Cat" 
            className={`w-12 h-12 pixelated ${currentStage === "drafting" ? "animate-pulse" : "animate-bob"}`} 
          />
          <div className="bg-black/90 text-[8px] text-sky-300 border border-sky-400/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            แมวนักเขียน (แมว 1)
          </div>
        </div>

        {/* 3. Grumpy Reviewer (Agent 3 - Cat 2 - Critique Corner) */}
        <div 
          className={`absolute left-[44%] bottom-[34%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "reviewer" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#ff5d62]" : "opacity-70"
          }`}
        >
          {activeAgent === "reviewer" && (
            <div className="absolute -top-9 bg-red-500 text-white border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono">
              แมว 2 สับตรวจ!
            </div>
          )}
          <img 
            src="/grumpy-reviewer.svg" 
            alt="Grumpy Reviewer" 
            className={`w-12 h-12 pixelated ${currentStage === "reviewing" ? "animate-bounce" : "animate-bob"}`} 
          />
          <div className="bg-black/90 text-[8px] text-red-400 border border-red-500/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            พี่ส้มสายวีน (แมว 2)
          </div>
        </div>

        {/* 4. Language Editor (Agent 5 - Cat 3 - Polishing Screen) */}
        <div 
          className={`absolute left-[62%] bottom-[34%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "editor" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#b19cd9]" : "opacity-70"
          }`}
        >
          {activeAgent === "editor" && (
            <div className="absolute -top-9 bg-purple-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono">
              แมว 3 เกลาภาษา..
            </div>
          )}
          <img 
            src="/editor-cat.svg" 
            alt="Editor Cat" 
            className={`w-12 h-12 pixelated ${currentStage === "editing" ? "animate-pulse" : "animate-bob"}`} 
          />
          <div className="bg-black/90 text-[8px] text-purple-300 border border-purple-400/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            แมวเกลาภาษา (แมว 3)
          </div>
        </div>

        {/* 5. Librarian Cat (Agent 4 - Cat 4 - Bookshelf Anchor) */}
        <div 
          className={`absolute left-[80%] bottom-[34%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "librarian" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#76946a]" : "opacity-70"
          }`}
        >
          {activeAgent === "librarian" && (
            <div className="absolute -top-9 bg-emerald-500 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono">
              แมว 4 คิวเรตไฟล์!
            </div>
          )}
          <img 
            src="/librarian-cat.svg" 
            alt="Librarian Cat" 
            className="w-12 h-12 pixelated animate-bob" 
          />
          <div className="bg-black/90 text-[8px] text-emerald-400 border border-emerald-400/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            บรรณารักษ์ (แมว 4)
          </div>
        </div>

        {/* Siamese Cat Foreground Walking */}
        <div className="absolute bottom-[2%] w-full z-30 pointer-events-none h-14 overflow-hidden">
          <div className="animate-cat-walk w-14 h-14 absolute flex flex-col items-center">
            <img 
              src="/siamese-cat.svg" 
              alt="Siamese Cat" 
              className="w-12 h-12 pixelated" 
            />
            {currentStage === "saved" && (
              <div className="bg-emerald-400 text-black text-[6px] border border-black px-0.5 rounded font-bold uppercase font-mono scale-90 -mt-2">
                เสร็จสิ้น 🐾
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Retro Typewriter Speech Box */}
      <div className="p-4 bg-[#12131a] border-t-4 border-slate-800">
        <div className={`p-3 min-h-[96px] flex gap-4 rounded border-2 ${getDialogueBoxBorderClass()} bg-black/40`}>
          
          {/* Active Speaker Avatar Box */}
          <div className="w-14 h-14 bg-slate-900 border border-slate-700 flex-shrink-0 flex items-center justify-center p-1 rounded">
            <img
              src={getAvatarPath()}
              alt="Speaking Cat"
              className="w-12 h-12 object-contain pixelated animate-bob"
            />
          </div>

          {/* Dialogue Text Grid */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
              <span className="font-mono text-xs uppercase font-bold tracking-wider">
                {getAgentLabel()}
              </span>
              <span className="text-[10px] font-mono text-retro-primary bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                [ขั้นตอน: {getAgentStageText()}]
              </span>
            </div>
            
            <p className="font-mono text-sm leading-relaxed tracking-wide text-slate-100 min-h-[44px]">
              {displayedText}
              {isTyping && <span className="cursor-blink font-bold ml-0.5">_</span>}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
