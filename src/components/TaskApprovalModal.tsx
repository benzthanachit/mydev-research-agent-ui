"use client";

import React from "react";
import { Check, X, ShieldAlert, BookOpen, User, Flame } from "lucide-react";

interface TaskApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApproveTask: (taskType: "scribe" | "reviewer" | "librarian" | "notebooklm") => void;
  stage: string;
  draft: string;
  critique: string;
  isGenerating: boolean;
}

export default function TaskApprovalModal({
  isOpen,
  onClose,
  onApproveTask,
  stage,
  draft,
  critique,
  isGenerating
}: TaskApprovalModalProps) {
  if (!isOpen) return null;

  const isReviewFail = critique && critique.includes("[FAIL]");
  const isReviewPass = critique && critique.includes("[PASS]");

  // Define dynamic lists of tasks based on the actual manuscript stage!
  const getTasksList = () => {
    const tasks = {
      pending: [] as any[],
      next: [] as any[],
      future: [] as any[]
    };

    // 1. SELECT STAGE
    if (stage === "select") {
      tasks.pending.push({
        id: "draft_init",
        title: "ร่างบทความวิจัยรอบเริ่มต้น",
        description: "แมวยังไม่ได้เริ่มต้นเขียนหน้าบทวิจัยวิชาการเล่มนี้เลยค่ะ",
        agent: "Scribe Cat",
        type: "scribe"
      });
      tasks.next.push({
        id: "run_scribe",
        title: "อนุมัติให้ Scribe Cat เขียนคำอธิบายเชิงคณิตศาสตร์",
        description: "เลขาจะไปกระตุ้นและนำเข้าความรู้ใน Obsidian มาเรียบเรียงบทนี้โดยเร็ว",
        agent: "Scribe Cat",
        type: "scribe"
      });
      tasks.future.push({
        id: "run_review",
        title: "ส่งมอบให้พี่ส้มสายวีนตรวจสอบความเข้มข้นทฤษฎี",
        description: "กรรมการสับงานจะมาคอยขย้ำตรวจสอบพารามิเตอร์ของระบบ",
        agent: "Grumpy Reviewer",
        type: "reviewer"
      });
    }

    // 2. DRAFTING STAGE
    else if (stage === "drafting") {
      tasks.pending.push({
        id: "draft_progress",
        title: "ร่างและขัดเกลาบทความเพิ่มเติม",
        description: "Scribe Cat ร่างเนื้อความเสร็จแล้ว รอคุณทาสเกลาหรือสั่งตรวจผลงาน",
        agent: "Scribe Cat",
        type: "scribe"
      });
      tasks.next.push({
        id: "run_review",
        title: "อนุมัติส่งให้ Grumpy Reviewer สับผลประเมิน",
        description: "ส่งมอบงานให้พี่ส้มตรวจสอบว่าสูตร LSTM และคาลมานเกนมีจุดรั่วหรือไม่",
        agent: "Grumpy Reviewer",
        type: "reviewer"
      });
      tasks.future.push({
        id: "run_librarian",
        title: "ส่งตรวจบรรณานุกรมบรรณารักษ์เหมียว",
        description: "สแกนการอ้างอิงและบรรณานุกรมแบบสากล APA/IEEE ท้ายบท",
        agent: "Librarian Cat",
        type: "librarian"
      });
    }

    // 3. REVIEWING STAGE (FAILED)
    else if (stage === "reviewing" && isReviewFail) {
      tasks.pending.push({
        id: "review_fail",
        title: "ปรับพารามิเตอร์แก้ไขข้อวิจารณ์ [FAILED]",
        description: "มีจุดบกพร่อง! ต้องสั่งให้แมวหลวงแก้สมการและดรอปเอาท์ตามที่พี่ส้มชี้แนะ",
        agent: "Scribe Cat",
        type: "scribe"
      });
      tasks.next.push({
        id: "run_scribe_refine",
        title: "อนุมัติให้ Scribe Cat ร่างบทความรอบสองเพื่ออุดรอยรั่ว",
        description: "ดึงคอมเมนต์ของพี่ส้มสายวีนไปให้แมวนักเขียนเกลาประโยคใหม่ทันที",
        agent: "Scribe Cat",
        type: "scribe"
      });
      tasks.future.push({
        id: "run_review_recheck",
        title: "ส่งสับตรวจซ้ำหลังจากแก้ข้อมูลวิจัยเรียบร้อย",
        description: "ส่งรายงานใหม่ให้พี่ส้มดูอีกครั้งเพื่อเลื่อนสเตตัสเป็น APPROVED",
        agent: "Grumpy Reviewer",
        type: "reviewer"
      });
    }

    // 4. REVIEWING STAGE (PASSED)
    else if (stage === "reviewing" && !isReviewFail && isReviewPass) {
      tasks.pending.push({
        id: "review_pass",
        title: "การประเมินทฤษฎีผ่านเกณฑ์ [PASSED]",
        description: "งานวิจัยระดับสูงผ่านเกณฑ์วิชาการแล้ว รอการจัดบรรณานุกรมมาตรฐาน",
        agent: "Librarian Cat",
        type: "librarian"
      });
      tasks.next.push({
        id: "run_librarian",
        title: "อนุมัติให้บรรณารักษ์เหมียวจัดเรียงหน้าอ้างอิงสากล",
        description: "จัดสไตล์ [1] หรือ (ผู้แต่ง, ปี) ให้สอดคล้องกันตลอดทั้งบทเรียน",
        agent: "Librarian Cat",
        type: "librarian"
      });
      tasks.future.push({
        id: "lock_notebooklm",
        title: "แช่แข็งผลงานวิจัยขึ้นสู่คลัง Google NotebookLM",
        description: "Ingest ข้อความขึ้นเป็น Source ความรู้เชิงปัญญาประดิษฐ์บนเซิร์ฟเวอร์",
        agent: "เลขาเหมียว",
        type: "notebooklm"
      });
    }

    // 5. LIBRARIAN STAGE
    else if (stage === "librarian") {
      tasks.pending.push({
        id: "reference_checked",
        title: "รอการบันทึกแช่แข็งผลงานถาวร",
        description: "จัดเรียงอ้างอิงเสร็จเรียบร้อยไร้รอยขีดข่วน พร้อมนำส่งคลังเป้าหมาย",
        agent: "เลขาเหมียว",
        type: "notebooklm"
      });
      tasks.next.push({
        id: "lock_final",
        title: "อนุมัติแช่แข็งผลงาน & นำส่ง Google NotebookLM 🔒",
        description: "บันทึกประวัติการทำงานลง Obsidian และล็อกบทวิจัยใส่คลังความเย็นถาวร",
        agent: "เลขาเหมียว",
        type: "notebooklm"
      });
      tasks.future.push({
        id: "next_chapter",
        title: "เริ่มต้นวิจัยในบทถัดไป (Chapter 4/5)",
        description: "รีเซ็ตสถานะและเตรียมคลังไอเดียเพื่อลุยบททดลองถัดไปเหมียว!",
        agent: "Project Meow-nager",
        type: "scribe"
      });
    }

    // 6. DEFAULT FALLBACK OR SAVED
    else {
      tasks.pending.push({
        id: "saved_success",
        title: "ปิดโครงงานและแช่แข็งสำเร็จแล้วค่ะเหมียว! 😻",
        description: "บทวิจัยนี้ปลอดภัยในคลังเก็บเย็น และถูกนำเข้า NotebookLM เรียบร้อย",
        agent: "ระบบเหมียว",
        type: "notebooklm"
      });
      tasks.next.push({
        id: "chapter_reset",
        title: "อนุมัติรีเซ็ตกระบวนการเพื่อย้ายไปทำตอนอื่นๆ",
        description: "ล้างโต๊ะวิจัยเพื่อปูทางเขียนบทนำหรือบทสรุปถัดไปสำหรับเปเปอร์ทาสค่ะ",
        agent: "ผู้จัดการเหมียว",
        type: "scribe"
      });
      tasks.future.push({
        id: "scopus_submit",
        title: "ส่งออกบทความเต็มเพื่อยื่นตีพิมพ์จริง",
        description: "นำไฟล์แช่แข็งและเอกสารจาก Obsidian ยื่นบรรณาธิการวารสารเป้าหมาย",
        agent: "ทาสผู้วิจัย",
        type: "scribe"
      });
    }

    return tasks;
  };

  const tasksList = getTasksList();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-vt323 antialiased backdrop-blur-sm select-none">
      
      {/* 8-Bit Panel Container */}
      <div className="w-full max-w-4xl retro-border-double bg-retro-panel flex flex-col max-h-[90vh] overflow-hidden shadow-[10px_10px_0px_#000] scanlines">
        
        {/* Header Title bar */}
        <div className="bg-[#12131a] px-6 py-3 border-b-4 border-retro-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-pink-400 animate-pulse" />
            <h2 className="font-press-start text-xs md:text-sm uppercase text-retro-primary font-bold tracking-wider">
              กระดานวิเคราะห์ภารกิจวิจัยโดยเลขาเหมียว 🐾
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="retro-btn py-1 px-3 bg-red-950 border-red-700 text-red-300 font-press-start text-[10px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Scrollable content) */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6 bg-[#161722]/50">
          
          <div className="bg-black/40 border-2 border-dashed border-retro-border/50 p-3 rounded text-xs text-slate-300 leading-relaxed font-mono">
            📌 **ข้อมูลแจ้งเตือนประจำสถานะ:** ทาสรักสามารถรีวิวรายการภารกิจที่เลขาเหมียวช่วยสกัดวิเคราะห์ขึ้นมาจากความจำ Obsidian และร่างบทความในมือขณะนี้ค่ะ โดยทาสสามารถเลือกกดปุ่ม **"อนุมัติจ่ายงาน (Approve)"** เพื่อสั่งให้เลขาเหมียวไปประสานงานเรียกแมวในทีมเข้ามาลุยต่อได้ทันทีค่ะเหมียว!
          </div>

          {/* Grid of 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: PENDING / ค้างคาอยู่ */}
            <div className="flex flex-col gap-4">
              <div className="border-b-4 border-yellow-500/50 pb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse border border-black" />
                <h3 className="font-press-start text-[10px] text-yellow-300 uppercase font-bold">
                  งานค้างอยู่ / สถานะวิจัย
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                {tasksList.pending.map((t) => (
                  <div key={t.id} className="p-3 bg-black/40 border-2 border-slate-800 rounded flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute right-0 top-0 bg-yellow-950/40 text-yellow-300 border-l border-b border-slate-800 px-1.5 py-0.5 text-[8px] font-press-start scale-90 rounded-bl font-bold">
                      ค้างคา
                    </div>
                    <h4 className="text-sm font-bold text-slate-200">{t.title}</h4>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed">{t.description}</p>
                    <div className="border-t border-slate-800/40 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>ผู้รับผิดชอบ: {t.agent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: NEXT ACTIONS / อนุมัติทำต่อ */}
            <div className="flex flex-col gap-4 lg:col-span-1">
              <div className="border-b-4 border-sky-500/50 pb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-sky-400 rounded-full animate-pulse border border-black" />
                <h3 className="font-press-start text-[10px] text-sky-400 uppercase font-bold">
                  แผนงานที่จะทำต่อ (อนุมัติได้)
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                {tasksList.next.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-900/60 border-2 border-sky-900 rounded flex flex-col gap-3 relative overflow-hidden shadow-[2px_2px_0px_#000]">
                    <div className="absolute right-0 top-0 bg-sky-950 text-sky-400 border-l border-b border-sky-900 px-1.5 py-0.5 text-[8px] font-press-start scale-90 rounded-bl font-bold animate-pulse">
                      ทำทันที
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-sky-300 leading-snug">{t.title}</h4>
                      <p className="text-xs text-slate-300 font-mono leading-relaxed mt-1">{t.description}</p>
                    </div>
                    
                    <div className="border-t border-sky-900/30 pt-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>ผู้จ่ายงาน: {t.agent}</span>
                      </div>
                      <button
                        onClick={() => {
                          onApproveTask(t.type);
                          onClose();
                        }}
                        disabled={isGenerating}
                        className="w-full retro-btn bg-[#182d23] border-emerald-500 text-emerald-400 py-1.5 text-xs flex items-center justify-center gap-1 font-bold"
                      >
                        <Check className="w-4 h-4" /> อนุมัติจ่ายงานเหมียว!
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: FUTURE SCOPE / แผนงานในอนาคต */}
            <div className="flex flex-col gap-4">
              <div className="border-b-4 border-purple-500/50 pb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse border border-black" />
                <h3 className="font-press-start text-[10px] text-purple-400 uppercase font-bold">
                  โครงการวางไว้ในอนาคต
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                {tasksList.future.map((t) => (
                  <div key={t.id} className="p-3 bg-black/20 border-2 border-purple-950/60 rounded flex flex-col gap-2 relative overflow-hidden opacity-80">
                    <div className="absolute right-0 top-0 bg-purple-950/30 text-purple-400 border-l border-b border-purple-950/60 px-1.5 py-0.5 text-[8px] font-press-start scale-90 rounded-bl font-bold">
                      อนาคต
                    </div>
                    <h4 className="text-sm font-bold text-purple-300">{t.title}</h4>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed">{t.description}</p>
                    <div className="border-t border-purple-950/20 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>แมวสแตนด์บาย: {t.agent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#12131a] px-6 py-4 border-t-4 border-retro-border flex items-center justify-between flex-shrink-0 text-xs font-mono text-slate-500">
          <span>โรงหล่อต้นฉบับแมวเหมียว v1.0.0-RPG :: งานวิจัย Scopus Q3/Q4 วางหางประสานงานวิชาการ 🐾</span>
          <button 
            onClick={onClose}
            className="retro-btn py-1 px-4 bg-slate-800 border-slate-700 text-slate-300"
          >
            ปิดหน้าจอ
          </button>
        </div>

      </div>

    </div>
  );
}
