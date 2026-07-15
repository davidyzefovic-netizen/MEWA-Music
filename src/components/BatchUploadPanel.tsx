import React, { useState } from "react";
import { Upload, FileArchive, CheckCircle, AlertCircle, Loader2, Music, Image as ImageIcon } from "lucide-react";

import { Users } from "lucide-react";

export default function BatchUploadPanel({ authorId, authorName, authorRole, onComplete }: { authorId: string; authorName: string; authorRole: string; onComplete?: () => void }) {
  const [uploadType, setUploadType] = useState<"songs" | "artists">("songs");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ added: 0, skipped: 0, errors: 0 });

  const logMessage = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setZipFile(e.target.files[0]);
      setLogs([]);
      setStats({ added: 0, skipped: 0, errors: 0 });
    }
  };

  const processZip = async () => {
    if (!zipFile) return;

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    setStats({ added: 0, skipped: 0, errors: 0 });

    logMessage(`Uploading ZIP archive: ${zipFile.name}...`);

    try {
      const formData = new FormData();
      formData.append("archive", zipFile);

      const endpoint = uploadType === "songs" ? "/api/upload-archive" : "/api/upload-artists-archive";
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `Upload failed with status ${response.status}`;
        try {
           const errData = await response.json();
           if (errData.error) errorMsg += ": " + errData.error;
        } catch(e) {}
        if (response.status === 413) {
           errorMsg += " (Payload Too Large). Настройте Nginx: client_max_body_size 100M;";
        }
        throw new Error(errorMsg);
      }

      if (!response.body) {
         throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (line.startsWith("data: ")) {
                const dataStr = line.substring(6);
                try {
                    const data = JSON.parse(dataStr);
                    if (data.type === 'log') {
                        logMessage(data.message);
                        if (data.message.startsWith("Progress: ")) {
                            const progMatch = data.message.match(/Progress: (\d+)%/);
                            if (progMatch) {
                                setProgress(parseInt(progMatch[1], 10));
                            }
                        }
                    } else if (data.type === 'complete') {
                        setStats({
                           added: data.stats.added || 0,
                           skipped: data.stats.skipped || 0,
                           errors: data.stats.errors || 0
                        });
                        setProgress(100);
                        if (onComplete) onComplete();
                    }
                } catch (e) {
                    console.error("Error parsing SSE JSON", e);
                }
            }
        }
        buffer = lines[lines.length - 1];
      }

    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
         logMessage('Ошибка: Соединение прервано (Failed to fetch). Если вы используете PM2 --watch, отключите его для папки uploads. Также проверьте Nginx (client_max_body_size).');
      } else {
         logMessage(`Error uploading/processing ZIP: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-none border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
      <h3 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <FileArchive className="h-4 w-4" /> ZIP Server-Side Importer
      </h3>
      
      <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 mb-4">
        <button
          onClick={() => { setUploadType("songs"); setZipFile(null); setLogs([]); setStats({added:0,skipped:0,errors:0}); }}
          className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${uploadType === "songs" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
        >
          Songs (index.json)
        </button>
        {authorRole === "admin" && (
          <button
            onClick={() => { setUploadType("artists"); setZipFile(null); setLogs([]); setStats({added:0,skipped:0,errors:0}); }}
            className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${uploadType === "artists" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            Artists (artists.json)
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-4">
        {/* Upload Area */}
        <div className="border border-dashed border-zinc-300 dark:border-zinc-700 p-6 flex flex-col items-center justify-center text-center bg-zinc-50 dark:bg-zinc-900/50">
          <Upload className="h-8 w-8 text-zinc-400 mb-3" />
          <p className="font-sans text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">
            Upload {uploadType === "songs" ? "tracks" : "artists"} archive
          </p>
          <p className="font-sans text-xs text-zinc-500 mb-4">
            {uploadType === "songs" ? "ZIP file containing index.json and audio/cover files." : "ZIP file containing artists.json and photo files."}
          </p>
          <input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="block w-full max-w-xs text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-semibold file:bg-zinc-200 file:text-zinc-700 hover:file:bg-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700 transition-colors cursor-pointer"
            disabled={isProcessing}
          />
        </div>

        {/* Process Button */}
        <button
          onClick={processZip}
          disabled={!zipFile || isProcessing}
          className="w-full flex items-center justify-center gap-2 rounded-none bg-zinc-900 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing... {progress}%
            </>
          ) : (
            <>
              <FileArchive className="h-4 w-4" /> Upload & Parse Archive
            </>
          )}
        </button>

        {/* Progress Bar */}
        {(isProcessing || progress > 0) && (
           <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 overflow-hidden mt-2">
              <div 
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
           </div>
        )}

        {/* Report Stats */}
        {(stats.added > 0 || stats.skipped > 0 || stats.errors > 0) && (
          <div className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs font-mono text-green-600 dark:text-green-400">
               <CheckCircle className="h-3 w-3" /> Added: {stats.added}
            </div>
            {stats.skipped > 0 && (
              <div className="flex items-center gap-1 text-xs font-mono text-amber-600 dark:text-amber-400">
                 <AlertCircle className="h-3 w-3" /> Skipped: {stats.skipped}
              </div>
            )}
            {stats.errors > 0 && (
              <div className="flex items-center gap-1 text-xs font-mono text-red-600 dark:text-red-400">
                 <AlertCircle className="h-3 w-3" /> Errors: {stats.errors}
              </div>
            )}
          </div>
        )}

        {/* Logs terminal */}
        {logs.length > 0 && (
          <div className="mt-4 bg-black p-4 h-48 overflow-y-auto font-mono text-[11px] md:text-[10px] leading-relaxed text-green-400 border border-zinc-800 flex flex-col-reverse">
            <div>
              {logs.map((log, i) => (
                <div key={i} className="mb-1">{`> ${log}`}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
