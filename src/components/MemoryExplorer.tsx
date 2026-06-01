"use client";

import React, { useState, useEffect } from "react";
import { Folder, FileText, Database, ShieldAlert, RefreshCw, Layers, Loader2 } from "lucide-react";

interface MemoryExplorerProps {
  obsidianPath: string;
  notebookWebhook: string;
  refreshTrigger: number; // A counter to force re-fetch when chapters are saved
}

export default function MemoryExplorer({ obsidianPath, notebookWebhook, refreshTrigger }: MemoryExplorerProps) {
  const [activeView, setActiveView] = useState<"obsidian" | "notebook">("obsidian");
  const [obsidianFiles, setObsidianFiles] = useState<any[]>([]);
  const [notebookFiles, setNotebookFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Obsidian Files List
  const fetchObsidian = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", vaultPath: obsidianPath })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setObsidianFiles(data.files || []);
        // Auto-select first file if exists and nothing is selected
        if (data.files && data.files.length > 0 && !selectedFile) {
          handleReadFile(data.files[0].name);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch NotebookLM Locked Chapters
  const fetchNotebook = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notebooklm");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setNotebookFiles(data.lockedChapters || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Read individual Obsidian file content
  const handleReadFile = async (filename: string) => {
    setIsLoading(true);
    setSelectedFile(filename);
    try {
      const res = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", filename, vaultPath: obsidianPath })
      });
      const data = await res.json();
      if (data.error) {
        setFileContent(`Error loading file: ${data.error}`);
      } else {
        setFileContent(data.content || "");
      }
    } catch (err: any) {
      setFileContent(`Error loading file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh lists on load or when path changes
  useEffect(() => {
    if (activeView === "obsidian") {
      fetchObsidian();
    } else {
      fetchNotebook();
    }
  }, [activeView, obsidianPath, refreshTrigger]);

  return (
    <div className="retro-border-single bg-retro-panel p-6 flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-retro-border/30 pb-3">
        <h3 className="font-press-start text-xs text-retro-primary flex items-center gap-2">
          <Database className="w-4 h-4" /> MEMORY ARCHIVE EXPLORER
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => activeView === "obsidian" ? fetchObsidian() : fetchNotebook()}
            className="retro-btn py-1 px-3 text-[9px] bg-slate-800 border-slate-700 flex items-center gap-1 font-mono"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} /> REFRESH
          </button>
        </div>
      </div>

      {/* Internal Navigation */}
      <div className="flex gap-2 font-mono text-sm border-b border-retro-border/20 pb-2">
        <button
          onClick={() => {
            setActiveView("obsidian");
            setSelectedFile(null);
            setFileContent("");
          }}
          className={`flex items-center gap-1 px-3 py-1 border-2 ${
            activeView === "obsidian" ? "border-retro-primary text-retro-primary bg-black/30" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Folder className="w-4 h-4" /> [OBSIDIAN] Working Memory Vault
        </button>
        <button
          onClick={() => {
            setActiveView("notebook");
            setSelectedFile(null);
            setFileContent("");
          }}
          className={`flex items-center gap-1 px-3 py-1 border-2 ${
            activeView === "notebook" ? "border-purple-400 text-purple-400 bg-black/30" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" /> [NOTEBOOKLM] Cold Storage
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/20 border border-red-800 text-red-300 font-mono text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Error loading vault: {error} (Falling back to local project folder storage)</span>
        </div>
      )}

      {/* Explorer Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left list: Directory Tree */}
        <div className="md:col-span-1 border-2 border-retro-border bg-black/30 p-3 min-h-[250px] max-h-[350px] overflow-y-auto">
          <p className="font-press-start text-[8px] text-slate-500 uppercase border-b border-retro-border/20 pb-1 mb-2">
            Files in Storage:
          </p>

          <div className="flex flex-col gap-1">
            {activeView === "obsidian" ? (
              obsidianFiles.length > 0 ? (
                obsidianFiles.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => handleReadFile(file.name)}
                    className={`w-full text-left p-2 font-mono text-xs flex items-center gap-2 border border-transparent truncate hover:bg-retro-panel-light hover:border-slate-600 ${
                      selectedFile === file.name ? "bg-retro-panel-light border-retro-primary text-retro-primary" : "text-slate-300"
                    }`}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    <div className="truncate flex-1">
                      <div>{file.name}</div>
                      <div className="text-[9px] opacity-40 font-sans">
                        {(file.size / 1024).toFixed(1)} KB - {new Date(file.mtime).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-600 font-mono">
                  No files found. Write a decision log on the Workbench tab!
                </div>
              )
            ) : (
              notebookFiles.length > 0 ? (
                notebookFiles.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => {
                      setSelectedFile(file.name);
                      setFileContent(
                        `# LOCKED COLD STORAGE ARCHIVE\n\nChapter: ${file.chapter}\nArchived At: ${new Date(
                          file.lockedAt
                        ).toLocaleString()}\nSize: ${(file.size / 1024).toFixed(2)} KB\n\nFinalized file resides in workspace at:\n\`notebooklm-cold-storage/${file.name}\``
                      );
                    }}
                    className={`w-full text-left p-2 font-mono text-xs flex items-center gap-2 border border-transparent truncate hover:bg-retro-panel-light hover:border-slate-600 ${
                      selectedFile === file.name ? "bg-retro-panel-light border-purple-400 text-purple-400" : "text-slate-300"
                    }`}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0 text-purple-400" />
                    <div className="truncate flex-1">
                      <div>{file.name}</div>
                      <div className="text-[9px] opacity-40 font-sans">
                        {(file.size / 1024).toFixed(1)} KB - {new Date(file.lockedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-600 font-mono">
                  No locked chapters yet. Approve a chapter fully to freeze it!
                </div>
              )
            )}
          </div>
        </div>

        {/* Right view: File Reader panel */}
        <div className="md:col-span-2 flex flex-col border-2 border-retro-border bg-black/50 p-4 min-h-[250px] max-h-[350px]">
          <div className="flex items-center justify-between border-b border-retro-border/20 pb-2 mb-2">
            <span className="font-press-start text-[8px] text-slate-400">
              FILE READER: {selectedFile || "None Selected"}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              Format: Markdown
            </span>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {selectedFile ? (
              fileContent ? (
                fileContent
              ) : (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-retro-primary" />
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 font-mono text-center">
                <FileText className="w-8 h-8 opacity-30 mb-1" />
                Select a file from the explorer list on the left to read its contents.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
