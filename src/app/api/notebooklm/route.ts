import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { spawn } from "child_process";

// Cold storage folder in the local project workspace
const PROJECT_WORKSPACE_COLD_STORAGE = path.join(process.cwd(), "notebooklm-cold-storage");

async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Stdio MCP Client Runner for Google NotebookLM MCP Server
function runNotebookLmMcpTool(toolName: string, args: any): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log(`[MCP CLIENT] Spawning notebooklm-mcp to run tool: ${toolName}...`);

    // Spawns npx with the notebooklm-mcp server
    // Using shell: true ensures command discovery works perfectly on both macOS and Windows
    const child = spawn("npx", ["-y", "notebooklm-mcp@latest"], {
      env: { ...process.env },
      shell: true
    });

    let buffer = "";
    let step = 0; // 0: Handshake, 1: Waiting for tool execution

    // Set a robust timeout (e.g. 90 seconds for auth setups, 45 seconds for uploads)
    const timeoutDuration = toolName === "setup_auth" ? 90000 : 45000;
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`MCP Tool call '${toolName}' timed out after ${timeoutDuration / 1000}s. Make sure npx is installed and network is stable.`));
    }, timeoutDuration);

    child.stdout.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Save partial line

      for (const line of lines) {
        if (!line.trim()) continue;
        console.log(`[MCP STDOUT]:`, line);

        try {
          const response = JSON.parse(line);

          // Step 1: Complete the MCP Handshake
          if (step === 0 && response.id === 1) {
            console.log("[MCP CLIENT] Handshake successful. Sending initialized notification...");
            
            // Send initialized notification
            child.stdin.write(JSON.stringify({
              jsonrpc: "2.0",
              method: "notifications/initialized"
            }) + "\n");

            // Execute the requested tool
            step = 1;
            console.log(`[MCP CLIENT] Calling tool '${toolName}' with arguments:`, args);
            child.stdin.write(JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: toolName,
                arguments: args
              }
            }) + "\n");
          } 
          
          // Step 2: Handle Tool Call Response
          else if (step === 1 && response.id === 2) {
            console.log(`[MCP CLIENT] Tool '${toolName}' completed execution successfully!`);
            clearTimeout(timeout);
            child.kill();
            
            if (response.error) {
              reject(new Error(response.error.message || "MCP Tool returned an error."));
            } else {
              resolve(response.result);
            }
          }
        } catch (err) {
          // Parse errors are expected for debug lines / server logs
        }
      }
    });

    child.stderr.on("data", (data) => {
      console.warn("[MCP STDERR]:", data.toString());
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("exit", (code) => {
      clearTimeout(timeout);
      if (step < 1) {
        reject(new Error(`MCP subprocess exited prematurely with code ${code}.`));
      }
    });

    // Start MCP Handshake: send 'initialize' request
    const initReq = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "Meow-nuscript-Foundry-Client",
          version: "1.0.0"
        }
      }
    };
    child.stdin.write(JSON.stringify(initReq) + "\n");
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      action = "archive", // 'archive' (standard local/webhook) | 'setup_auth' | 'add_source'
      chapter = "Chapter 3: Methodology", 
      title = "Untitled Research", 
      content = "", 
      webhookUrl = "",
      notebookId = ""
    } = body;

    // Direct MCP Setup Auth
    if (action === "setup_auth") {
      try {
        const mcpResult = await runNotebookLmMcpTool("setup_auth", { show_browser: true });
        return NextResponse.json({
          success: true,
          mcpResult,
          message: "NotebookLM MCP Authentication Window opened and setup completed."
        });
      } catch (err: any) {
        console.error("MCP setup_auth failed:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    // Direct MCP Health Status Check
    if (action === "get_health") {
      try {
        const mcpResult = await runNotebookLmMcpTool("get_health", {});
        return NextResponse.json({
          success: true,
          authenticated: mcpResult.authenticated,
          mcpResult
        });
      } catch (err: any) {
        console.error("MCP get_health failed:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    // Direct MCP Add Source Ingestion
    if (action === "add_source") {
      try {
        // Compile clean upload content
        const cleanContent = `Finalized Manuscript: ${chapter}\nTitle: ${title}\n\n${content}`;
        const mcpResult = await runNotebookLmMcpTool("add_source", {
          type: "text",
          content: cleanContent,
          title: chapter,
          notebook_id: notebookId || undefined
        });

        // Also archive it locally for offline backup
        await ensureDirectoryExists(PROJECT_WORKSPACE_COLD_STORAGE);
        const safeFilename = `${chapter.replace(/[^a-z0-9]/gi, "_")}.md`;
        const targetFilePath = path.join(PROJECT_WORKSPACE_COLD_STORAGE, safeFilename);
        await fs.writeFile(targetFilePath, `# LOCKED CHAPTER: ${chapter}\n\n${content}`, "utf-8");

        return NextResponse.json({
          success: true,
          mcpResult,
          localPath: targetFilePath,
          message: `Successfully pushed '${chapter}' straight into Google NotebookLM via direct MCP server!`
        });
      } catch (err: any) {
        console.error("MCP add_source failed:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    // Default 'archive' Action: Webhook + Local Workspace Save
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

    // Trigger external webhook if provided
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
