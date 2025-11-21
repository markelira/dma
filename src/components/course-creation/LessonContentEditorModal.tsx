"use client";

import React, { useEffect, useState, useRef } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions as fbFunctions } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Save, X } from "lucide-react";
import dynamic from "next/dynamic";
import { Progress } from "@/components/ui/progress";
// Firebase videó feltöltő (fallback/legacy)
import FirebaseVideoUploader from "./FirebaseVideoUploader";
// Mux videó feltöltő (primary)
import MuxVideoUploader from "./MuxVideoUploader";
import QuizEditorModal, { LessonQuiz } from "./QuizEditorModal";

const RichTextEditor = dynamic(() => import("@/components/lesson/RichTextEditor"), {
  ssr: false,
});

interface Lesson {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT" | "READING" | "QUIZ" | "PDF" | "AUDIO";
  content?: string | null;
  videoUrl?: string | null;
  videoStoragePath?: string | null; // Firebase Storage path
  durationSec?: number | null; // videó hossz másodpercben
  // Mux fields
  muxAssetId?: string | null;
  muxPlaybackId?: string | null;
  muxUploadId?: string | null;
  muxStatus?: 'uploading' | 'processing' | 'ready' | 'error';
  muxThumbnailUrl?: string | null;
  muxDuration?: number | null;
  muxAspectRatio?: string | null;
  isFreePreview?: boolean;
  resources?: { name: string; url: string }[];
  // Legacy field for migration – may still exist when loaded from Firestore
  quizJson?: string | null;
  // New structured quiz object
  quiz?: LessonQuiz | null;
  subtitleUrl?: string | null;
  thumbnailUrl?: string | null;
  description?: string | null;
  moduleId: string;
  courseId: string;
  // New fields for PDF and Audio
  pdfUrl?: string | null;
  audioUrl?: string | null;
}

interface Props {
  lesson: Lesson;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: (updated: Partial<Lesson>) => void;
}

export default function LessonContentEditorModal({ lesson, open, onOpenChange, onSaved }: Props) {
  const [richText, setRichText] = useState<string>(lesson.content || "");
  const [videoUrl, setVideoUrl] = useState<string>(lesson.videoUrl || "");
  const [videoStoragePath, setVideoStoragePath] = useState<string>(lesson.videoStoragePath || "");
  const [assessment, setAssessment] = useState<string>(lesson.content || "");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const subtitleInputRef = useRef<HTMLInputElement | null>(null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);

  const [subtitleUrl, setSubtitleUrl] = useState<string>(lesson.subtitleUrl || "");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(lesson.thumbnailUrl || "");
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({});
  const [description, setDescription] = useState<string>(lesson.description || "");

  // Mux state
  const [muxAssetId, setMuxAssetId] = useState<string>(lesson.muxAssetId || "");
  const [muxPlaybackId, setMuxPlaybackId] = useState<string>(lesson.muxPlaybackId || "");
  const [muxStatus, setMuxStatus] = useState<string>(lesson.muxStatus || "");
  const [useMux, setUseMux] = useState<boolean>(true); // Toggle between Mux and Firebase
  
  // New state for PDF and Audio
  const [pdfUrl, setPdfUrl] = useState<string>(lesson.pdfUrl || "");
  const [audioUrl, setAudioUrl] = useState<string>(lesson.audioUrl || "");
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Új mezők state-je
  const [durationSec, setDurationSec] = useState<number | string>(lesson.durationSec ?? "");
  const [isFreePreview, setIsFreePreview] = useState<boolean>(lesson.isFreePreview || false);
  const [resources, setResources] = useState<{ name: string; url: string }[]>(lesson.resources || []);
  const [quizData, setQuizData] = useState<LessonQuiz | null>(lesson.quiz ?? (lesson.quizJson ? JSON.parse(lesson.quizJson) : null));
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const resourceInputRef = useRef<HTMLInputElement | null>(null);

  // --- Legacy quizJson -> quiz migration on first open ---
  useEffect(() => {
    if (open && !lesson.quiz && lesson.quizJson) {
      try {
        const parsed: LessonQuiz = JSON.parse(lesson.quizJson);
        setQuizData(parsed);
        // Persist migrated structure to Firestore immediately
        const lessonRef = doc(db, "courses", lesson.courseId, "modules", lesson.moduleId, "lessons", lesson.id);
        updateDoc(lessonRef, { quiz: parsed, quizJson: null, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.error("Quiz JSON migration failed", err);
      }
    }
  }, [open, lesson]);

  useEffect(() => {
    // Reset local state when lesson changes or modal reopens
    if (open) {
      setRichText(lesson.content || "");
      setVideoUrl(lesson.videoUrl || "");
      setVideoStoragePath(lesson.videoStoragePath || "");
      setSubtitleUrl(lesson.subtitleUrl || "");
      setThumbnailUrl(lesson.thumbnailUrl || "");
      setAssessment(lesson.content || "");
      setPdfUrl(lesson.pdfUrl || "");
      setAudioUrl(lesson.audioUrl || "");
      setDescription(lesson.description || "");
      setDurationSec(lesson.durationSec || "");
      setIsFreePreview(lesson.isFreePreview || false);
      setResources(lesson.resources || []);
      setQuizData(lesson.quiz ?? (lesson.quizJson ? JSON.parse(lesson.quizJson) : null));
      setQuizModalOpen(false); // Close modal if lesson changes
      setUploadProgress({});
      setUploading({});
    }
  }, [lesson, open]);

  const uploadVideo = async (file: File) => {
    setUploading(prev => ({ ...prev, video: true }));
    setUploadProgress(prev => ({ ...prev, video: 0 }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "lesson-videos");
    try {
      const result = await httpsCallable(fbFunctions, "getSignedUploadUrl")({
        fileName: file.name,
        fileType: file.type,
        folder: "lesson-videos"
      });
      const { signedUrl, publicUrl } = result.data as { signedUrl: string; publicUrl: string };
      const res = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setVideoUrl(publicUrl);
      toast.success("Videó feltöltve!");
    } catch (err: any) {
      toast.error(err.message || "Hiba a videó feltöltésekor");
    } finally {
      setUploading(prev => ({ ...prev, video: false }));
      setUploadProgress(prev => ({ ...prev, video: 0 }));
    }
  };

  const uploadSubtitle = async (file: File) => {
    setUploading(prev => ({ ...prev, subtitle: true }));
    setUploadProgress(prev => ({ ...prev, subtitle: 0 }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "lesson-subtitles");
    try {
      const result = await httpsCallable(fbFunctions, "getSignedUploadUrl")({
        fileName: file.name,
        fileType: file.type,
        folder: "lesson-subtitles"
      });
      const { signedUrl: subtitleSignedUrl, publicUrl: subtitlePublicUrl } = result.data as { signedUrl: string; publicUrl: string };
      const res = await fetch(subtitleSignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setSubtitleUrl(subtitlePublicUrl);
      toast.success("Felirat feltöltve!");
    } catch (err: any) {
      toast.error(err.message || "Hiba a felirat feltöltésekor");
    } finally {
      setUploading(prev => ({ ...prev, subtitle: false }));
      setUploadProgress(prev => ({ ...prev, subtitle: 0 }));
    }
  };

  const uploadThumbnail = async (file: File) => {
    setUploading(prev => ({ ...prev, thumbnail: true }));
    setUploadProgress(prev => ({ ...prev, thumbnail: 0 }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "lesson-thumbnails");
    try {
      const result = await httpsCallable(fbFunctions, "getSignedUploadUrl")({
        fileName: file.name,
        fileType: file.type,
        folder: "lesson-thumbnails"
      });
      const { signedUrl: thumbSignedUrl, publicUrl: thumbPublicUrl } = result.data as { signedUrl: string; publicUrl: string };
      const res = await fetch(thumbSignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setThumbnailUrl(thumbPublicUrl);
      toast.success("Bélyegkép feltöltve!");
    } catch (err: any) {
      toast.error(err.message || "Hiba a bélyegkép feltöltésekor");
    } finally {
      setUploading(prev => ({ ...prev, thumbnail: false }));
      setUploadProgress(prev => ({ ...prev, thumbnail: 0 }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadVideo(file);
    e.target.value = "";
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadSubtitle(file);
    e.target.value = "";
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadThumbnail(file);
    e.target.value = "";
  };

  const uploadPdf = async (file: File) => {
    setUploading(prev => ({ ...prev, pdf: true }));
    setUploadProgress(prev => ({ ...prev, pdf: 0 }));
    try {
      const result = await httpsCallable(fbFunctions, "getSignedUploadUrl")({
        fileName: file.name,
        fileType: file.type,
        folder: "lesson-pdfs"
      });
      const { signedUrl, publicUrl } = result.data as { signedUrl: string; publicUrl: string };
      const res = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setPdfUrl(publicUrl);
      toast.success("PDF feltöltve!");
    } catch (err: any) {
      toast.error(err.message || "Hiba a PDF feltöltésekor");
    } finally {
      setUploading(prev => ({ ...prev, pdf: false }));
      setUploadProgress(prev => ({ ...prev, pdf: 0 }));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPdf(file);
    e.target.value = "";
  };

  const uploadAudio = async (file: File) => {
    setUploading(prev => ({ ...prev, audio: true }));
    setUploadProgress(prev => ({ ...prev, audio: 0 }));
    try {
      const result = await httpsCallable(fbFunctions, "getSignedUploadUrl")({
        fileName: file.name,
        fileType: file.type,
        folder: "lesson-audio"
      });
      const { signedUrl, publicUrl } = result.data as { signedUrl: string; publicUrl: string };
      const res = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setAudioUrl(publicUrl);
      toast.success("Hangfájl feltöltve!");
    } catch (err: any) {
      toast.error(err.message || "Hiba a hangfájl feltöltésekor");
    } finally {
      setUploading(prev => ({ ...prev, audio: false }));
      setUploadProgress(prev => ({ ...prev, audio: 0 }));
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAudio(file);
    e.target.value = "";
  };

  const saveLesson = async () => {
    setSaving(true);
    try {
      const payload = {
        description: description || null,
        isFreePreview: !!isFreePreview,
        durationSec: durationSec ? Number(durationSec) : null,
        resources: resources,
        quiz: quizData ?? null,
        content: lesson.type === "TEXT" || lesson.type === "AUDIO" ? richText : null,
        videoUrl: lesson.type === "VIDEO" ? videoUrl : null,
        videoStoragePath: lesson.type === "VIDEO" && videoStoragePath ? videoStoragePath : null,
        subtitleUrl: lesson.type === "VIDEO" ? subtitleUrl || null : null,
        thumbnailUrl: lesson.type === "VIDEO" || lesson.type === "AUDIO" ? thumbnailUrl || null : null,
        assessment: lesson.type === "READING" ? assessment : null,
        pdfUrl: lesson.type === "PDF" ? pdfUrl : null,
        audioUrl: lesson.type === "AUDIO" ? audioUrl : null,
        // Mux fields for VIDEO type
        muxAssetId: lesson.type === "VIDEO" && muxAssetId ? muxAssetId : null,
        muxPlaybackId: lesson.type === "VIDEO" && muxPlaybackId ? muxPlaybackId : null,
        muxStatus: lesson.type === "VIDEO" && muxStatus ? muxStatus : null,
        updatedAt: new Date().toISOString(),
      };

      const lessonRef = doc(db, "courses", lesson.courseId, "modules", lesson.moduleId, "lessons", lesson.id);
      await updateDoc(lessonRef, payload);

      toast.success("Lecke tartalma elmentve!");
      onSaved(payload);
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Mentés sikertelen");
    } finally {
      setSaving(false);
    }
  };

  // Resource fájl feltöltése
  const uploadResource = async (file: File) => {
    setUploading(prev => ({ ...prev, resource: true }));
    setUploadProgress(prev => ({ ...prev, resource: 0 }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "lesson-resources");
    try {
      const result = await httpsCallable(fbFunctions, "getSignedUploadUrl")({
        fileName: file.name,
        fileType: file.type,
        folder: "lesson-resources"
      });
      const { signedUrl: resourceSignedUrl, publicUrl: resourcePublicUrl } = result.data as { signedUrl: string; publicUrl: string };
      const res = await fetch(resourceSignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setResources(prev => [...prev, { name: file.name, url: resourcePublicUrl }]);
      toast.success("Erőforrás feltöltve!");
    } catch (err: any) {
      toast.error(err.message || "Hiba az erőforrás feltöltésekor");
    } finally {
      setUploading(prev => ({ ...prev, resource: false }));
      setUploadProgress(prev => ({ ...prev, resource: 0 }));
    }
  };

  const handleResourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadResource(file);
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>"{lesson.title}" szerkesztése</DialogTitle>
          <DialogDescription>
            Szerkessze a lecke tartalmát a típusának megfelelően.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Description field for all lesson types */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Lecke leírása</label>
            <Textarea 
              rows={2} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Rövid leírás a leckéről..."
            />
          </div>

          {/* Free preview & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium">Ingyenes előnézet</label>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFreePreview((p) => !p)}>
                {isFreePreview ? "Igen" : "Nem"}
              </Button>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">Lecke hossza (másodperc)</label>
              <Input type="number" min="0" value={durationSec} onChange={(e)=>{
                const v = e.target.value;
                setDurationSec(v ? Number(v) : ("" as ""));
              }} placeholder="pl. 300" />
            </div>
          </div>

          {/* Resources uploader */}
          <div className="space-y-2 pt-4">
            <label className="block text-sm font-medium">Letölthető erőforrások</label>
            <Button variant="outline" type="button" onClick={()=>resourceInputRef.current?.click()} disabled={uploading.resource}>
              {uploading.resource ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} 
              {uploading.resource ? "Feltöltés..." : "Fájl feltöltése"}
            </Button>
            {uploadProgress.resource > 0 && (
              <div className="space-y-1">
                <Progress value={uploadProgress.resource} className="h-2" />
                <p className="text-xs text-muted-foreground">{uploadProgress.resource}% kész</p>
              </div>
            )}
            <ul className="space-y-1 text-sm pt-2">
              {resources.map((r, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate flex-1">{r.name}</a>
                  <Button variant="ghost" size="icon" onClick={() => setResources((prev)=>prev.filter((_,i)=>i!==idx))}>
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
              {resources.length === 0 && (
                <li className="italic text-muted-foreground">Nincs feltöltött erőforrás</li>
              )}
            </ul>
            <input type="file" ref={resourceInputRef} onChange={handleResourceChange} className="hidden" />
          </div>

          {lesson.type === "QUIZ" && (
            <div className="pt-4">
              <Button type="button" variant="outline" onClick={()=>setQuizModalOpen(true)}>Kvíz szerkesztése</Button>
              {quizData && <p className="text-sm text-green-700 mt-1">✅ {quizData.questions.length} kérdés mentve</p>}
            </div>
          )}

          {lesson.type === "QUIZ" && (
            <QuizEditorModal open={quizModalOpen} onOpenChange={setQuizModalOpen} value={quizData} onSave={(q)=>setQuizData(q)} />
          )}

          {lesson.type === "TEXT" && (
            <Textarea
              value={richText}
              onChange={(e) => setRichText(e.target.value)}
              rows={12}
              placeholder="Enter lesson content here..."
              className="w-full border rounded-md p-2"
            />
          )}

          {lesson.type === "VIDEO" && (
            <div className="space-y-4">
              {/* Upload method toggle */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={useMux}
                    onChange={() => setUseMux(true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Mux Video (ajánlott)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!useMux}
                    onChange={() => setUseMux(false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Firebase Storage (legacy)</span>
                </label>
              </div>

              {useMux ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Videó feltöltése Mux-szal</label>
                  <MuxVideoUploader
                    onUploaded={(assetId, playbackId) => {
                      setMuxAssetId(assetId);
                      setMuxPlaybackId(playbackId || "");
                      setMuxStatus("ready");
                      // Also set videoUrl for backwards compatibility
                      if (playbackId) {
                        setVideoUrl(`https://stream.mux.com/${playbackId}`);
                      }
                      toast.success("Videó sikeresen feltöltve Mux-ba!");
                    }}
                    lessonId={lesson.id}
                  />
                  {muxAssetId && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Mux Asset ID:</strong> {muxAssetId}
                      </p>
                      {muxPlaybackId && (
                        <p className="text-sm text-green-800">
                          <strong>Playback ID:</strong> {muxPlaybackId}
                        </p>
                      )}
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Videó sikeresen feldolgozva és streamelésre kész
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Videó feltöltése Firebase Storage-ba</label>
                  <FirebaseVideoUploader
                    onUploaded={(url, thumbUrl) => {
                      setVideoUrl(url);
                      if (thumbUrl) {
                        setThumbnailUrl(thumbUrl);
                      }
                    }}
                    courseId={lesson.courseId}
                    lessonId={lesson.id}
                    currentVideoUrl={videoUrl}
                  />
                </div>
              )}

              {/* Subtitle upload */}
              <div className="space-y-2 pt-4">
                <label className="block text-sm font-medium">Felirat feltöltése (.vtt, .srt)</label>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => subtitleInputRef.current?.click()}
                    disabled={uploading.subtitle}
                  >
                    {uploading.subtitle ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading.subtitle ? "Feltöltés..." : "Felirat feltöltése"}
                  </Button>
                  {uploadProgress.subtitle > 0 && (
                    <div className="space-y-1">
                      <Progress value={uploadProgress.subtitle} className="h-2" />
                      <p className="text-xs text-muted-foreground">{uploadProgress.subtitle}% kész</p>
                    </div>
                  )}
                </div>
                {subtitleUrl && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground truncate flex-1">{subtitleUrl.split("/").pop()}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSubtitleUrl("")}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <input type="file" accept=".vtt,.srt" ref={subtitleInputRef} onChange={handleSubtitleChange} className="hidden" />
              </div>

              {/* Thumbnail upload */}
              <div className="space-y-2 pt-4">
                <label className="block text-sm font-medium">Bélyegkép feltöltése (jpg, png)</label>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={uploading.thumbnail}
                  >
                    {uploading.thumbnail ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading.thumbnail ? "Feltöltés..." : "Bélyegkép feltöltése"}
                  </Button>
                  {uploadProgress.thumbnail > 0 && (
                    <div className="space-y-1">
                      <Progress value={uploadProgress.thumbnail} className="h-2" />
                      <p className="text-xs text-muted-foreground">{uploadProgress.thumbnail}% kész</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" ref={thumbInputRef} onChange={handleThumbChange} className="hidden" />
                {thumbnailUrl && (
                  <div className="relative">
                    <img src={thumbnailUrl} alt="Bélyegkép előnézet" className="mt-2 h-32 rounded border object-cover" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setThumbnailUrl("")}
                      className="absolute top-2 right-2 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {lesson.type === "READING" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Feladat leírás</label>
              <Textarea rows={6} value={assessment} onChange={(e) => setAssessment(e.target.value)} />
            </div>
          )}

          {lesson.type === "PDF" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">PDF dokumentum URL</label>
                <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Vagy tölts fel PDF dokumentumot</label>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={uploading.pdf}
                >
                  {uploading.pdf ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploading.pdf ? "Feltöltés..." : "PDF feltöltése"}
                </Button>
                {uploadProgress.pdf > 0 && (
                  <div className="space-y-1">
                    <Progress value={uploadProgress.pdf} className="h-2" />
                    <p className="text-xs text-muted-foreground">{uploadProgress.pdf}% kész</p>
                  </div>
                )}
                <input type="file" accept="application/pdf" ref={pdfInputRef} onChange={handlePdfChange} className="hidden" />
              </div>
              
              {pdfUrl && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-600">PDF URL: {pdfUrl}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setPdfUrl("")}
                    className="mt-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Törlés
                  </Button>
                </div>
              )}
            </div>
          )}

          {lesson.type === "AUDIO" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Hangfájl URL</label>
                <Input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Vagy tölts fel hangfájlt</label>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => audioInputRef.current?.click()}
                  disabled={uploading.audio}
                >
                  {uploading.audio ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploading.audio ? "Feltöltés..." : "Hangfájl feltöltése"}
                </Button>
                {uploadProgress.audio > 0 && (
                  <div className="space-y-1">
                    <Progress value={uploadProgress.audio} className="h-2" />
                    <p className="text-xs text-muted-foreground">{uploadProgress.audio}% kész</p>
                  </div>
                )}
                <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioChange} className="hidden" />
              </div>
              
              {audioUrl && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-600">Audio URL: {audioUrl}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setAudioUrl("")}
                    className="mt-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Törlés
                  </Button>
                </div>
              )}
              
              {/* Transcript/Content for Audio */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Átírat vagy tartalom (opcionális)</label>
                <RichTextEditor
                  value={richText}
                  onChange={setRichText}
                  placeholder="Add átírást vagy kiegészítő tartalmat..."
                  className="min-h-[200px]"
                />
              </div>
              
              {/* Thumbnail for Audio */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Borítókép (opcionális)</label>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => thumbInputRef.current?.click()}
                  disabled={uploading.thumbnail}
                >
                  {uploading.thumbnail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploading.thumbnail ? "Feltöltés..." : "Borítókép feltöltése"}
                </Button>
                {thumbnailUrl && (
                  <div className="relative">
                    <img src={thumbnailUrl} alt="Borítókép előnézet" className="mt-2 h-32 rounded border object-cover" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setThumbnailUrl("")}
                      className="absolute top-2 right-2 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={saveLesson} disabled={saving}>
            {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Mentés
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 