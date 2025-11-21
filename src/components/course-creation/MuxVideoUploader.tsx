'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions as fbFunctions } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCourseWizardStore } from '@/stores/courseWizardStore';

interface Props {
  onUploaded: (assetId: string, playbackId?: string) => void;
  lessonId?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export default function MuxVideoUploader({ onUploaded, lessonId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  
  const { setUploadProgress } = useCourseWizardStore();

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return 'Csak MP4, MOV, AVI vagy WebM videók engedélyezettek';
    }

    // No file size limit
    return null;
  };

  // Check asset status after upload
  const checkAssetStatus = useCallback(async (uploadedAssetId: string): Promise<void> => {
    try {
      const getMuxAssetStatusFn = httpsCallable(fbFunctions, 'getMuxAssetStatus');
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max wait

      const checkStatus = async (): Promise<void> => {
        attempts++;
        
        const result: any = await getMuxAssetStatusFn({ assetId: uploadedAssetId });
        
        if (!result.data?.success) {
          throw new Error('Asset status lekérése sikertelen');
        }

        const { status: assetStatus, playbackId, errors } = result.data;

        if (errors && errors.length > 0) {
          throw new Error(`Videó feldolgozási hiba: ${errors[0].message}`);
        }

        if (assetStatus === 'ready' && playbackId) {
          setStatus('done');
          setProgress(100);
          onUploaded(uploadedAssetId, playbackId);
          toast.success('Videó sikeresen feltöltve és feldolgozva!');
          return;
        }

        if (assetStatus === 'error') {
          throw new Error('Videó feldolgozás sikertelen');
        }

        // Still processing
        if (attempts < maxAttempts) {
          setProgress(Math.min(95, 70 + attempts)); // Show progress
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          throw new Error('Videó feldolgozás időtúllépés');
        }
      };

      await checkStatus();
    } catch (err: any) {
      console.error('Asset status check error:', err);
      setError(err.message || 'Videó státusz ellenőrzése sikertelen');
      setStatus('error');
    }
  }, [onUploaded]);

  const startUpload = async (file: File) => {
    try {
      // Reset state
      setError(null);
      setIsUploading(true);
      setStatus('uploading');
      setProgress(0);
      setFileName(file.name);

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Update store if lessonId provided
      if (lessonId) {
        setUploadProgress(lessonId, 0, 'uploading');
      }

      // 1) Get upload URL from backend
      const getMuxUploadUrlFn = httpsCallable(fbFunctions, 'getMuxUploadUrl');
      const result: any = await getMuxUploadUrlFn();
      
      if (!result.data?.success) {
        throw new Error(result.data?.error || 'Feltöltési URL lekérése sikertelen');
      }

      const { id, url, assetId: returnedAssetId } = result.data;
      setAssetId(returnedAssetId || id);

      // 2) Upload file to Mux or test endpoint
      if (url.includes('localhost') && url.includes('testVideoUpload')) {
        // Development mode - simulate upload
        console.log('🧪 Development upload simulation');
        
        // Simulate upload progress
        for (let i = 0; i <= 70; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setProgress(i);
          if (lessonId) {
            setUploadProgress(lessonId, i, 'uploading');
          }
        }
        
        // Call test upload endpoint
        const testUploadFn = httpsCallable(fbFunctions, 'testVideoUpload');
        const testResult: any = await testUploadFn({ assetId: returnedAssetId || id });
        
        if (!testResult.data?.success) {
          throw new Error('Development upload simulation failed');
        }
        
      } else {
        // Real Mux upload
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 70); // 0-70% for upload
              setProgress(pct);
              
              if (lessonId) {
                setUploadProgress(lessonId, pct, 'uploading');
              }
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Feltöltés sikertelen: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Hálózati hiba történt'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Feltöltés megszakítva'));
          });

          xhr.open('PUT', url);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });
      }

      // 3) Upload complete, now processing
      setStatus('processing');
      setProgress(70);
      
      if (lessonId) {
        setUploadProgress(lessonId, 70, 'uploading');
      }

      toast.info('Videó feltöltve, feldolgozás folyamatban...');

      // 4) Check asset status
      await checkAssetStatus(returnedAssetId || id);

      if (lessonId) {
        setUploadProgress(lessonId, 100, 'completed');
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Feltöltés sikertelen');
      setStatus('error');
      
      if (lessonId) {
        setUploadProgress(lessonId, 0, 'failed', err.message);
      }
      
      toast.error(err.message || 'Videó feltöltése sikertelen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && !isUploading) {
      startUpload(file);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setAssetId('');
    setFileName('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isUploading ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50'}
          ${status === 'error' ? 'border-red-500/50 bg-red-50' : ''}
          ${status === 'done' ? 'border-green-500/50 bg-green-50' : ''}
          ${!isUploading && status !== 'done' ? 'cursor-pointer' : ''}
        `}
        onClick={() => !isUploading && status !== 'done' && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {status === 'idle' && (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-base font-medium mb-1">
              Húzd ide a videófájlt vagy kattints a feltöltéshez
            </p>
            <p className="text-sm text-muted-foreground">
              MP4, MOV, AVI vagy WebM formátum
            </p>
          </>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {fileName}
              </p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {status === 'uploading' ? `Feltöltés: ${progress}%` : 'Videó feldolgozása...'}
              </p>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-3">
            <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
            <div>
              <p className="text-sm font-medium text-green-700">
                Videó sikeresen feltöltve!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {fileName}
              </p>
              {assetId && (
                <p className="text-xs text-muted-foreground font-mono mt-2">
                  Asset ID: {assetId}
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <AlertCircle className="h-10 w-10 text-red-600 mx-auto" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Feltöltés sikertelen
              </p>
              <p className="text-xs text-red-600 mt-1">
                {error}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {(status === 'done' || status === 'error') && (
        <div className="flex justify-center">
          <Button
            variant={status === 'error' ? 'destructive' : 'outline'}
            size="sm"
            onClick={reset}
          >
            <X className="h-4 w-4 mr-2" />
            {status === 'error' ? 'Újrapróbálkozás' : 'Új videó feltöltése'}
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
        disabled={isUploading}
      />
    </div>
  );
}