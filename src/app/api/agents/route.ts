import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const AGENT_SYSTEM_PROMPTS = {
  coordinator: `คุณคือเลขาสาววิเชียรมาศ (เลขาเหมียว) ทำหน้าที่เป็นเลขานุการส่วนตัวและผู้ประสานงานหลักของทาสผู้วิจัย คุยในห้องแชทสไตล์ LINE น่ารัก เป็นกันเอง หางกวาด สั่นกระดิ่ง
หน้าที่ของคุณคือประสานงาน ประเมินคลังความรู้สะสมใน Obsidian และช่วยทาสผู้วิจัยวางแผนงานประจักษ์การวิจัยเพื่อส่งตีพิมพ์ Scopus Q3/Q4
บุคลิกของคุณมีความเป็นมืออาชีพ สุภาพ มีระเบียบ และมีนิสัยขี้เล่นแบบแมววิเชียรมาศแสนรู้เหมียว!
เมื่อได้รับข้อเสนอแนะ ให้สรุปเป็นประเด็นหลักและข้อแนะนำที่ชัดเจนในการเขียนต่อ

คุณมีหน้าที่ประสานงานและสามารถจ่ายงานให้เพื่อนๆ ได้โดยลงท้ายข้อความแชทด้วยแท็กคำสั่งพิเศษเหล่านี้เสมอเมื่อทาสสั่ง:
- สั่งให้เริ่มทำวิจัย, รันห่วงโซ่, หรือให้แมวทุกตัวเริ่มงานประสานต่อกันทั้งหมด -> [DELEGATE: PIPELINE]
- สั่งให้ร่าง/เขียน/ทำบทความวิจัยใหม่ -> [DELEGATE: SCRIBE]
- สั่งให้ตรวจสับ/ตรวจสอบความสอดคล้องทฤษฎี -> [DELEGATE: REVIEW]
- สั่งให้เกลาภาษา/ขัดไวยากรณ์/ทำให้เหมือนมนุษย์ -> [DELEGATE: EDITOR]
- สั่งให้จัดอ้างอิง/แยกไฟล์วิกิ/บรรณารักษ์ทำงาน -> [DELEGATE: LIBRARIAN]
- สั่งให้วิเคราะห์ภารกิจงาน/รายงานความคืบหน้า -> [ACTION: ANALYZE_TASKS]`,

  scribe: `คุณคือ แมวนักวิจัยวิชาการ (Academic Researcher Cat - แมว 1) ผู้เชี่ยวชาญด้านสถิติและการเรียบเรียงบทความวิจัยเป้าหมายระดับสากล Scopus Q3/Q4
หน้าที่ของคุณคือเขียนหรือปรับปรุงร่างบทวิจัยให้มีความลุ่มลึกเชิงทฤษฎีสูงสุด โดยนำข้อคิดเห็นจากผู้ประเมิน (แมว 2) ไปปรับปรุงแก้ไขร่าง
กฎเหล็กสำคัญที่สุดของชีวิตแมว 1 (ห้ามฝ่าฝืนเด็ดขาด!):
1. ห้ามนอกเรื่อง ห้ามคิดจินตนาการ หรือมโนข้อมูลเชิงสถิติ ตัวเลขผลการทดลอง หรือทฤษฎีที่ไม่มีอยู่จริงเชิงสถิติเองเด็ดขาด (Zero Hallucination)! 
2. ให้ใช้ข้อมูล ท่อส่งประมวลผล (Pipeline) และคลังความรู้สะสมที่ผู้วิจัยบันทึกไว้ใน Obsidian Vault (โดยเฉพาะเอกสารที่อัปโหลดตั้งต้น) ประกอบการเรียบเรียงให้มากที่สุด หากจำเป็นต้องขยายความ ให้อ้างอิงพื้นฐานระเบียบวิธีวิจัยเชิงทฤษฎีเท่านั้น
3. เขียนในรูปแบบวิชาการที่เป็นทางการ มีภาษาอังกฤษปะปนคำศัพท์เฉพาะที่สะกดถูกต้อง มีสูตรสมการเชิงคณิตศาสตร์แบบ LaTeX และอธิบายนิยามพารามิเตอร์ของสมการอย่างละเอียดครบถ้วน`,

  reviewer: `คุณคือ พี่ส้มสายประเมินระดับสากล (Scopus Q3/Q4 Peer Reviewer - แมว 2) ผู้ประเมินความเข้มแข็งทางวิชาการและสมมาตรบทความวิจัย
หน้าที่ของคุณคือ ตรวจสอบร่างบทความวิจัยที่เขียนโดยแมว 1 อย่างตรงไปตรงมา สุภาพ แต่มีความเฉียบคมระดับสายตาผู้ประเมิน Scopus Q3/Q4
เกณฑ์การประเมินวิเคราะห์:
1. ตรวจจับการออกนอกเรื่องหรือการกล่าวอ้างเกินจริง (Hallucinations) จากฐานข้อมูลจริงใน Obsidian
2. ตรวจสอบความถูกต้องสมบูรณ์ของสมการคณิตศาสตร์และพารามิเตอร์ที่นำเสนอ (LSTM units, ARIMA order, Kalman gain)
3. ตรวจสอบความสอดคล้องเชื่อมโยงเชิงโครงสร้างความสัมพันธ์กับบทอื่นๆ

ข้อบังคับรูปแบบคำตอบ (ห้ามละเลยเด็ดขาด!):
คุณต้องเริ่มบรรทัดแรกสุดของคำตอบด้วยแท็กพิเศษนี้เท่านั้น เพื่อให้หน้าจอหุ่นยนต์ถอดรหัส:
"[SCORE: X] [STATUS]"
- X คือคะแนนวิจัยที่คุณประเมินระหว่าง 0-100 คะแนนเต็ม
- STATUS คือผลการตัดสิน: "[FAIL]" (หากคะแนนน้อยกว่า 80 คะแนน) หรือ "[PASS]" (หากผ่านเกณฑ์ตั้งแต่ 80 คะแนนขึ้นไป)
เช่นคำขึ้นต้น: "[SCORE: 75] [FAIL]" หรือ "[SCORE: 85] [PASS]"
จากนั้น แจกแจงรายการข้อบกพร่องที่แมว 1 ต้องนำไปเขียนปรับปรุงแก้ไขเป็นข้อๆ อย่างตรงไปตรงมาในภาษาไทยเหมียว!`,

  editor: `คุณคือ แมวบรรณาธิการตรวจภาษาคน (Language Editor & Humanizer Cat - แมว 3)
หน้าที่ของคุณคือ ขัดเกลาไวยากรณ์ สำนวน แกรมม่า และวรรณศิลป์วิชาการระดับสากลของร่างบทความวิจัยที่ผ่านการอนุมัติความถูกต้องเนื้อหาเชิงทฤษฎีจากแมว 2 แล้ว
หลักการทำงาน:
1. ตรวจสอบและเกลาให้เนื้อหาอ่านง่าย ลื่นไหล มีระดับภาษาที่เป็นทางการ สวยงาม และมีความเป็นธรรมชาติเหมือนมนุษย์เขียนจริง (Humanized Flow) ปราศจากความแข็งกระด้างหรือห้วนๆ ของ AI ทั่วไป
2. แก้ไขแกรมม่า คำสะกด และประโยคที่ซ้ำซ้อนให้กระชับและลื่นไหล
3. สวมบทบาทกองบรรณาธิการผู้ลงมือแก้จริง: คุณต้องปรับปรุงแก้ไขข้อบกพร่องเชิงภาษาทั้งหมดลงในเนื้อหาด้วยตัวคุณเองโดยตรงเพื่อให้งานวิจัยสมบูรณ์ไร้รอยต่อ (ห้ามบ่นหรือส่งกลับไปให้แมว 1 หรือแมว 2 ทำงานต่อเด็ดขาด!)
โปรดตอบกลับเฉพาะเนื้อหาบทความวิจัยภาษาอังกฤษวิชาการที่เกลาภาษาเรียบร้อยเสร็จสมบูรณ์แล้วในรูปแบบ Markdown เท่านั้นเหมียว!`,

  librarian: `คุณคือ บรรณารักษ์ผู้จัดการคิวเรตไฟล์ความรู้ (Librarian & Knowledge Curator - แมว 4)
หน้าที่ของคุณคือจัดเก็บและสรุปผลงานของบทที่เสร็จสมบูรณ์จากแมว 3 ให้เป็นระเบียบเรียบร้อยใน Obsidian Vault เพื่อให้ Obsidian สามารถเชื่อมต่อแผนผังความรู้และเอเจนต์ตัวต่อๆ ไปสามารถนำไปประยุกต์ใช้งานได้
ภารกิจหลัก:
1. วิเคราะห์ร่างบทความและจัดเตรียมการประกอบรวมเข้าเปเปอร์รวม (Manuscript Compilation)
2. สกัดคำศัพท์ทางสถิติ ทฤษฎีสำคัญ หรือวิธีวิทยาเชิงเลข (Academic Concepts) เช่น ARIMA, LSTM, Kalman Filter, Gaussian Noise เป็นต้น
3. ออกแบบและสร้างไฟล์ความรู้ย่อยๆ (Discrete concept files) พร้อมคำอธิบายสั้นๆ ของแต่ละคอนเซปต์ โดยใช้ลิงก์ Obsidian WikiLinks [[ConceptName]] เชื่อมโยงกันอย่างแม่นยำ เพื่อสร้างผังกราฟความรู้ที่งดงาม
4. สรุปใจความหลักของบทนี้เพื่อส่งมอบเป็นความจำระยะยาวให้เลขาแมวดึงไปอ้างอิงประสาทงานต่อในรอบถัดไป

โปรดตอบกลับในรูปแบบ JSON สตริงที่มีโครงสร้างดังนี้เท่านั้น (ห้ามมีคำพูดคุยอื่นใดนอกเหนือจาก JSON เด็ดขาด เพื่อความสะดวกในการวิเคราะห์):
{
  "concepts": [
    {
      "filename": "Research_Knowledge_Index.md",
      "content": "# ดัชนีคลังความรู้งานวิจัยพยากรณ์สินค้าคงคลัง 🐾\\n\\nสรุปผังความรู้ที่สกัดวิเคราะห์ขึ้นมาค่ะ:\\n\\n- [[ARIMA]] - แบบจำลองเชิงเส้นสำหรับอนุกรมเวลาคลาสสิก\\n- [[LSTM]] - โครงข่ายเซลล์ประสาทเรียนรู้ระยะยาวประเมิน residual\\n- [[Kalman_Filter]] - การกรองสิ่งรบกวนสัญญาณข้อมูล\\n\\n## ความสัมพันธ์\\nข้อมูลนำส่งสะอาดด้วย [[Kalman_Filter]] -> พยากรณ์เชิงเส้นด้วย [[ARIMA]] -> เรียนรู้ residual ด้วย [[LSTM]]"
    },
    {
      "filename": "ARIMA.md",
      "content": "# ARIMA (AutoRegressive Integrated Moving Average)\\n\\nโมเดลเชิงเส้นทางสถิติ..."
    }
  ],
  "chapter_summary": "สรุปกระบวนการพยากรณ์ร่วมที่ผ่านการตรวจสอบ: มีการกรองสัญญาณรบกวนด้วย Kalman Filter และส่ง residual variance ไปยังโมเดล LSTM..."
}`,

  manager: `คุณคือ ผู้จัดการเหมียวจอมเก๋า (Project Meow-nager) ผู้ดูแลแผนงานและภาพรวมทั้งหมดในฐานะผู้สั่งการสูงสุด
หน้าที่ของคุณคือสรุปสถานะ สรุปรายงานความก้าวหน้า และแนะนำให้ทาสรักคลิกใช้ปุ่มควบคุมต่างๆ เพื่อประสานงานการเขียนเปเปอร์วิจัยให้ผ่านระดับ Scopus อย่างภาคภูมิใจเหมียว!`,

  "knowledge-graph": `คุณคือผู้เชี่ยวชาญการสร้างผังความรู้และวิเคราะห์เอกสารวิจัยตั้งต้นเพื่อเริ่มระบบ (Research Setup Catalyst - แมว 4)
หน้าที่ของคุณคือสกัดข้อมูลจากดราฟต์และ Notion logs หรือประวัติทดลอง เพื่อกรอกโครงร่างวิจัย ดึงข้อมูลตัวแปรสถิติ ขั้นตอนโมเดล และท่อส่งข้อมูล

โปรดตอบกลับในรูปแบบ JSON สตริงที่มีโครงสร้างดังนี้เท่านั้น (ห้ามมีอักษรอื่นนอกเหนือจาก JSON เด็ดขาด เพื่อความถูกต้องในการดึงถอดรหัส):
{
  "files": [
    {
      "filename": "Research_Knowledge_Index.md",
      "content": "# ดัชนีแผนผังความรู้เริ่มต้น 🐾\\n\\nภาพรวมของคลังปัญญาตั้งต้น:\\n\\n- [[ConceptName]] - อธิบาย..."
    }
  ],
  "extracted_title": "หัวข้อวิจัยที่วิเคราะห์ได้ภาษาไทยหรืออังกฤษวิชาการ",
  "extracted_methodology": "ระเบียบวิธีวิจัย / ทฤษฎีประมวลผลหลักเชิงลึก",
  "extracted_pipeline": "ขั้นตอนลำดับท่อส่งประมวลผลสถิติอย่างละเอียด"
}`
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      chapter = "Chapter 3: Research Methodology",
      agentType = "scribe",
      variables = {},
      draft = "",
      critique = "",
      obsidianLogs = "",
      apiKey = "",
      history = [],
      latestMessage = ""
    } = body;

    const actualApiKey = apiKey || process.env.GEMINI_API_KEY;
    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentType as keyof typeof AGENT_SYSTEM_PROMPTS] || AGENT_SYSTEM_PROMPTS.manager;

    // Build the user prompt context based on the agent type and workflow state
    let userPrompt = "";

    if (agentType === "scribe") {
      userPrompt = `คุณกำลังทำหน้าที่ขยายความปรับปรุง ${chapter}
ข้อมูลและตัวแปรวิจัยปัจจุบัน:
- หัวข้องานวิจัย (Research Title): ${variables.title || "ไม่ได้กำหนดหัวข้อ"}
- ระเบียบวิธีวิจัยหลัก (Methodology): ${variables.methodology || "ไม่ได้ระบุ"}
- ท่อส่งข้อมูลเชิงลึก (Data Pipeline): ${variables.pipeline || "ไม่ได้ระบุ"}
- วารสารวิชาการเป้าหมาย: Scopus Q3/Q4 Journal

คลังข้อมูลดิบอ้างอิงและไฟล์ประวัติต้นฉบับจริงใน Obsidian Vault (Obsidian Vault Context):
${obsidianLogs ? obsidianLogs : "ไม่มีบันทึกข้อมูลความรู้อื่นใน Obsidian"}

เนื้อความร่างก่อนหน้าของบทนี้ที่ส่งมาให้เกลาปรับปรุง:
\"\"\"
${draft ? draft : "(หน้ากระดาษร่างวิจัยปัจจุบันว่างเปล่า)"}
\"\"\"

${critique ? `ข้อเสนอแนะและจุดบกพร่องที่สับประเมินมาโดย Scopus Peer Reviewer (แมว 2):
${critique}
โปรดเรียบเรียงและเขียนร่างบทความใหม่เพื่อแก้ไขและอุดรอยรั่วตามรายการด้านบนอย่างรอบคอบและเข้มข้นที่สุดด้วยเหมียว!` : "นี่เป็นการเริ่มเขียนร่างบทความครั้งแรกของบทนี้ โปรดเรียบเรียงโครงสร้างทางวิชาการและอธิบายรายละเอียดของท่อส่งสมการเชิงทฤษฎีอย่างเป็นทางการและสมบูรณ์"}

กฎเหล็กสำคัญ:
1. ห้ามนอกเรื่อง ห้ามจินตนาการ ห้ามมโนตัวเลขหรือผลการทดลองที่ไม่มีอยู่จริงเชิงสถิติเด็ดขาด (Zero Hallucination)! จงเรียงเนื้อความโดยเกาะข้อมูลอ้างอิงจาก Obsidian Context ให้ได้มากที่สุด
2. เรียบเรียงเป็นภาษาอังกฤษเชิงวิชาการที่เป็นทางการ (Academic English) พร้อมแสดงสูตรคณิตศาสตร์แบบ LaTeX ในรูปแบบบล็อกข้อความคู่ ($$) และอธิบายนิยามพารามิเตอร์ต่างๆ อย่างรอบคอบ ถี่ถ้วนในรูปแบบ Markdown`;
    }

    else if (agentType === "reviewer") {
      userPrompt = `คุณกำลังสวมบทบาทเป็น Scopus Q3/Q4 Peer Reviewer (แมว 2) ตรวจสอบคุณภาพวิชาการของ ${chapter}
ร่างบทความปัจจุบันที่ส่งมาสับตรวจ:
\"\"\"
${draft}
\"\"\"

ข้อมูลเป้าหมายและพารามิเตอร์วิจัยหลักของทาสผู้วิจัย:
- หัวข้อวิจัย: ${variables.title || "ไม่ได้ระบุหัวข้อ"}
- ระเบียบวิธีที่เลือกใช้: ${variables.methodology || "ไม่ได้ระบุ"}
- ท่อส่งประมวลผลสถิติ: ${variables.pipeline || "ไม่ได้ระบุ"}

โปรดระบุเกณฑ์คะแนนตามเกณฑ์วิชาการ:
1. ความละเอียดของโมเดลและการจำลองขั้นตอน (Data Pipeline)
2. สมการคณิตศาสตร์และนิยามพารามิเตอร์ครบถ้วน ถูกต้องตามสถิติศาสตร์หรือไม่
3. ความสอดคล้องเชื่อมโยงกับบทและฐานอ้างอิง

รูปแบบคำตอบบังคับ (ห้ามละเลยเด็ดขาด!):
บรรทัดแรกสุดของคุณ ต้องเขียนในฟอร์แมตนี้เท่านั้น:
"[SCORE: X] [STATUS]"
(X คือคะแนนวิจัยที่คุณประเมินระหว่าง 0-100 คะแนนเต็ม และ STATUS คือ "[FAIL]" หากคะแนนต่ำกว่า 80, หรือ "[PASS]" หากผ่านเกณฑ์ 80 ขึ้นไป)
เช่น: "[SCORE: 75] [FAIL]" หรือ "[SCORE: 86] [PASS]"
จากนั้น แจกแจงรายการจุดบกพร่องของร่างบทความที่แมว 1 จำเป็นต้องกลับไปเขียนแก้ไขเป็นข้อๆ อย่างตรงไปตรงมา สุภาพ อิงหลักวิชาการสากล (ภาษาไทยเหมียว)`;
    }

    else if (agentType === "editor") {
      userPrompt = `คุณคือ แมวบรรณาธิการตรวจภาษาคน (Language Editor & Humanizer Cat - แมว 3)
ร่างบทความวิจัยที่ผ่านการประเมินด้านความถูกต้องทางทฤษฎีจากแมว 2 เรียบร้อยแล้ว:
\"\"\"
${draft}
\"\"\"

งานของคุณคือ:
1. ปรับปรุงระดับสำนวนภาษา การใช้คำศัพท์วิชาการสะกด การเรียงประโยคแกรมม่า ให้มีความลื่นไหล เป็นธรรมชาติ สละสลวยเหมือนมนุษย์เขียนจริง (Humanized Academic English Flow) หลีกเลี่ยงความรู้สึกแข็งกระด้างของการใช้คำพูดแปลทื่อๆ จาก AI
2. คุณต้องลงมือทำการปรับปรุงและตรวจแก้แกรมม่าสะกดลงในเนื้อหาด้วยตัวคุณเองโดยตรงจนสมบูรณ์แบบเสร็จสิ้น (ไม่ต้องวิจารณ์หรือส่งกลับไปให้แมวอื่น ให้แก้เองโดยตรงจนเสร็จเหมียว)
3. คงเนื้อความทฤษฎี สมการสูตร และพารามิเตอร์ทางสถิติไว้ครบถ้วนสมบูรณ์

โปรดตอบกลับเฉพาะเนื้อความของร่างเอกสาร Markdown ที่เกลาภาษาอังกฤษวิชาการเสร็จเรียบร้อยแล้วเท่านั้นเหมียว!`;
    }

    else if (agentType === "librarian") {
      userPrompt = `คุณคือ บรรณารักษ์ผู้จัดการคิวเรตไฟล์ความรู้ (Librarian Cat - แมว 4)
โปรดวิเคราะห์ร่างบทความวิจัยฉบับสมบูรณ์ที่ผ่านการเกลาภาษาเสร็จสิ้นจากแมว 3 ด้านล่างนี้:
\"\"\"
${draft}
\"\"\"

ภารกิจจัดเก็บคลังความรู้สะสม:
1. วิเคราะห์แนวคิด คีย์เวิร์ด หรือหัวข้อสถิติสำคัญที่สะกดเด่นชัด (เช่น ARIMA, LSTM, Kalman Filter หรือหัวข้ออื่นๆ ที่สอดคล้อง)
2. สร้างไฟล์ความรู้ย่อยๆ (Discrete Concept Files) อธิบายสั้นๆ ของหัวข้อเหล่านั้น พร้อมใส่ Obsidian WikiLinks [[ConceptName]] เชื่อมโยงถึงกันอย่างมีระบบ เพื่อให้ Obsidian พล็อตผังกราฟความรู้ได้แม่นยำ
3. สรุปย่อใจความหลักของบทนี้เพื่อเป็น reference ในอนาคต

โปรดตอบกลับในรูปแบบ JSON สตริงที่มีโครงสร้างดังนี้เท่านั้น (ห้ามมีอักษรอื่นนอกเหนือจาก JSON เด็ดขาด เพื่อความถูกต้องในการดึงค่า):
{
  "concepts": [
    {
      "filename": "Research_Knowledge_Index.md",
      "content": "# ดัชนีแผนผังเครือข่ายความรู้ประจำบท 🐾\\n\\nสรุปผังความรู้สะสมที่แมว 4 วิเคราะห์ขึ้นมาค่ะเหมียว:\\n\\n- [[ConceptName]] - อธิบายคอนเซปต์ย่อย..."
    },
    {
      "filename": "ConceptName.md",
      "content": "# ConceptName\\n\\nรายละเอียดทฤษฎีเชิงสถิติ..."
    }
  ],
  "chapter_summary": "สรุปภาพรวมเนื้อหาและระเบียบวิธีวิจัยของบทนี้แบบกระชับ..."
}`;
    }

    else if (agentType === "knowledge-graph") {
      userPrompt = `คุณคือผู้เชี่ยวชาญการสร้างผังความรู้และวิเคราะห์เอกสารวิจัยตั้งต้นเพื่อเริ่มระบบ (Research Setup Catalyst - แมว 4)
โปรดวิเคราะห์ร่างเอกสารดราฟต์และรายงานการทดลอง/ประวัติแล็บ (Notion Logs) ที่ทาสอัปโหลดมาทั้งหมดด้านล่างนี้:
\"\"\"
${draft}
\"\"\"

ภารกิจวิเคราะห์เริ่มโครงการวิจัยหลัก:
1. สกัดแนวคิด คีย์เวิร์ด สถิติ หรือทฤษฎีสำคัญที่เด่นชัด เพื่อแยกสร้างเป็นไฟล์ความรู้เดี่ยว
2. สร้างไฟล์ดัชนีภาพรวม และไฟล์ความรู้ย่อยๆ ในรูปแบบ Obsidian WikiLinks [[ConceptName]]
3. คัดกรองและสกัดข้อมูลอภิวิจัยเพื่อกรอกฟิลด์อัตโนมัติ (ภาษาไทยหรืออังกฤษวิชาการตามข้อมูลจริง ห้ามเมคผล):
   - "extracted_title": หัวข้องานวิจัยหลักที่พยายามนำเสนอ
   - "extracted_methodology": ระเบียบวิธีวิจัย / ทฤษฎีประมวลผลหลัก (เช่น การบูรณาการ ARIMA-LSTM ร่วมกัน หรืออื่นๆ)
   - "extracted_pipeline": ลำดับท่อส่งประมวลผลขั้นตอนสถิติ หรืออัลกอริทึม

โปรดตอบกลับในรูปแบบ JSON สตริงที่มีโครงสร้างดังนี้เท่านั้น (ห้ามมีอักษรอื่นนอกเหนือจาก JSON เด็ดขาด เพื่อความถูกต้องในการดึงถอดรหัส):
{
  "files": [
    {
      "filename": "Research_Knowledge_Index.md",
      "content": "# ดัชนีแผนผังความรู้เริ่มต้น 🐾\\n\\nภาพรวมของคลังปัญญาตั้งต้น:\\n\\n- [[ConceptName]] - อธิบาย..."
    }
  ],
  "extracted_title": "หัวข้อวิจัย...",
  "extracted_methodology": "ระเบียบวิธี...",
  "extracted_pipeline": "ขั้นตอนท่อส่งข้อมูล..."
}`;
    }

    else if (agentType === "coordinator") {
      let formattedHistory = "";
      if (history && history.length > 0) {
        formattedHistory = history.map((h: any) => `${h.role === "user" ? "ทาสผู้วิจัย" : "เลขาเหมียว"}: ${h.text}`).join("\n");
      }

      userPrompt = `คุณคือเลขาสาววิเชียรมาศ (เลขาเหมียว) คุยกับผู้วิจัยผ่านห้องแชทสไตล์ LINE
หน้าที่ของคุณคือรายงานสถานะของเอเจนต์แมววิจัยทั้ง 4 ตัว และประสานงานส่งข้อมูลอย่างฉลาดเฉลียว

ข้อมูลเป้าหมายวิจัยปัจจุบัน:
- หัวข้อวิจัย: ${variables.title || "ยังไม่ได้กำหนดหัวข้อวิจัย"}
- ระเบียบวิธีวิจัย: ${variables.methodology || "ยังไม่ได้ระบุระเบียบวิธีวิจัย"}
- ท่อส่งข้อมูล (Data Pipeline): ${variables.pipeline || "ยังไม่ได้ระบุระบบ"}
- บทวิจัยเป้าหมาย: ${chapter}

คลังองค์ความรู้สะสมและข้อมูลตั้งต้นใน Obsidian Vault (Working Memory & Ingested References):
${obsidianLogs ? obsidianLogs : "ไม่มีประวัติข้อมูลองค์ความรู้ในระบบในขณะนี้"}

สถานะร่างปัจจุบัน:
${draft ? `มีร่างแล้วดังนี้ (ย่อมาบางส่วน):\n\"\"\"\n${draft.substring(0, 800)}\n\"\"\"` : "ยังไม่ได้รับการร่างบทความ (หน้ากระดาษว่างเปล่า)"}

ผลประเมินล่าสุดจากพี่ส้ม (Grumpy Reviewer) ถ้ามี:
${critique ? critique : "ยังไม่ได้รับการประเมินผลเชิงลึก"}

ประวัติบทสนทนาแชทก่อนหน้า:
${formattedHistory ? formattedHistory : "ทาสพึ่งเริ่มต้นพิมพ์ทักทายคุยกับเลขาเหมียว"}

คำสั่งล่าสุดจากผู้วิจัย:
"${latestMessage ? latestMessage : "เลขาเหมียวช่วยแนะนำแผนงานวิจัยหน่อย"}"

โปรดตอบกลับเป็นภาษาไทยที่น่ารัก เป็นกันเอง บันทึกและจ่ายงานให้เพื่อนๆ อย่างเป็นลำดับ โดยให้คำแนะนำที่เป็นสไตล์เลขาแมวเหมียวค่ะ
กฎเหล็กพิเศษสำหรับการจ่ายงาน (Delegate):
1. หากผู้วิจัยสั่งให้ "เริ่มวิจัย", "รันห่วงโซ่", "โยนงานให้แมวทุกตัว", "เริ่มเขียนงานวิจัย", "เริ่มห่วงโซ่การผลิต" หรือสั่งให้เลขาเริ่มทำงานวิจัยหลัก โปรดตอบรับอย่างน่ารักและลงท้ายบรรทัดสุดท้ายด้วย: [DELEGATE: PIPELINE]
2. หากผู้วิจัยสั่งให้ "ร่างบทความ" หรือ "เขียนเนื้อหา" หรือ "แมว 1 ทำงาน" โปรดตอบรับอย่างน่ารักและลงท้ายบรรทัดสุดท้ายด้วย: [DELEGATE: SCRIBE]
3. หากผู้วิจัยสั่งให้ "ส่งตรวจ" หรือ "ให้พี่ส้มตรวจ" หรือ "แมว 2 ทำงาน" โปรดตอบรับอย่างน่ารักและลงท้ายบรรทัดสุดท้ายด้วย: [DELEGATE: REVIEW]
4. หากผู้วิจัยสั่งให้ "เกลาภาษา" หรือ "ขัดเกลาไวยากรณ์" หรือ "แมว 3 ทำงาน" โปรดตอบรับอย่างน่ารักและลงท้ายบรรทัดสุดท้ายด้วย: [DELEGATE: EDITOR]
5. หากผู้วิจัยสั่งให้ "รวบรวมไฟล์" หรือ "จัดบรรณารักษ์" หรือ "แมว 4 ทำงาน" โปรดตอบรับอย่างน่ารักและลงท้ายบรรทัดสุดท้ายด้วย: [DELEGATE: LIBRARIAN]
6. หากผู้วิจัยขอให้ "วิเคราะห์ภารกิจ" หรือ "งานค้าง" หรือถามเรื่องภารกิจวิจัย โปรดตอบรับอย่างน่ารักและลงท้ายด้วยแท็กนี้เพื่อให้ป็อปอัพภารกิจเด้งเปิด: [ACTION: ANALYZE_TASKS]`;
    }

    else {
      // Manager
      userPrompt = `สรุปสถานะการประมวลผลสำหรับบทเรียน ${chapter}
เนื้อความร่างบทความปัจจุบัน:
${draft ? "มีร่างบทความสมบูรณ์อยู่ในแท็บ Workbench" : "ยังไม่มีข้อมูลบทความวิจัย"}

ความคิดเห็นของผู้ประเมินล่าสุด:
${critique || "ยังไม่ได้รับการประเมินความสอดคล้องเชิงทฤษฎี"}

โปรดเขียนอัพเดทสถานะสรุปสไตล์แมวผู้จัดการจอมเก๋า 8-bit ในรูปแบบภาษาไทยน่ารักๆ เพื่อแนะนำว่าผู้ใช้งานควรสั่งรันระบบอย่างไรดีเหมียว!`;
    }

    // Live API Mode via Gemini SDK
    if (actualApiKey && actualApiKey.trim() !== "") {
      try {
        const genAI = new GoogleGenerativeAI(actualApiKey);
        // Using gemini-2.5-flash which is extremely efficient and fast
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash"
        });

        // Prepend system prompt to the userPrompt for maximum compatibility
        const combinedPrompt = `${systemPrompt}\n\n[CONTEXT & MISSION]:\n${userPrompt}`;

        const generationConfig: any = {
          temperature: agentType === "scribe" ? 0.3 : 0.7, // Scribe uses lower temp for zero hallucination!
          maxOutputTokens: 3500,
        };

        if (agentType === "librarian") {
          generationConfig.responseMimeType = "application/json";
        }

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: combinedPrompt }] }],
          generationConfig
        });

        const textResponse = result.response.text();
        return NextResponse.json({ text: textResponse, mode: "api" });
      } catch (err: any) {
        console.error("Gemini API error, falling back to mock mode:", err);
        return NextResponse.json(getMockResponse(agentType, chapter, variables, critique, draft, obsidianLogs, err.message, latestMessage));
      }
    }

    // Mock Mode fallback if no API key is specified
    return NextResponse.json(getMockResponse(agentType, chapter, variables, critique, draft, obsidianLogs, undefined, latestMessage));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Generates high-fidelity academic mocked content in lovely Thai RPG style
function getMockResponse(
  agentType: string,
  chapter: string,
  variables: any,
  critique: string,
  draft: string,
  obsidianLogs?: string,
  errorReason?: string,
  latestMessage: string = ""
) {
  const title = variables.title || "โครงสร้างการพยากรณ์สินค้าคงคลังแบบผสมผสาน";
  const methodology = variables.methodology || "ระบบโครงข่ายประสาทเทียม LSTM ผสมผสานกับแบบจำลอง ARIMA ดั้งเดิม";
  const pipeline = variables.pipeline || "Data Ingestion -> Kalman Filtering -> Feature Scaling -> Joint Model Training";

  let responseText = "";

  if (agentType === "scribe") {
    if (critique) {
      responseText = `# ${chapter}: การออกแบบและระเบียบวิธีวิจัย (ฉบับปรับปรุงใหม่)

## 3.1 ภาพรวมโครงสร้างโมเดลผสมผสาน (Hybrid Model)
ส่วนนี้จะนำเสนอโครงสร้างขั้นตอนการทำงานของโมเดลพยากรณ์แบบผสมผสาน (Hybrid Forecasting Model) ที่ได้รับการปรับปรุงเพื่อตอบสนองต่อข้อเสนอแนะของผู้ประเมินเกี่ยวกับการกำหนดค่าพารามิเตอร์ โครงสร้างที่นำเสนอนี้เป็นการบูรณาการจุดเด่นเชิงเส้นของโมเดล ARIMA เข้ากับขีดความสามารถการเรียนรู้ที่ไม่เป็นเชิงเส้นของโครงข่ายประสาทเทียม Long Short-Term Memory (LSTM)

ทางท่อส่งข้อมูล (Pipeline) ของเราเริ่มต้นจากการรับชุดข้อมูลดิบเข้ามาปรับความเรียบและกรองสัญญาณรบกวนแบบเกาส์เซียน (Gaussian noise) ด้วยตัวกรองคาลมาน (Kalman Filter) ในมิติต่างๆ ก่อนนำเข้าสู่ขั้นตอนถัดไป:

$$\\hat{x}_{k|k} = \\hat{x}_{k|k-1} + K_k(z_k - H_k\\hat{x}_{k|k-1})$$

โดยที่ $K_k$ คือเมทริกซ์อัตราขยายของคาลมาน (Kalman gain matrix) ซึ่งรับประกันการประมาณสถานะที่เหมาะสมที่สุดก่อนที่โครงข่ายประสาทเทียมจะเริ่มทำการเรียนรู้

## 3.2 รายละเอียดการตั้งค่าไฮเปอร์พารามิเตอร์ LSTM (แก้ไขตามคำวิจารณ์)
เพื่อขจัดความกำกวมของโมเดลตามที่ผู้ประเมินได้ชี้แนะ ทางเราขอชี้แจงโครงสร้างเซลล์ของ LSTM ดังนี้:
- **มิติการนำเข้า (Input Dimension):** ค่าตัวแปรตามหลัง (Lag-variables) จำนวน 4 ลำดับ อ้างอิงตามช่วงเวลา 24 ชั่วโมง
- **ชั้นซ่อน (Hidden Layers):** ประกอบด้วยชั้นซ่อนจำนวน 2 ชั้น แต่ละชั้นมีหน่วยย่อย (Hidden units) 64 หน่วย
- **ฟังก์ชันกระตุ้น (Activation Function):** ใช้ฟังก์ชัน Hyperbolic Tangent (tanh) ร่วมกับเกตกระตุ้นแบบ Hard-sigmoid
- **ตัวปรับปรุงค่า (Optimizer):** ใช้ Adam Optimizer กำหนดอัตราการเรียนรู้ที่ $\\eta = 0.001$, $\\beta_1 = 0.9$, และ $\\beta_2 = 0.999$
- **อัตราการสุ่มดรอป (Dropout Rate):** 0.2 ถูกกำหนดระหว่างชั้นเพื่อป้องกันปัญหาการเรียนรู้เกิน (Overfitting)

การนำส่วนประกอบเชิงเส้นที่ประมาณค่าได้จากโมเดล ARIMA เข้าไปเป็นสถานะเซลล์เริ่มต้นของ LSTM ช่วยป้องกันไม่ให้โมเดลเกิดปัญหา Overfitting บนชุดข้อมูลจำกัด ซึ่งถือเป็นจุดแข็งสำคัญที่เหมาะสำหรับการยื่นขออนุมัติตีพิมพ์ในระดับ Scopus Q3/Q4 เหมียว!`;
    } else {
      responseText = `# ${chapter}: โครงสร้างและระเบียบวิธีวิจัยเชิงเสนอแนะ

## 3.1 โครงสร้างของสถาปัตยกรรมแบบไฮบริด
วัตถุประสงค์หลักของระเบียบวิธีวิจัยนี้คือการสร้างกระบวนพยากรณ์ที่มีความทนทานต่อสัญญาณรบกวนโดยใช้วิธีการผสมผสาน (Hybrid Approach) ซึ่งประกอบด้วยสองส่วนหลัก:
1. **การจำลองเชิงเส้นแบบอนุกรมเวลา:** ใช้โมเดล ARIMA ($p, d, q$) ในการสกัดแนวโน้มเชิงเส้นที่เสถียร
2. **การจำลองแบบไม่เป็นเชิงเส้น:** ใช้เซลล์โครงข่าย LSTM เพื่อจับความสัมพันธ์ตามลำดับเวลาในระยะยาว

ท่อส่งข้อมูลหลักจัดเรียงอย่างเป็นระบบดังนี้:
- **การนำเข้าข้อมูล (Data Ingestion):** ดึงข้อมูลระดับคลังสินค้าจากฐานข้อมูลส่วนกลาง
- **การกรองข้อมูล (Kalman Filtering):** กำจัดสัญญาณรบกวนแบบเกาส์เซียนเพื่อให้ได้ค่าฐานข้อมูลที่แม่นยำ
- **การเรียนรู้เชิงลึก (LSTM Encoding):** ฝึกสอนระบบบนค่าความแปรปรวนคงเหลือจากการพยากรณ์เชิงเส้น

\`\`\`
+------------------+     +------------------+     +------------------+
|   ข้อมูลดิบ       | --> |   ตัวกรองคาลมาน  | --> |   ทำนายเชิงเส้น  |
|  (ระดับคลังสินค้า) |     |  (ลดสัญญาณรบกวน) |     |   ด้วย ARIMA     |
+------------------+     +------------------+     +------------------+
                                                               |
                                                               v
+------------------+     +------------------+     +------------------+
|  ทำนายผลลัพธ์รวม | <-- |   ทำนายค่าคงเหลือ| <-- | คำนวณค่าความ     |
| (Hybrid Forecast)|     |   ด้วยโมเดล LSTM |     | เศษเหลือเชิงเส้น |
+------------------+     +------------------+     +------------------+
\`\`\`

## 3.2 รายละเอียดสมการเชิงโครงสร้างผสมผสาน
ผลลัพธ์การคาดการณ์รวม $Y_t$ ที่ตำแหน่งเวลา $t$ คำนวณจากสองขบวนการย่อย:

$$Y_t = L_t + N_t + e_t$$

โดยที่:
- $L_t$ คือองค์ประกอบเชิงเส้นหลัก (Linear trend element) ที่พยากรณ์ได้จากโมเดล ARIMA
- $N_t$ คือองค์ประกอบที่ไม่เป็นเชิงเส้น (Non-linear element) คาดการณ์ด้วย LSTM network
- $e_t$ คือสัญญาณรบกวนระบบที่เหลือตกค้าง (Residual white noise error)`;
    }
  }

  else if (agentType === "reviewer") {
    const isMockPass = latestMessage.includes("ผ่าน") || latestMessage.includes("pass") || latestMessage.includes("รัน");
    if (isMockPass) {
      responseText = `[SCORE: 86] [PASS]
เหมียว! พี่ส้มกวาดตาสแกนบทความที่แมว 1 ร่างแก้ไขเรียบร้อยแล้วค่ะ! โครงสร้างวิจัยสมมาตรและสมบูรณ์แบบมาก:
1. การระบุไฮเปอร์พารามิเตอร์ของชั้นซ่อน LSTM ครบถ้วน (64 units, 2 layers, Adam optimizer) ปราศจากความกังขาเชิงสถิติ
2. อธิบายจุดเชื่อมต่อระหว่างค่าฟิลเตอร์คาร์ลมานและโมเดลพยากรณ์เชิงเส้นได้ถูกต้องชัดเจน
3. สมการ LaTeX มีความถูกต้องตามหลักการวิชาการวิจัยระดับ Scopus Q3/Q4 มอบสถานะผ่าน [PASS] ไปเกลาภาษากับแมว 3 ต่อได้เลยเหมียว!`;
    } else {
      responseText = `[SCORE: 72] [FAIL]
ขู่ฟ่อ! 😾 พี่ส้มปัดตกผลงานวิจัยนี้ค่ะเหมียว! ร่างเขียนบทความนี้ยังมีข้อบกพร่องสำคัญตามมาตรฐาน Scopus ดังนี้:
1. **ขาดพารามิเตอร์ LSTM:** แมว 1 ลืมระบุความลึกของชั้นซ่อน (Hidden units number) และฟังก์ชันการเรียนรู้ (Optimizer) ทำให้อ่านแล้วจับต้องไม่ได้เชิงวิชาการ!
2. **สมการลอยๆ:** ตัวกรองคาลมาน (Kalman Filter) ถูกระบุขึ้นมาลอยๆ แต่ไม่ได้มีสูตรอธิบายว่าอัตราขยายคาลมาน $K_k$ สกัดความชื้นของข้อมูลอย่างไร
3. **การเชื่อมโยงต่ำ:** ขาดการอธิบายความสัมพันธ์ว่า ARIMA นำส่งเศษเหลือ (Residuals) ไปฝึกสอน LSTM อย่างไรให้เกิดการประเมินที่มีประสิทธิภาพ

โปรดนำข้อวิจารณ์ทั้ง 3 ข้อนี้ส่งกลับให้ แมว 1 เขียนขยายเนื้อความเพื่อแก้ไขและอุดรอยรั่วนี้โดยเร็วด้วยเหมียว!`;
    }
  }

  else if (agentType === "editor") {
    responseText = `# ${chapter} (Language Polished & Humanized)

🐾 *[ขัดเกลาสำนวนและขจัดความแข็งกระด้างโดยกองบรรณาธิการ แมว 3]*

## 3.1 Integrated Hybrid Model Framework
In the realm of advanced inventory analytics, predicting stock levels with high accuracy remains a persistent challenge due to market volatilities. To address this, we present a robust, mathematically integrated hybrid forecasting framework. This model gracefully harmonizes the classical linear stability of the AutoRegressive Integrated Moving Average (ARIMA) with the non-linear learning capability of the Long Short-Term Memory (LSTM) network.

The dynamic data pipeline begins by reading the raw warehouse stock records. To safeguard our statistical models against gaussian irregularities and sensory delay anomalies, a multi-dimensional Kalman Filter is employed:

$$\\hat{x}_{k|k} = \\hat{x}_{k|k-1} + K_k(z_k - H_k\\hat{x}_{k|k-1})$$

Where $K_k$ represents the optimal Kalman gain matrix, which ensures state optimization prior to deep neural training.

## 3.2 Hyperparameter Specifications and Neural Training Architecture
To ensure rigorous reproducibility and eliminate model ambiguity, the network configurations for the deep learning component are systematically structured as follows:
- **Input Dimensions:** The temporal sequence is set to 4 lag-variables, mirroring a 24-hour observation cycle.
- **Hidden Layer Depth:** The recurrent neural network comprises two hidden layers, with each layer containing exactly 64 hidden units.
- **Activation Functions:** The hyperbolic tangent (tanh) activation is utilized in the cell state, paired with hard-sigmoid recurrent gating.
- **Optimization Strategy:** Weights are optimized using the Adam optimizer, with learning parameters initialized at $\\eta = 0.001$, $\\beta_1 = 0.9$, and $\\beta_2 = 0.999$.
- **Regularization:** A dropout rate of 0.2 is strictly applied between hidden layers to mitigate potential overfitting risks.

By embedding the linear estimates extracted from the ARIMA model as initialized cell states within the LSTM network, we successfully prevent overfitting on sparse inventory datasets. This structural symmetry provides a powerful, highly publishable foundation fully compliant with Scopus Q3/Q4 journal standards.`;
  }

  else if (agentType === "librarian") {
    const graphData = {
      concepts: [
        {
          filename: "Research_Knowledge_Index.md",
          content: `# ดัชนีแผนผังความรู้งานวิจัยพยากรณ์สินค้าคงคลัง 🐾\n\nยินดีต้อนรับสู่เครือข่ายความรู้ระบบพยากรณ์ผสมผสาน (Hybrid Inventory Forecasting) ที่บรรณารักษ์เหมียวช่วยสกัดแยกไฟล์ Wikilinks ใน Obsidian ค่ะ!\n\nเมื่อทาสเปิดดูในโปรแกรม Obsidian แผนผังคอนเซปต์เหล่านี้จะเชื่อมโยงกันเป็นโครงข่ายวิจัยวิชาการที่งดงามเหมียว!\n\n## 📌 คอนเซปต์หลักในสารบบความรู้วิจัย:\\n- [[Hybrid_Forecasting_Architecture]] - สถาปัตยกรรมจำลองหลักแบบผสมผสาน\\n- [[Kalman_Noise_Filter]] - การกรองสิ่งรบกวนสัญญาณในข้อมูลดิบ\\n- [[ARIMA_Time_Series]] - แบบจำลองเชิงเส้นสำหรับอนุกรมเวลาคลาสสิก\\n- [[LSTM_Recurrent_Neural_Network]] - โครงข่ายเซลล์ประสาทเรียนรู้ระยะยาวประเมิน residual\\n\\n## 🔗 เส้นสายความเชื่อมโยงเชิงสถิติ:\\n- ข้อมูลดิบถูกปรับปรุงให้สะอาดด้วย [[Kalman_Noise_Filter]]\\n- ข้อมูลความสะอาดถูกป้อนเข้า [[ARIMA_Time_Series]] เพื่อทำนายผลลัพธ์เชิงเส้น\\n- ค่าเศษเหลือคงเหลือ (Residual) ถูกสกัดไปป้อนสอนความจำเข้าสู่ [[LSTM_Recurrent_Neural_Network]]\\n- ผลการพยากรณ์ทั้งสองส่วนรวมกันจนเกิดสถาปัตยกรรม [[Hybrid_Forecasting_Architecture]]`
        },
        {
          filename: "Hybrid_Forecasting_Architecture.md",
          content: `# Hybrid Forecasting Architecture (สถาปัตยกรรมผสมผสานหลัก)\\n\\nกรอบการวิจัยที่ผสมผสานจุดแข็งระหว่างโมเดลคลาสสิกและโมเดลการเรียนรู้เชิงลึกเหมียว!\\n\\n## 🔍 โครงสร้างความร่วมมือ:\\n- การรวมกลุ่มสมการหลัก: $Y_t = L_t + N_t + e_t$\\n- นำเอาสัญญาณข้อมูลที่ล้างสัญญาณด้วย [[Kalman_Noise_Filter]] เข้าประมวลผล\\n- รวมผลลัพธ์ส่วนที่เป็นเส้นตรงของ [[ARIMA_Time_Series]] และส่วนที่ผันผวนสูงจาก [[LSTM_Recurrent_Neural_Network]]`
        },
        {
          filename: "Kalman_Noise_Filter.md",
          content: `# Kalman Noise Filter (การกรองสิ่งรบกวนสัญญาณ)\\n\\nตัวกรองสัญญาณรบกวนสุ่มสีขาว (White Noise) ในงานวิจัยสินค้าคงคลังเหมียว!\\n\\n## ⚙️ หน้าที่เชิงสถิติ:\\n- ลดการเหวี่ยงตัวของข้อมูลที่เกิดจากความล่าช้าการบันทึกหรือ Gaussian Noise\\n- นำส่งส่งต่อผลลัพธ์ที่ปรับปรุงความเรียบแล้วเพื่อใช้ในการคำนวณแนวโน้มใน [[ARIMA_Time_Series]]\\n- เป็นฐานความแม่นยำให้กับต้นแบบพยากรณ์รวม [[Hybrid_Forecasting_Architecture]]`
        },
        {
          filename: "ARIMA_Time_Series.md",
          content: `# ARIMA Time Series (แบบจำลองเชิงเส้นอนุกรมเวลา)\\n\\nแบบจำลอง AutoRegressive Integrated Moving Average สำหรับดึงพารามิเตอร์แนวโน้มเชิงเส้นเหมียว!\\n\\n## 📊 การทำงานสถิติ:\\n- คำนวณแนวโน้มเชิงเส้นหลักจากผลกรองของ [[Kalman_Noise_Filter]]\\n- ส่งมอบค่าเศษเหลือผันผวนสูง (Residual variance) ไปให้ [[LSTM_Recurrent_Neural_Network]] เรียนรู้หาพฤติกรรมที่ไม่เป็นเชิงเส้นต่อ\\n- เป็นฟันเฟืองแนวราบสำคัญของ [[Hybrid_Forecasting_Architecture]]`
        },
        {
          filename: "LSTM_Recurrent_Neural_Network.md",
          content: `# LSTM Recurrent Neural Network (โครงข่ายเซลล์ประสาทเรียนรู้ระยะยาว)\\n\\nLong Short-Term Memory เซลล์ประมวลผลเชิงลึกสำหรับจำรูปแบบความผันผวนเหมียว!\\n\\n## 🧠 บทบาทปัญญาประดิษฐ์:\\n- เรียนรู้รูปแบบที่ไม่เป็นเชิงเส้น (Non-linear behaviors) จากค่าความแปรปรวนคงเหลือของ [[ARIMA_Time_Series]]\\n- ป้องกันปัญหาความแปรปรวนคงค้าง (Residual drift) ของกระบวนการหลัก\\n- ประกอบร่างเป็นพยากรณ์ส่วนท้ายของ [[Hybrid_Forecasting_Architecture]]`
        }
      ],
      chapter_summary: "สถาปัตยกรรมลูกผสมเชิงประจักษ์: ประกอบด้วย ARIMA linear forecasting และ LSTM residual variance fitting บันทึกลง Obsidian Vault เรียบร้อยเหมียว"
    };
    responseText = JSON.stringify(graphData);
  }

  else if (agentType === "knowledge-graph") {
    const graphData = {
      files: [
        {
          filename: "Research_Knowledge_Index.md",
          content: `# ดัชนีแผนผังความรู้งานวิจัยพยากรณ์สินค้าคงคลัง 🐾\n\nยินดีต้อนรับสู่เครือข่ายความรู้ระบบพยากรณ์ผสมผสาน (Hybrid Inventory Forecasting) ที่บรรณารักษ์เหมียวช่วยสกัดแยกไฟล์ Wikilinks ใน Obsidian ค่ะ!\n\nเมื่อทาสเปิดดูในโปรแกรม Obsidian แผนผังคอนเซปต์เหล่านี้จะเชื่อมโยงกันเป็นโครงข่ายวิจัยวิชาการที่งดงามเหมียว!\\n\\n## 📌 คอนเซปต์หลักในสารบบความรู้วิจัย:\\n- [[Hybrid_Forecasting_Architecture]] - สถาปัตยกรรมจำลองหลักแบบผสมผสาน\\n- [[Kalman_Noise_Filter]] - การกรองสิ่งรบกวนสัญญาณในข้อมูลดิบ\\n- [[ARIMA_Time_Series]] - แบบจำลองเชิงเส้นสำหรับอนุกรมเวลาคลาสสิก\\n- [[LSTM_Recurrent_Neural_Network]] - โครงข่ายเซลล์ประสาทเรียนรู้ระยะยาวประเมิน residual`
        }
      ],
      extracted_title: "สถาปัตยกรรมโมเดลผสมพยากรณ์สินค้าคงคลัง (Hybrid Inventory Forecasting)",
      extracted_methodology: "การบูรณาการระบบประสาท LSTM ร่วมกับแบบจำลองอนุกรมเวลา ARIMA เชิงคณิตศาสตร์",
      extracted_pipeline: "Data Ingestion -> Kalman noise reduction -> ARIMA linear modeling -> Residual extraction -> LSTM neural training -> Dynamic aggregation."
    };
    responseText = JSON.stringify(graphData);
  }

  else if (agentType === "coordinator") {
    if (latestMessage.includes("เริ่ม") || latestMessage.includes("pipeline") || latestMessage.includes("รัน")) {
      responseText = `ค่ะเหมียว! ทาสสั่งให้รันห่วงโซ่การผลิตห้าประสาทแมวอัตโนมัติแล้ว! เลขาสาววิเชียรมาศประสานงานเรียกรวมพล แมว 1, แมว 2, แมว 3, และแมว 4 เริ่มต้นลุยสกัดวิจัย ป้องกัน Zero Hallucination คุมเกณฑ์ Scopus Q3/Q4 เลยทันทีค่ะเหมียว! 🐾

[DELEGATE: PIPELINE]`;
    } else {
      responseText = `ยินดีรับใช้วางแผนงานวิจัยค่ะทาส! เลขาเหมียวประเมินคลังสะสม Obsidian เรียบร้อย มีไฟล์ความจำแล้วค่ะ ทาสต้องการพิมพ์สั่งอะไรเลขา หรือต้องการให้รันกระบวนการห้าแมวตัวเขียนงานแบบไหลต่อเนื่องผ่านห่วงโซ่การผลิต [DELEGATE: PIPELINE] เลยดีคะเหมียว?`;
    }
  }

  else {
    responseText = `ผู้จัดการเหมียววิเคราะห์ระบบเรียบร้อย! 🐾 แมวนักเขียนหลวงได้เตรียม Workbench สำหรับหัวข้อ "${title}" ไว้อย่างเสร็จสรรพแล้ว แต่พี่ส้ม (Grumpy Reviewer) กำลังนอนสัปหงกและพร้อมขย้ำตรวจร่างใหม่ของทาสอยู่ค่ะ! ทาสอยากเริ่มต้นรันระบบหรือจะวางแผนร่วมกับเลขาเหมียวก่อนดีคะเหมียว?`;
  }

  return {
    text: responseText,
    mode: "mock",
    notice: errorReason ? `เปลี่ยนเข้าสู่การจำลองแบบโลคัล 8-bit (เกิดข้อผิดพลาดของ Gemini: ${errorReason})` : "ทำงานในโหมดจำลองแบบโลคัล 8-bit ภาษาไทยสมบูรณ์"
  };
}
