"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions as fbFunctions } from '@/lib/firebase';
// Image resize module temporarily disabled due to build issues
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

// Dynamically register image resize module only in the browser

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  /* Slash menu state */
  const [slashActive, setSlashActive] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const quillRef = useRef<any>();

  const imageHandler = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const videoHandler = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  const docHandler = useCallback(() => {
    docInputRef.current?.click();
  }, []);

  /* ---------------- Table Handler ---------------- */
  const tableHandler = useCallback(() => {
    const rowsStr = prompt("Sorok száma (1-10)", "2");
    const colsStr = prompt("Oszlopok száma (1-10)", "2");
    if (!rowsStr || !colsStr) return;
    const rows = Math.min(Math.max(parseInt(rowsStr, 10) || 0, 1), 10);
    const cols = Math.min(Math.max(parseInt(colsStr, 10) || 0, 1), 10);
    let tableHtml = '<table class="ql-custom-table"><tbody>';
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        tableHtml += '<td>&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br/></p>';
    const quill = quillRef.current?.getEditor();
    const range = quill?.getSelection(true);
    quill?.clipboard.dangerouslyPasteHTML(range?.index || 0, tableHtml);
  }, []);

  /* ---------------- Formula Handler ---------------- */
  const formulaHandler = useCallback(() => {
    const latex = prompt("Írd be a LaTeX képletet", "a^2 + b^2 = c^2");
    if (!latex) return;
    const quill = quillRef.current?.getEditor();
    const range = quill?.getSelection(true);
    quill?.insertEmbed(range?.index || 0, "formula", latex);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndInsert(file);
    e.target.value = "";
  };

  const uploadAndInsert = async (file: File) => {
    const folder = file.type.startsWith('image/') ? 'lesson-images' : file.type.startsWith('video/') ? 'lesson-videos' : 'lesson-docs';

    try {
      const getUrlFn = httpsCallable(fbFunctions, 'getSignedUploadUrl');
      const result: any = await getUrlFn({ fileName: file.name, fileType: file.type, folder });
      const { signedUrl, publicUrl } = result.data || {};
      if (!signedUrl) throw new Error('Signed URL generálása sikertelen');

      await fetch(signedUrl as string, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });

      const quill = quillRef.current?.getEditor();
      const range = quill?.getSelection(true);

      if (file.type.startsWith('image/')) {
        quill?.insertEmbed(range?.index || 0, 'image', publicUrl);
      } else if (file.type.startsWith('video/')) {
        quill?.insertText(range?.index || 0, '[Videó megtekintése]', 'link', publicUrl);
      } else {
        quill?.insertText(range?.index || 0, file.name, 'link', publicUrl);
      }

      toast.success("Fájl feltöltve!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Feltöltési hiba");
    } finally {
      setUploadProgress(0);
    }
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ["bold", "italic", "underline", "strike"],
        [{ header: [1, 2, 3, false] }],
        [{ list: "ordered" }, { list: "bullet" }, "blockquote"],
        ["link", "image", "videoUpload", "docUpload", "tableInsert", "code-block", "formulaInsert"],
        [{ align: [] }],
        ["clean"],
      ],
      handlers: {
        image: imageHandler,
        videoUpload: videoHandler,
        docUpload: docHandler,
        tableInsert: tableHandler,
        formulaInsert: formulaHandler,
      },
    },
  }), [imageHandler, videoHandler, docHandler, tableHandler, formulaHandler]);

  /* ---------------- Slash Commands ---------------- */
  const slashCommands = useMemo(() => [
    { key: "kep", label: "Kép beszúrása", action: () => imageHandler() },
    { key: "video", label: "Videó beszúrása", action: () => videoHandler() },
    { key: "tabla", label: "Táblázat beszúrása", action: () => tableHandler() },
    { key: "kod", label: "Kódrészlet blokk", action: () => {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;
        const range = quill.getSelection(true);
        if (range) quill.formatLine(range.index, 1, "code-block", true);
      }
    },
    { key: "keplet", label: "Matematikai képlet", action: () => formulaHandler() },
  ], [imageHandler, videoHandler, tableHandler, formulaHandler]);

  /* Register Quill resize module - temporarily disabled to fix constructor error */
  // useEffect(() => {
  //   if (typeof window === "undefined") return;
  //   
  //   // Wait for Quill to be available
  //   const registerResizeModule = () => {
  //     try {
  //       // eslint-disable-next-line @typescript-eslint/no-var-requires
  //       const { Quill } = require("react-quill");
  //       if (Quill && !(Quill as any).__resizeRegistered) {
  //         // The library exports as UMD, so we need to require it and it will attach to window
  //         require("quill-resize-image");
  //         const ResizeModule = (window as any).QuillResizeImage;
  //         if (ResizeModule) {
  //           Quill.register("modules/resize", ResizeModule);
  //           (Quill as any).__resizeRegistered = true;
  //         }
  //       }
  //     } catch (error) {
  //       console.warn("Failed to register Quill resize module:", error);
  //     }
  //   };

  //   // Try immediately, then retry after a short delay
  //   registerResizeModule();
  //   const timeoutId = setTimeout(registerResizeModule, 100);
  //   
  //   return () => clearTimeout(timeoutId);
  // }, []);

  /* Inject KaTeX CDN once */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!document.getElementById("katex-css")) {
      const link = document.createElement("link");
      link.id = "katex-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("katex-js")) {
      const script = document.createElement("script");
      script.id = "katex-js";
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const editorModules = modules;

  // SlashCommands will be defined later after formulaHandler

  /* Key handlers for slash menu */
  const handleKeyDown = useCallback((e: any) => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    if (!slashActive) {
      if (e.key === "/") {
        setSlashActive(true);
        setSlashQuery("");
        const range = quill.getSelection();
        setSlashIndex(range?.index ?? null);
        setSelectedIdx(0);
      }
      return;
    }

    // Slash menu active
    if (e.key === "Escape") {
      setSlashActive(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[selectedIdx];
      if (cmd) {
        // Remove the slash text
        if (slashIndex !== null) {
          const currentRange = quill.getSelection();
          const end = currentRange?.index ?? 0;
          quill.deleteText(slashIndex, end - slashIndex);
        }
        cmd.action();
      }
      setSlashActive(false);
      return;
    }

    // Character input & backspace handling
    if (e.key === "Backspace") {
      if (slashQuery.length === 0) {
        setSlashActive(false);
        return;
      } else {
        setSlashQuery((prev) => prev.slice(0, -1));
        setSelectedIdx(0);
      }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setSlashQuery((prev) => prev + e.key.toLowerCase());
      setSelectedIdx(0);
    }
  }, [slashActive, slashQuery, selectedIdx, slashIndex, slashCommands]);

  const filtered = slashCommands.filter((c) => c.key.startsWith(slashQuery));

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    quill.root.addEventListener("keydown", handleKeyDown);
    return () => quill.root.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /* ---------------- Add Hungarian tooltips ---------------- */
  useEffect(() => {
    if (!quillRef.current) return;
    const toolbar: HTMLElement | null = quillRef.current?.container?.previousSibling as HTMLElement;
    if (!toolbar) return;
    const titleMap: Record<string, string> = {
      bold: "Félkövér – Ctrl+B",
      italic: "Dőlt – Ctrl+I",
      underline: "Aláhúzott – Ctrl+U",
      strike: "Áthúzott",
      clean: "Formázás törlése",
      image: "Kép feltöltése",
      link: "Hivatkozás beszúrása",
      videoUpload: "Videó feltöltése",
      docUpload: "Dokumentum feltöltése",
      tableInsert: "Táblázat beszúrása",
      "code-block": "Kódrészlet",
      formula: "Matematikai képlet",
      formulaInsert: "Matematikai képlet", // custom button tooltip
      blockquote: "Idézet blokk",
    };

    const iconMap: Record<string, string> = {
      videoUpload: "📹",
      docUpload: "📄",
      tableInsert: "▦", // simple table unicode
      formulaInsert: "∑",
    };

    toolbar.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
      // Determine key based on class or data attribute
      const format = btn.classList.contains("ql-videoUpload")
        ? "videoUpload"
        : btn.classList.contains("ql-docUpload")
        ? "docUpload"
        : btn.classList.contains("ql-tableInsert")
        ? "tableInsert"
        : Array.from(btn.classList).find((c) => c.startsWith("ql-"))?.replace("ql-", "") ?? "";
      if (titleMap[format]) {
        btn.title = titleMap[format];
      }

      // Always override Quill’s default fallback (a blank square) for our custom buttons
      if (iconMap[format]) {
        btn.innerHTML = iconMap[format];
        btn.style.color = "#4b5563"; // Tailwind gray-600
        btn.style.fontSize = "15px";
      }
    });
  }, []);

  return (
    <div
      className="space-y-4 relative min-h-[400px]"
      onDragOver={(e) => {
        e.preventDefault();
        if (!isDragging) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        // Ensure left the container
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (!files.length) return;
        for (const f of files) {
          await uploadAndInsert(f);
        }
      }}
    >
      {uploadProgress > 0 && <Progress value={uploadProgress} />}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      {(ReactQuill as any)({
        ref: quillRef,
        theme: "snow",
        value,
        onChange,
        modules: editorModules,
        style: { height: '350px' },
        placeholder: "Írja be a lecke tartalmát...",
      })}

      {/* Slash command menu */}
      {slashActive && filtered.length > 0 && (
        <div className="absolute z-50 bg-white border rounded shadow-md mt-2 ml-2 w-56 max-h-60 overflow-y-auto">
          {filtered.map((cmd, idx) => (
            <button
              key={cmd.key}
              className={`flex w-full text-left px-3 py-2 text-sm hover:bg-accent ${idx === selectedIdx ? "bg-accent" : ""}`}
              onMouseEnter={() => setSelectedIdx(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                cmd.action();
                setSlashActive(false);
              }}
            >
              {cmd.label}
            </button>
          ))}
        </div>
      )}
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Video upload hidden input */}
      <input
        type="file"
        accept="video/*"
        ref={videoInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Document upload hidden input */}
      <input
        type="file"
        accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
        ref={docInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {isDragging && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none text-white text-xl font-semibold rounded-lg">
          Dobd ide a fájlt a feltöltéshez
        </div>
      )}
    </div>
  );
}

/* Simple styling for inserted tables */
/*
Add this CSS to globals or inline: we inject here via style tag if needed. For now, rely on Tailwind default table styles, but ensure borders visible in editor view.
*/ 