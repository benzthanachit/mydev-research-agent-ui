"use client";

import React, { useState, useEffect } from "react";

interface OfficeCanvasProps {
  currentStage: string; // 'select' | 'drafting' | 'reviewing' | 'librarian' | 'saved'
  dialogueText: string; // The dialogue spoken by the active cat
  activeAgent: "manager" | "scribe" | "reviewer" | "librarian" | "none";
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
    }, 25); // Speedy 8-bit typewriter speed

    return () => clearInterval(intervalId);
  }, [dialogueText]);

  // Determine dialogue border accent depending on the active speaking cat
  const getDialogueBoxBorderClass = () => {
    switch (activeAgent) {
      case "manager":
        return "retro-border-primary text-retro-primary border-amber-400";
      case "scribe":
        return "retro-border-double text-slate-100 border-indigo-400";
      case "reviewer":
        return "retro-border-accent text-retro-accent border-red-500";
      case "librarian":
        return "retro-border-single text-sky-200 border-emerald-500";
      default:
        return "retro-border-double text-slate-100";
    }
  };

  const getAgentLabel = () => {
    switch (activeAgent) {
      case "manager":
        return "Project Meow-nager (Agent 1)";
      case "scribe":
        return "Scribe Cat (Agent 2)";
      case "reviewer":
        return "Grumpy Reviewer (Agent 3)";
      case "librarian":
        return "Librarian Cat (Agent 4)";
      default:
        return "Meow-nuscript Office";
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
      case "librarian":
        return "/librarian-cat.svg";
      default:
        return "/siamese-cat.svg";
    }
  };

  return (
    <div className="w-full retro-border-double scanlines crt-flicker relative bg-slate-950 overflow-hidden select-none">
      
      {/* 8-bit RPG Game Console Frame Header */}
      <div className="bg-[#12131a] px-4 py-2 border-b-4 border-retro-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse border-2 border-black" />
          <h2 className="font-press-start text-[10px] uppercase text-retro-primary tracking-wider font-bold">
            Office Console :: Active
          </h2>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-2 bg-retro-border" />
          <div className="w-6 h-2 bg-retro-primary" />
        </div>
      </div>

      {/* Main RPG Office Window */}
      <div className="relative w-full aspect-[2/1] min-h-[300px] max-h-[480px]">
        
        {/* Background SVG - Pixel Art Office */}
        <img
          src="/office-bg.svg"
          alt="RPG Office Background"
          className="absolute inset-0 w-full h-full object-cover pixelated"
        />

        {/* 1. Project Meow-nager (Agent 1 Desk) */}
        <div 
          className={`absolute left-[15%] bottom-[32%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "manager" ? "scale-110 -translate-y-1 drop-shadow-[0_0_8px_#e6c387]" : ""
          }`}
        >
          {activeAgent === "manager" && (
            <div className="absolute -top-10 bg-yellow-400 text-black border-2 border-black font-press-start text-[8px] px-1 py-0.5 rounded uppercase font-bold animate-bounce">
              Active!
            </div>
          )}
          <img 
            src="/meow-nager.svg" 
            alt="Meow-nager" 
            className="w-16 h-16 pixelated animate-bob" 
          />
          <div className="bg-black/80 text-[10px] text-retro-primary border border-retro-primary/40 px-1 font-press-start scale-75 rounded whitespace-nowrap mt-1">
            MEOW-NAGER
          </div>
        </div>

        {/* 2. Scribe Cat (Agent 2 - Typing at CRT Desk) */}
        <div 
          className={`absolute left-[44%] bottom-[34%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "scribe" ? "scale-110 -translate-y-1 drop-shadow-[0_0_8px_#7e9cd8]" : ""
          }`}
        >
          {activeAgent === "scribe" && (
            <div className="absolute -top-10 bg-indigo-400 text-black border-2 border-black font-press-start text-[8px] px-1 py-0.5 rounded uppercase font-bold animate-bounce">
              Writing...
            </div>
          )}
          <img 
            src="/scribe-cat.svg" 
            alt="Scribe Cat" 
            className={`w-16 h-16 pixelated ${currentStage === "drafting" ? "animate-pulse" : "animate-bob"}`} 
          />
          <div className="bg-black/80 text-[10px] text-sky-300 border border-sky-400/40 px-1 font-press-start scale-75 rounded whitespace-nowrap mt-1">
            SCRIBE
          </div>
        </div>

        {/* 3. Grumpy Reviewer (Agent 3 - Critique Corner) */}
        <div 
          className={`absolute left-[70%] bottom-[34%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "reviewer" ? "scale-110 -translate-y-1 drop-shadow-[0_0_8px_#ff5d62]" : ""
          }`}
        >
          {activeAgent === "reviewer" && (
            <div className="absolute -top-10 bg-red-500 text-white border-2 border-black font-press-start text-[8px] px-1 py-0.5 rounded uppercase font-bold animate-bounce">
              Reviewing!
            </div>
          )}
          <img 
            src="/grumpy-reviewer.svg" 
            alt="Grumpy Reviewer" 
            className={`w-16 h-16 pixelated ${currentStage === "reviewing" ? "animate-bounce" : "animate-bob"}`} 
          />
          <div className="bg-black/80 text-[10px] text-red-400 border border-red-500/40 px-1 font-press-start scale-75 rounded whitespace-nowrap mt-1">
            REVIEWER
          </div>
        </div>

        {/* 4. Librarian Cat (Agent 4 - Bookshelf Anchor) */}
        <div 
          className={`absolute left-[88%] bottom-[34%] z-20 flex flex-col items-center transition-all duration-300 ${
            activeAgent === "librarian" ? "scale-110 -translate-y-1 drop-shadow-[0_0_8px_#76946a]" : ""
          }`}
        >
          {activeAgent === "librarian" && (
            <div className="absolute -top-10 bg-emerald-500 text-black border-2 border-black font-press-start text-[8px] px-1 py-0.5 rounded uppercase font-bold animate-bounce">
              Citations!
            </div>
          )}
          <img 
            src="/librarian-cat.svg" 
            alt="Librarian Cat" 
            className="w-16 h-16 pixelated animate-bob" 
          />
          <div className="bg-black/80 text-[10px] text-emerald-400 border border-emerald-400/40 px-1 font-press-start scale-75 rounded whitespace-nowrap mt-1">
            LIBRARIAN
          </div>
        </div>

        {/* 5. Siamese Cat (Main Avatar walking across the bottom floor foreground) */}
        <div className="absolute bottom-[4%] w-full z-30 pointer-events-none h-16 overflow-hidden">
          <div className="animate-cat-walk w-16 h-16 absolute flex flex-col items-center">
            <img 
              src="/siamese-cat.svg" 
              alt="Siamese Cat Walking" 
              className="w-14 h-14 pixelated" 
            />
            {currentStage === "saved" && (
              <div className="bg-emerald-400 text-black text-[7px] border border-black px-0.5 rounded scale-75 -mt-3 uppercase font-press-start font-bold">
                Lock! 🐾
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Retro Zelda/RPG Typewriter Dialogue Speech Box */}
      <div className="p-4 bg-[#12131a] border-t-4 border-retro-border">
        <div className={`p-4 min-h-[92px] flex gap-4 ${getDialogueBoxBorderClass()}`}>
          
          {/* Active Speaker Avatar Box */}
          <div className="w-16 h-16 bg-[#1a1c29] border-2 border-retro-border flex-shrink-0 flex items-center justify-center p-1 rounded">
            <img
              src={getAvatarPath()}
              alt="Speaking Cat Avatar"
              className="w-14 h-14 object-contain pixelated animate-bob"
            />
          </div>

          {/* Dialogue Text Grid */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-retro-border/20 pb-1 mb-1">
              <span className="font-press-start text-[10px] uppercase font-bold tracking-wider">
                {getAgentLabel()}
              </span>
              <span className="text-[10px] opacity-50 font-mono">
                [STAGE: {currentStage.toUpperCase()}]
              </span>
            </div>
            
            <p className="font-mono text-base leading-relaxed tracking-wide min-h-[48px] text-slate-100">
              {displayedText}
              {isTyping && <span className="cursor-blink font-bold" />}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
