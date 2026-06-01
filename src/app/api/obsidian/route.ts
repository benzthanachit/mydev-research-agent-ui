import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Fallback vault directory located inside the project workspace
const PROJECT_WORKSPACE_FALLBACK_VAULT = path.join(process.cwd(), "obsidian-vault");

async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action = "list", filename = "Decision_Logs.md", content = "", vaultPath = "" } = body;

    // Use configured vault path or fall back to the project's local vault folder
    const targetVaultDir = vaultPath.trim() !== "" ? path.resolve(vaultPath) : PROJECT_WORKSPACE_FALLBACK_VAULT;
    
    // Ensure the folder exists
    await ensureDirectoryExists(targetVaultDir);

    const targetFilePath = path.join(targetVaultDir, filename);

    // Prevent directory traversal attacks
    if (!targetFilePath.startsWith(targetVaultDir)) {
      return NextResponse.json({ error: "Access denied: Traversal detected" }, { status: 403 });
    }

    if (action === "write") {
      // Format markdown logs beautifully with timestamps
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
      let formattedContent = content;
      
      // If the file already exists, let's append instead of overwriting, unless requested otherwise
      let exists = false;
      try {
        await fs.access(targetFilePath);
        exists = true;
      } catch {}

      if (exists) {
        const currentData = await fs.readFile(targetFilePath, "utf-8");
        formattedContent = `${currentData}\n\n## Log Added: [${timestamp}]\n${content}`;
      } else {
        formattedContent = `# Meow-nuscript Foundry Decision Logs\nCreated: [${timestamp}]\n\n## Initial Log: [${timestamp}]\n${content}`;
      }

      await fs.writeFile(targetFilePath, formattedContent, "utf-8");
      
      return NextResponse.json({
        success: true,
        action: "write",
        filename,
        path: targetFilePath,
        message: `Successfully written to ${filename}.`
      });
    } 
    
    else if (action === "read") {
      try {
        await fs.access(targetFilePath);
      } catch {
        // Create an initial file if it doesn't exist
        const initialContent = `# Meow-nuscript Foundry Working Memory\n\nUse this to store decision logs and micro-facts across chapters.`;
        await fs.writeFile(targetFilePath, initialContent, "utf-8");
      }

      const fileData = await fs.readFile(targetFilePath, "utf-8");
      return NextResponse.json({
        success: true,
        action: "read",
        filename,
        content: fileData,
        path: targetFilePath
      });
    } 
    
    else {
      // Action: LIST
      const files = await fs.readdir(targetVaultDir);
      const mdFiles = files.filter(f => f.endsWith(".md"));
      
      // If empty, seed an initial log file
      if (mdFiles.length === 0) {
        const seedPath = path.join(targetVaultDir, "Decision_Logs.md");
        await fs.writeFile(seedPath, `# Meow-nuscript Foundry Decision Logs\n\n- Seeded initial working memory logs.`, "utf-8");
        mdFiles.push("Decision_Logs.md");
      }

      const fileDetails = await Promise.all(
        mdFiles.map(async (name) => {
          const stats = await fs.stat(path.join(targetVaultDir, name));
          return {
            name,
            size: stats.size,
            mtime: stats.mtime
          };
        })
      );

      return NextResponse.json({
        success: true,
        action: "list",
        vaultPath: targetVaultDir,
        files: fileDetails
      });
    }

  } catch (error: any) {
    console.error("Obsidian Integration Route Error:", error);
    return NextResponse.json({ 
      error: error.message,
      details: "Check folder write permissions or configure a valid absolute vault path."
    }, { status: 500 });
  }
}
