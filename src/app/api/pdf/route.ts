import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileBase64, filePath, filename, apiKey } = body;
    const actualApiKey = apiKey || process.env.GEMINI_API_KEY;

    let cleanBase64 = "";

    if (filePath && filePath.trim() !== "") {
      try {
        const absolutePath = path.isAbsolute(filePath)
          ? filePath
          : path.resolve(process.cwd(), filePath);

        if (!fs.existsSync(absolutePath)) {
          return NextResponse.json({ error: `ไม่พบไฟล์ในเครื่องตามพาธที่ระบุเหมียว: ${absolutePath}` }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(absolutePath);
        cleanBase64 = fileBuffer.toString("base64");
      } catch (fileErr: any) {
        return NextResponse.json({ error: `ไม่สามารถเปิดอ่านไฟล์จากเครื่องตรงๆ ได้: ${fileErr.message}` }, { status: 500 });
      }
    } else if (fileBase64 && fileBase64.trim() !== "") {
      // Extract the raw base64 data if it contains data URI prefix like "data:application/pdf;base64,"
      cleanBase64 = fileBase64;
      if (fileBase64.includes(";base64,")) {
        cleanBase64 = fileBase64.split(";base64,")[1];
      }
    } else {
      return NextResponse.json({ error: "ไม่พบข้อมูลไฟล์ PDF แบบ Base64 หรือพาธไฟล์ filePath เหมียว" }, { status: 400 });
    }

    // 1. If we have a live API key, call the Gemini Multimodal API!
    if (actualApiKey && actualApiKey.trim() !== "") {
      try {
        const genAI = new GoogleGenerativeAI(actualApiKey);
        // Use gemini-2.5-flash which has amazing native PDF support
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash"
        });

        const pdfPart = {
          inlineData: {
            data: cleanBase64,
            mimeType: "application/pdf"
          }
        };

        const systemInstruction = "คุณคือผู้เชี่ยวชาญการสร้างคลังความรู้วิจัยและออกแบบแผนผังเครือข่ายความรู้ (Knowledge Graph Architect) 🕸️. หน้าที่ของคุณคือการสกัดความรู้วิจัยภาษาไทยหรืออังกฤษของเอกสาร PDF อัพโหลดนี้ และออกแบบโครงข่ายความคิดเชื่อมโยงเชิงลึกใน Obsidian โดยใช้ WikiLinks [[ConceptName]].";

        const prompt = `${systemInstruction}

โปรดวิเคราะห์เอกสาร PDF นี้ และสร้างระบบคลังความรู้แบบเชื่อมโยง (Obsidian Knowledge Graph) ในภาษาไทย โดยสกัดข้อมูลวิจัยนี้ออกเป็นหัวข้อย่อยที่มีความสัมพันธ์เชื่อมต่อกันแบบเครือข่ายผ่านลิงก์วิกิพีเดียสองชั้นของ Obsidian: [[ConceptName]]

โปรดออกแบบและตอบกลับในรูปแบบ JSON สตริงที่มีโครงสร้างดังนี้เท่านั้น (ห้ามตอบคำอื่นนอกเหนือจาก JSON สตริงเด็ดขาด และห้ามมีอักขระพิเศษหรือมาร์กดาวน์โค้ดบล็อกที่ขัดขวางการแปลงเป็นวัตถุ):
{
  "files": [
    {
      "filename": "Research_Knowledge_Index.md",
      "content": "# ดัชนีคลังความรู้งานวิจัย 🐾\\n\\nสรุปภาพรวมแผนผังเครือข่ายความรู้ที่วิเคราะห์ขึ้นมาจากเอกสาร PDF ของคุณค่ะ:\\n\\n## คอนเซปต์หลักในงานวิจัย\\n- [[ARIMA]] - โมเดลเชิงเส้นอนุกรมเวลา\\n- [[LSTM]] - การเรียนรู้เชิงลึกแบบจดจำตามเวลา\\n- [[Kalman_Filter]] - การกรองสัญญาณรบกวนของข้อมูล\\n- [[Hybrid_Forecasting]] - สถาปัตยกรรมผสมผสาน\\n\\n## ความสัมพันธ์\\n[[Kalman_Filter]] จะนำส่งข้อมูลปรับความเรียบให้ [[ARIMA]] จากนั้นส่ง residual ไปฝึกสอน [[LSTM]] รวมกันเป็น [[Hybrid_Forecasting]]"
    },
    {
      "filename": "ARIMA.md",
      "content": "# ARIMA (AutoRegressive Integrated Moving Average)\\n\\nโมเดลพยากรณ์เชิงเส้นทางอนุกรมเวลา ทำหน้าที่พยากรณ์แนวโน้มในส่วนเชิงเส้น (Linear Trend) ใน [[Hybrid_Forecasting]]\\n\\n- **ความสัมพันธ์:** สกัดข้อมูลคงคลังดิบที่ปรับความเรียบด้วย [[Kalman_Filter]] และส่งค่า residual ไปให้ [[LSTM]] เรียนรู้ต่อ"
    }
  ]
}

โปรดสร้างไฟล์ Markdown อย่างน้อย 4-5 ไฟล์ที่เชื่อมโยงกันอย่างเป็นระบบ เพื่อให้เกิดแผนผัง Knowledge Graph ที่งดงามเมื่อเปิดบนโปรแกรม Obsidian!`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [pdfPart, { text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
          }
        });
        const textResponse = result.response.text();

        // Robust JSON parsing with fallback
        let parsed;
        try {
          const cleanedStr = textResponse.trim();
          try {
            parsed = JSON.parse(cleanedStr);
          } catch {
            const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
            const match = cleanedStr.match(jsonBlockRegex);
            let candidate = cleanedStr;
            if (match && match[1]) {
              candidate = match[1].trim();
            }
            
            try {
              parsed = JSON.parse(candidate);
            } catch (candErr) {
              const firstBrace = candidate.indexOf("{");
              const lastBrace = candidate.lastIndexOf("}");
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const braceJson = candidate.substring(firstBrace, lastBrace + 1);
                const safeJson = braceJson.replace(/,(\s*[\]}])/g, "$1");
                parsed = JSON.parse(safeJson);
              } else {
                throw candErr;
              }
            }
          }
        } catch (jsonErr: any) {
          console.error("JSON parsing error on PDF response text:", jsonErr, textResponse);
          throw new Error(`รูปแบบ JSON สแตกโครงสร้างผิดพลาด: ${jsonErr.message}`);
        }

        return NextResponse.json({
          success: true,
          files: parsed.files || [],
          mode: "api"
        });
      } catch (err: any) {
        console.error("Gemini PDF parsing error, falling back to mock mode:", err);
        return NextResponse.json(getMockResponse(err.message));
      }
    }

    // 2. Mock mode fallback if no API key is provided
    return NextResponse.json(getMockResponse());

  } catch (error: any) {
    console.error("Server-side PDF API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getMockResponse(errorReason?: string) {
  const graphData = {
    success: true,
    mode: "mock",
    notice: errorReason ? `สลับเข้าสู่โหมดจำลองพล็อตผังกราฟเหมียว (เกิดข้อผิดพลาดในการรัน Gemini: ${errorReason})` : "จำลองการพล็อตสร้าง Obsidian Knowledge Graph จากไฟล์ PDF ภาษาไทยสมบูรณ์",
    files: [
      {
        filename: "Research_Knowledge_Index.md",
        content: `# ดัชนีแผนผังความรู้งานวิจัยพยากรณ์สินค้าคงคลัง 🐾\n\nยินดีต้อนรับสู่เครือข่ายความรู้ระบบพยากรณ์ผสมผสาน (Hybrid Inventory Forecasting) ที่สกัดออกมาจากไฟล์ PDF ของทาสรักผ่านระบบปัญญาประดิษฐ์ Gemini ค่ะ!\n\nเมื่อทาสเปิดดูในโปรแกรม Obsidian แผนผังคอนเซปต์เหล่านี้จะเชื่อมโยงกันเป็นโครงข่ายวิจัยวิชาการที่งดงามเหมียว!\n\n## 📌 คอนเซปต์หลักในสารบบความรู้วิจัย:\n- [[Hybrid_Forecasting_Architecture]] - สถาปัตยกรรมจำลองหลักแบบผสมผสาน\n- [[Kalman_Noise_Filter]] - การกรองสิ่งรบกวนสัญญาณในข้อมูลดิบ\n- [[ARIMA_Time_Series]] - แบบจำลองเชิงเส้นสำหรับอนุกรมเวลาคลาสสิก\n- [[LSTM_Recurrent_Neural_Network]] - โครงข่ายเซลล์ประสาทเรียนรู้ระยะยาวประเมิน residual\n\n## 🔗 เส้นสายความเชื่อมโยงเชิงสถิติ:\n- ข้อมูลดิบถูกปรับปรุงให้สะอาดด้วย [[Kalman_Noise_Filter]]\n- ข้อมูลความสะอาดถูกป้อนเข้า [[ARIMA_Time_Series]] เพื่อทำนายผลลัพธ์เชิงเส้น\n- ค่าเศษเหลือคงเหลือ (Residual) ถูกสกัดไปป้อนสอนความจำเข้าสู่ [[LSTM_Recurrent_Neural_Network]]\n- ผลการพยากรณ์ทั้งสองส่วนรวมกันจนเกิดสถาปัตยกรรม [[Hybrid_Forecasting_Architecture]]`
      },
      {
        filename: "Hybrid_Forecasting_Architecture.md",
        content: `# Hybrid Forecasting Architecture (สถาปัตยกรรมผสมผสานหลัก)\n\nกรอบการวิจัยที่ผสมผสานจุดแข็งระหว่างโมเดลคลาสสิกและโมเดลการเรียนรู้เชิงลึกเหมียว!\n\n## 🔍 โครงสร้างความร่วมมือ:\n- การรวมกลุ่มสมการหลัก: $Y_t = L_t + N_t + e_t$\n- นำเอาสัญญาณข้อมูลที่ล้างสัญญาณด้วย [[Kalman_Noise_Filter]] เข้าประมวลผล\n- รวมผลลัพธ์ส่วนที่เป็นเส้นตรงของ [[ARIMA_Time_Series]] และส่วนที่ผันผวนสูงจาก [[LSTM_Recurrent_Neural_Network]]`
      },
      {
        filename: "Kalman_Noise_Filter.md",
        content: `# Kalman Noise Filter (การกรองสิ่งรบกวนสัญญาณ)\n\nตัวกรองสัญญาณรบกวนสุ่มสีขาว (White Noise) ในงานวิจัยสินค้าคงคลังเหมียว!\n\n## ⚙️ หน้าที่เชิงสถิติ:\n- ลดการเหวี่ยงตัวของข้อมูลที่เกิดจากความล่าช้าการบันทึกหรือ Gaussian Noise\n- นำส่งส่งต่อผลลัพธ์ที่ปรับปรุงความเรียบแล้วเพื่อใช้ในการคำนวณแนวโน้มใน [[ARIMA_Time_Series]]\n- เป็นฐานความแม่นยำให้กับต้นแบบพยากรณ์รวม [[Hybrid_Forecasting_Architecture]]`
      },
      {
        filename: "ARIMA_Time_Series.md",
        content: `# ARIMA Time Series (แบบจำลองเชิงเส้นอนุกรมเวลา)\n\nแบบจำลอง AutoRegressive Integrated Moving Average สำหรับดึงพารามิเตอร์แนวโน้มเชิงเส้นเหมียว!\n\n## 📊 การทำงานสถิติ:\n- คำนวณแนวโน้มเชิงเส้นหลักจากผลกรองของ [[Kalman_Noise_Filter]]\n- ส่งมอบค่าเศษเหลือผันผวนสูง (Residual variance) ไปให้ [[LSTM_Recurrent_Neural_Network]] เรียนรู้หาพฤติกรรมที่ไม่เป็นเชิงเส้นต่อ\n- เป็นฟันเฟืองแนวราบสำคัญของ [[Hybrid_Forecasting_Architecture]]`
      },
      {
        filename: "LSTM_Recurrent_Neural_Network.md",
        content: `# LSTM Recurrent Neural Network (โครงข่ายเซลล์ประสาทเรียนรู้ระยะยาว)\n\nLong Short-Term Memory เซลล์ประมวลผลเชิงลึกสำหรับจำรูปแบบความผันผวนเหมียว!\n\n## 🧠 บทบาทปัญญาประดิษฐ์:\n- เรียนรู้รูปแบบที่ไม่เป็นเชิงเส้น (Non-linear behaviors) จากค่าความแปรปรวนคงเหลือของ [[ARIMA_Time_Series]]\n- ป้องกันปัญหาความแปรปรวนคงค้าง (Residual drift) ของกระบวนการหลัก\n- ประกอบร่างเป็นพยากรณ์ส่วนท้ายของ [[Hybrid_Forecasting_Architecture]]`
      }
    ]
  };
  return graphData;
}
