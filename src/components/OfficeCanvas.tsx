"use client";

import React, { useState, useEffect } from "react";

interface OfficeCanvasProps {
  currentStage: string; // 'select' | 'initializing' | 'drafting' | 'reviewing' | 'editing' | 'math-checking' | 'citation-matching' | 'integrity-protecting' | 'diagram-generating' | 'librarian' | 'saved'
  dialogueText: string; // The dialogue spoken by the active cat
  activeAgent: "none" | "manager" | "scribe" | "reviewer" | "editor" | "librarian" | "coordinator" | "math-checker" | "citation-matcher" | "integrity-guard" | "diagram-architect";
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
      case "math-checker":
        return "border-teal-400 text-teal-300";
      case "citation-matcher":
        return "border-amber-500 text-amber-300";
      case "integrity-guard":
        return "border-red-400 text-red-300";
      case "diagram-architect":
        return "border-fuchsia-400 text-fuchsia-300";
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
      case "math-checker":
        return "แมว 5 : เหมียวสมการคณิตศาสตร์ :: Math Verification Cat";
      case "citation-matcher":
        return "แมว 6 : เหมียวตรวจบรรณานุกรม :: Citation & Bibliography Cat";
      case "integrity-guard":
        return "แมว 7 : เหมียวผู้คุมจริยธรรมวิจัย :: Plagiarism & Integrity Shield";
      case "diagram-architect":
        return "แมว 8 : เหมียวจิตรกรระเบียบวิธี :: Methodology Diagram Architect";
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
      case "math-checking": return "แมว 5 กำลังสแกนสูตร LaTeX และจับคู่คำอธิบายพารามิเตอร์";
      case "citation-matching": return "แมว 6 กำลังตรวจสอบ In-text Citation กับคลังอ้างอิง";
      case "integrity-protecting": return "แมว 7 กำลังวิเคราะห์จริยธรรมวิจัยและระดับการกล่าวอ้าง";
      case "diagram-generating": return "แมว 8 กำลังสร้าง Mermaid Flowchart ระเบียบวิธีวิจัย";
      case "librarian": return "แมว 4 กำลังจัดระเบียบไฟล์คลังความรู้สะสมและประกอบฉบับสมบูรณ์";
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
      case "math-checker":
        return "/math-cat.svg";
      case "citation-matcher":
        return "/citation-cat.svg";
      case "integrity-guard":
        return "/integrity-cat.svg";
      case "diagram-architect":
        return "/diagram-cat.svg";
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

        {/* ===================== WING LEFT: CORE DRAFTING ===================== */}

        {/* 1. Scribe Cat (Cat 1) */}
        <div 
          className={`absolute left-[8%] bottom-[44%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "scribe" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#7e9cd8]" : "opacity-70"
          }`}
        >
          {activeAgent === "scribe" && (
            <div className="absolute -top-9 bg-indigo-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono whitespace-nowrap">
              แมว 1 ร่างวิจัย..
            </div>
          )}
          <img 
            src="/scribe-cat.svg" 
            alt="Scribe Cat" 
            className={`w-11 h-11 pixelated ${currentStage === "drafting" ? "animate-pulse" : "animate-bob"}`} 
          />
          <div className="bg-black/90 text-[7px] text-sky-300 border border-sky-400/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            นักเขียน (แมว 1)
          </div>
        </div>

        {/* 2. Reviewer Cat (Cat 2) */}
        <div 
          className={`absolute left-[24%] bottom-[44%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "reviewer" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#ff5d62]" : "opacity-70"
          }`}
        >
          {activeAgent === "reviewer" && (
            <div className="absolute -top-9 bg-red-500 text-white border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono whitespace-nowrap">
              แมว 2 สับตรวจ!
            </div>
          )}
          <img 
            src="/grumpy-reviewer.svg" 
            alt="Grumpy Reviewer" 
            className={`w-11 h-11 pixelated ${currentStage === "reviewing" ? "animate-bounce" : "animate-bob"}`} 
          />
          <div className="bg-black/90 text-[7px] text-red-400 border border-red-500/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            พี่ส้มตรวจ (แมว 2)
          </div>
        </div>

        {/* ===================== CENTER COMMAND: COORDINATOR & MANAGER ===================== */}

        {/* 3. Meow Coordinator (Siamese Cat - Center Command) */}
        <div 
          className={`absolute left-[45%] bottom-[30%] z-25 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "coordinator" ? "scale-120 -translate-y-1 drop-shadow-[0_0_12px_#f472b6]" : "opacity-85"
          }`}
        >
          {activeAgent === "coordinator" && (
            <div className="absolute -top-9 bg-pink-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono whitespace-nowrap">
              เลขาเหมียวบัญชาการ!
            </div>
          )}
          <img 
            src="/siamese-cat.svg" 
            alt="Siamese Cat Coordinator" 
            className={`w-12 h-12 pixelated ${activeAgent === "coordinator" ? "animate-pulse" : "animate-bob"}`} 
          />
          <div className="bg-black/95 text-[7px] text-pink-300 border border-pink-400/40 px-1.5 py-0.5 font-mono rounded whitespace-nowrap mt-1 font-bold">
            เลขาเหมียว
          </div>
        </div>

        {/* 4. Project Meow-nager (Desk Far Left) */}
        <div 
          className={`absolute left-[3%] bottom-[16%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "manager" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#e6c387]" : "opacity-75"
          }`}
        >
          {activeAgent === "manager" && (
            <div className="absolute -top-9 bg-yellow-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono whitespace-nowrap">
              สั่งงาน!
            </div>
          )}
          <img 
            src="/meow-nager.svg" 
            alt="Meow-nager" 
            className="w-11 h-11 pixelated animate-bob" 
          />
          <div className="bg-black/90 text-[7px] text-retro-primary border border-retro-primary/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            ผู้จัดการเหมียว
          </div>
        </div>

        {/* ===================== WING RIGHT: LANGUAGE & ARCHIVE ===================== */}

        {/* 5. Language Editor (Cat 3) */}
        <div 
          className={`absolute left-[68%] bottom-[44%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "editor" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#b19cd9]" : "opacity-70"
          }`}
        >
          {activeAgent === "editor" && (
            <div className="absolute -top-9 bg-purple-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono whitespace-nowrap">
              แมว 3 เกลาภาษา..
            </div>
          )}
          <img 
            src="/editor-cat.svg" 
            alt="Editor Cat" 
            className={`w-11 h-11 pixelated ${currentStage === "editing" ? "animate-pulse" : "animate-bob"}`} 
          />
          <div className="bg-black/90 text-[7px] text-purple-300 border border-purple-400/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            เกลาภาษา (แมว 3)
          </div>
        </div>

        {/* 6. Librarian Cat (Cat 4) */}
        <div 
          className={`absolute left-[84%] bottom-[44%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "librarian" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#76946a]" : "opacity-70"
          }`}
        >
          {activeAgent === "librarian" && (
            <div className="absolute -top-9 bg-emerald-500 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono whitespace-nowrap">
              แมว 4 คิวเรตไฟล์!
            </div>
          )}
          <img 
            src="/librarian-cat.svg" 
            alt="Librarian Cat" 
            className="w-11 h-11 pixelated animate-bob" 
          />
          <div className="bg-black/90 text-[7px] text-emerald-400 border border-emerald-400/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            บรรณารักษ์ (แมว 4)
          </div>
        </div>

        {/* ===================== FRONT ROW: SPECIALIZED VERIFIERS ===================== */}

        {/* 7. Math Verification Cat (Cat 5 - Math equations) */}
        <div 
          className={`absolute left-[14%] bottom-[16%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "math-checker" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#2dd4bf]" : "opacity-70"
          }`}
        >
          {activeAgent === "math-checker" && (
            <div className="absolute -top-9 bg-teal-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono whitespace-nowrap">
              แมว 5 ตรวจสูตร..
            </div>
          )}
          <img 
            src="/math-cat.svg" 
            alt="Math Checker Cat" 
            className={`w-11 h-11 pixelated ${currentStage === "math-checking" ? "animate-pulse" : "animate-bob"}`} 
          />
          <div className="bg-black/90 text-[7px] text-teal-300 border border-teal-400/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            เหมียวสมการ (แมว 5)
          </div>
        </div>

        {/* 8. Citation Cat (Cat 6 - Bibliography references) */}
        <div 
          className={`absolute left-[30%] bottom-[16%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "citation-matcher" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#f59e0b]" : "opacity-70"
          }`}
        >
          {activeAgent === "citation-matcher" && (
            <div className="absolute -top-9 bg-amber-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono whitespace-nowrap">
              แมว 6 แมทช์เอกสาร!
            </div>
          )}
          <img 
            src="/citation-cat.svg" 
            alt="Citation Cat" 
            className={`w-11 h-11 pixelated ${currentStage === "citation-matching" ? "animate-pulse" : "animate-bob"}`} 
          />
          <div className="bg-black/90 text-[7px] text-amber-300 border border-amber-500/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            ตรวจอ้างอิง (แมว 6)
          </div>
        </div>

        {/* 9. Integrity Guard (Cat 7 - Plagiarism/claims guard) */}
        <div 
          className={`absolute left-[62%] bottom-[16%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "integrity-guard" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#f87171]" : "opacity-70"
          }`}
        >
          {activeAgent === "integrity-guard" && (
            <div className="absolute -top-9 bg-red-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono whitespace-nowrap">
              แมว 7 คุมความมโน!
            </div>
          )}
          <img 
            src="/integrity-cat.svg" 
            alt="Integrity Guard Cat" 
            className={`w-11 h-11 pixelated ${currentStage === "integrity-protecting" ? "animate-pulse" : "animate-bob"}`} 
          />
          <div className="bg-black/90 text-[7px] text-red-300 border border-red-400/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            เซฟจริยธรรม (แมว 7)
          </div>
        </div>

        {/* 10. Diagram Architect (Cat 8 - SVG/Mermaid flowchart maker) */}
        <div 
          className={`absolute left-[78%] bottom-[16%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "diagram-architect" ? "scale-115 -translate-y-1 drop-shadow-[0_0_10px_#e879f9]" : "opacity-70"
          }`}
        >
          {activeAgent === "diagram-architect" && (
            <div className="absolute -top-9 bg-fuchsia-400 text-black border border-black text-[7px] font-bold px-1 rounded uppercase animate-bounce font-mono whitespace-nowrap">
              แมว 8 วาดโฟลว์..
            </div>
          )}
          <img 
            src="/diagram-cat.svg" 
            alt="Diagram Architect Cat" 
            className={`w-11 h-11 pixelated ${currentStage === "diagram-generating" ? "animate-pulse" : "animate-bob"}`} 
          />
          <div className="bg-black/90 text-[7px] text-fuchsia-300 border border-fuchsia-400/30 px-1 font-mono rounded whitespace-nowrap mt-1 scale-90">
            เหมียวจิตรกร (แมว 8)
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
