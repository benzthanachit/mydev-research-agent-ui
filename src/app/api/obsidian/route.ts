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

async function getMarkdownFilesRecursively(dir: string, baseDir: string = dir): Promise<Array<{ name: string; size: number; mtime: Date }>> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: Array<{ name: string; size: number; mtime: Date }> = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Exclude hidden folders like .obsidian or .git
      if (!entry.name.startsWith(".")) {
        const subFiles = await getMarkdownFilesRecursively(fullPath, baseDir);
        results.push(...subFiles);
      }
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      const stats = await fs.stat(fullPath);
      results.push({
        name: relativePath,
        size: stats.size,
        mtime: stats.mtime
      });
    }
  }
  
  return results;
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
      const { overwrite = false } = body;
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
      let formattedContent = content;
      
      // Ensure the parent directory (including subfolders like 'logs' or 'references') exists
      await ensureDirectoryExists(path.dirname(targetFilePath));
      
      if (overwrite) {
        // Direct clean write/overwrite without automatic appending and headers
        formattedContent = content;
      } else {
        // Standard append logic for standard decision logs
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
        await ensureDirectoryExists(path.dirname(targetFilePath));
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
      let fileDetails = await getMarkdownFilesRecursively(targetVaultDir, targetVaultDir);
      
      // If empty, seed an initial log file
      if (fileDetails.length === 0) {
        const seedPath = path.join(targetVaultDir, "Decision_Logs.md");
        await fs.writeFile(seedPath, `# Meow-nuscript Foundry Decision Logs\n\n- Seeded initial working memory logs.`, "utf-8");
        const stats = await fs.stat(seedPath);
        fileDetails.push({
          name: "Decision_Logs.md",
          size: stats.size,
          mtime: stats.mtime
        });
      }

      // Sort by modified time descending (latest updated first)
      fileDetails.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

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
