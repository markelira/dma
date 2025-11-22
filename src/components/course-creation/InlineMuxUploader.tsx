'use client';

import React, { useRef, useCallback } from 'react';
import { Upload, X, FileVideo, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  lessonId: string;
  pendingFile?: {
    name: string;
    size: number;
    type: string;
  };
  existingVideoUrl?: string;
  existingPlaybackId?: string;
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Validate file before selection
function validateFile(file: File): string | null {
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    return 'Csak MP4, MOV, AVI vagy WebM videók engedélyezettek';
  }
  // Max 5GB
  const maxSize = 5 * 1024 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'A fájl mérete nem lehet nagyobb 5GB-nál';
  }
  return null;
}

export default function InlineMuxUploader({
  lessonId,
  pendingFile,
  existingVideoUrl,
  existingPlaybackId,
  onFileSelected,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    onFileSelected(file);
    toast.success(`"${file.name}" kiválasztva - feltöltés a publikáláskor`);
  }, [onFileSelected]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const clearFile = useCallback(() => {
    onFileSelected(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onFileSelected]);

  // Has existing video (already uploaded)
  const hasExistingVideo = !!(existingVideoUrl || existingPlaybackId);

  // Has pending file (selected but not uploaded)
  const hasPendingFile = !!pendingFile;

  return (
    <div className="space-y-3">
      {/* File selection area */}
      {!hasPendingFile && !hasExistingVideo && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all
            border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onClick={() => !disabled && inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">
            Húzd ide a videófájlt vagy kattints
          </p>
          <p className="text-xs text-muted-foreground">
            MP4, MOV, AVI vagy WebM (max 5GB)
          </p>
        </div>
      )}

      {/* Pending file display */}
      {hasPendingFile && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex-shrink-0">
            <FileVideo className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 truncate">
              {pendingFile.name}
            </p>
            <p className="text-xs text-blue-600">
              {formatFileSize(pendingFile.size)} • Feltöltés publikáláskor
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFile}
            disabled={disabled}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Existing video display */}
      {hasExistingVideo && !hasPendingFile && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900">
                Videó már feltöltve
              </p>
              {existingPlaybackId && (
                <p className="text-xs text-green-600 font-mono truncate">
                  Mux ID: {existingPlaybackId}
                </p>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Videó cseréje
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  );
}
