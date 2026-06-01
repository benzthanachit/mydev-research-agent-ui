import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Cold storage folder in the local project workspace
const PROJECT_WORKSPACE_COLD_STORAGE = path.join(process.cwd(), "notebooklm-cold-storage");

async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chapter = "Chapter 1: Introduction", title = "Untitled Research", content = "", webhookUrl = "" } = body;

    // 1. Log and save to local workspace cold storage folder
    await ensureDirectoryExists(PROJECT_WORKSPACE_COLD_STORAGE);
    
    // Clean filename (e.g., Chapter_3_Methodology.md)
    const safeFilename = `${chapter.replace(/[^a-z0-9]/gi, "_")}.md`;
    const targetFilePath = path.join(PROJECT_WORKSPACE_COLD_STORAGE, safeFilename);

    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
    
    const lockedHeader = `---
type: Locked Chapter
chapter: "${chapter}"
research_title: "${title}"
locked_at: "${timestamp}"
status: "Finalized - Cold Storage"
---

# FINALIZED & LOCKED: ${chapter}
**Research Title:** ${title}
**Locked At:** ${timestamp}

---

${content}
`;

    await fs.writeFile(targetFilePath, lockedHeader, "utf-8");

    // 2. Trigger external webhook if provided
    let webhookStatus = "not_configured";
    let webhookResponseText = "";

    if (webhookUrl && webhookUrl.trim() !== "") {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: "chapter_locked",
            chapter,
            title,
            timestamp,
            content
          }),
        });

        webhookStatus = response.ok ? "success" : "failed";
        webhookResponseText = await response.text();
      } catch (err: any) {
        webhookStatus = "error";
        webhookResponseText = err.message;
        console.error("External NotebookLM Webhook failed:", err);
      }
    }

    return NextResponse.json({
      success: true,
      filename: safeFilename,
      localPath: targetFilePath,
      webhookStatus,
      webhookDetails: webhookResponseText || "No external webhook triggered.",
      message: `Successfully locked ${chapter} and saved to cold storage.`
    });

  } catch (error: any) {
    console.error("NotebookLM Ingestion Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Allows retrieving the list of locked chapters
    if (!existsSync(PROJECT_WORKSPACE_COLD_STORAGE)) {
      return NextResponse.json({ success: true, lockedChapters: [] });
    }

    const files = await fs.readdir(PROJECT_WORKSPACE_COLD_STORAGE);
    const mdFiles = files.filter(f => f.endsWith(".md"));

    const lockedDetails = await Promise.all(
      mdFiles.map(async (name) => {
        const stats = await fs.stat(path.join(PROJECT_WORKSPACE_COLD_STORAGE, name));
        return {
          name,
          chapter: name.replace(/_/g, " ").replace(".md", ""),
          lockedAt: stats.mtime,
          size: stats.size
        };
      })
    );

    return NextResponse.json({
      success: true,
      lockedChapters: lockedDetails
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
