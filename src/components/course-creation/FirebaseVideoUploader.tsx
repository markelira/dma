'use client';

import React, { useRef, useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2, AlertCircle, CheckCircle, X, Film, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

interface Props {
  onUploaded: (videoUrl: string, thumbnailUrl?: string) => void;
  courseId: string;
  lessonId?: string;
  maxSizeMB?: number;
  currentVideoUrl?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export default function FirebaseVideoUploader({
  onUploaded,
  courseId,
  lessonId,
  maxSizeMB = 2048, // 2GB default
  currentVideoUrl
}: Props) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>(currentVideoUrl || '');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [uploadTask, setUploadTask] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Validate video file
  const validateVideoFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
      return 'Csak MP4, MOV, AVI, WebM vagy OGG videók engedélyezettek';
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `A videó mérete maximum ${maxSizeMB}MB lehet`;
    }

    return null;
  };

  // Validate thumbnail file
  const validateThumbnailFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Csak JPEG, PNG vagy WebP képek engedélyezettek';
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'A kép mérete maximum 5MB lehet';
    }

    return null;
  };

  // Generate safe filename
  const generateSafeFileName = (originalName: string, prefix: string): string => {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const safeName = originalName
      .split('.')[0]
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    return `${prefix}_${timestamp}_${safeName}.${extension}`;
  };

  // Upload video to Firebase Storage
  const uploadVideo = async (file: File) => {
    try {
      setError(null);
      setIsUploading(true);
      setStatus('uploading');
      setUploadProgress(0);
      setFileName(file.name);

      // Validate file
      const validationError = validateVideoFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Create storage reference
      const fileName = generateSafeFileName(file.name, `course_${courseId}_lesson_${lessonId || 'new'}`);
      const storageRef = ref(storage, `courses/${courseId}/videos/${fileName}`);

      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          courseId,
          lessonId: lessonId || '',
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      setUploadTask(uploadTask);

      // Monitor upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          setError('Videó feltöltése sikertelen: ' + error.message);
          setStatus('error');
          setIsUploading(false);
        },
        async () => {
          // Upload completed successfully
          try {
            setStatus('processing');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            setVideoUrl(downloadURL);
            setStatus('done');
            setIsUploading(false);
            
            // Call callback with video URL
            onUploaded(downloadURL, thumbnailUrl);
            
            toast.success('Videó sikeresen feltöltve!');
          } catch (err: any) {
            console.error('Error getting download URL:', err);
            setError('Nem sikerült a videó URL lekérése');
            setStatus('error');
            setIsUploading(false);
          }
        }
      );

    } catch (err: any) {
      console.error('Video upload error:', err);
      setError(err.message || 'Videó feltöltése sikertelen');
      setStatus('error');
      setIsUploading(false);
    }
  };

  // Upload thumbnail
  const uploadThumbnail = async (file: File) => {
    try {
      // Validate file
      const validationError = validateThumbnailFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const fileName = generateSafeFileName(file.name, `thumb_${courseId}_${lessonId || 'new'}`);
      const storageRef = ref(storage, `courses/${courseId}/thumbnails/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          courseId,
          lessonId: lessonId || '',
          type: 'thumbnail'
        }
      });

      uploadTask.on('state_changed',
        () => {},
        (error) => {
          console.error('Thumbnail upload error:', error);
          toast.error('Előnézeti kép feltöltése sikertelen');
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setThumbnailUrl(downloadURL);
          
          if (videoUrl) {
            onUploaded(videoUrl, downloadURL);
          }
          
          toast.success('Előnézeti kép feltöltve!');
        }
      );

    } catch (err: any) {
      console.error('Thumbnail upload error:', err);
      toast.error('Előnézeti kép feltöltése sikertelen');
    }
  };

  // Cancel upload
  const cancelUpload = () => {
    if (uploadTask) {
      uploadTask.cancel();
      setIsUploading(false);
      setStatus('idle');
      setUploadProgress(0);
      setError(null);
      toast.info('Feltöltés megszakítva');
    }
  };

  // Handle video file selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadVideo(file);
    }
  };

  // Handle thumbnail file selection
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadThumbnail(file);
    }
  };

  // Drag & drop handlers for video
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading && !videoUrl) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading || videoUrl) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      uploadVideo(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Upload */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Videó feltöltése</h3>
            </div>
            {status === 'done' && videoUrl && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>

          {!isUploading && !videoUrl && (
            <div
              onClick={() => videoInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${isDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }
              `}
            >
              <Upload className={`mx-auto h-12 w-12 transition-colors ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
              <p className={`mt-2 text-sm transition-colors ${isDragging ? 'text-primary font-medium' : 'text-gray-600'}`}>
                {isDragging ? 'Engedd el a fájlt a feltöltéshez' : 'Kattints vagy húzd ide a videó fájlt'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP4, MOV, AVI, WebM vagy OGG (max {maxSizeMB}MB)
              </p>
            </div>
          )}

          {isUploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate max-w-xs">{fileName}</span>
                <span className="text-primary font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {status === 'uploading' ? 'Feltöltés...' : 'Feldolgozás...'}
                </span>
                {status === 'uploading' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelUpload}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Mégse
                  </Button>
                )}
              </div>
            </div>
          )}

          {videoUrl && !isUploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileVideo className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700">Videó feltöltve</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => videoInputRef.current?.click()}
                >
                  Csere
                </Button>
              </div>
              
              {/* Video Preview */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full"
                  poster={thumbnailUrl}
                >
                  A böngésződ nem támogatja a videó lejátszást.
                </video>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/ogg"
            onChange={handleVideoSelect}
            className="hidden"
          />
        </div>
      </Card>

      {/* Thumbnail Upload */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileVideo className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Előnézeti kép (opcionális)</h3>
          </div>

          {!thumbnailUrl ? (
            <Button
              variant="outline"
              onClick={() => thumbnailInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Előnézeti kép feltöltése
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={thumbnailUrl}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => thumbnailInputRef.current?.click()}
                className="w-full"
              >
                Előnézeti kép cseréje
              </Button>
            </div>
          )}

          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleThumbnailSelect}
            className="hidden"
          />
        </div>
      </Card>
    </div>
  );
}