'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { httpsCallable } from 'firebase/functions';
import { functions as fbFunctions } from '@/lib/firebase';
// import removed – lekérés API-ról

interface VideoUploadStepProps {
  onVideoUploaded: (assetId: string, playbackId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const VideoUploadStep: React.FC<VideoUploadStepProps> = ({
  onVideoUploaded,
  onNext,
  onBack,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string>('');
  const [assetId, setAssetId] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleCreateUpload = async () => {
    try {
      setIsUploading(true);
      const getMuxUploadUrlFn = httpsCallable(fbFunctions, 'getMuxUploadUrl');
      const result: any = await getMuxUploadUrlFn();
      const { id, url } = result.data || {};
      if (!url) throw new Error('Upload URL lekérése sikertelen');
      setUploadUrl(url);
      setAssetId(id);
      console.log('Upload URL created:', { id, url });
    } catch (error) {
      console.error('Failed to create upload URL:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadUrl) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload to Mux
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (response.ok) {
        console.log('File uploaded successfully');
        setUploadProgress(100);
        
        // For now, we'll simulate the playback ID
        // In a real implementation, you'd wait for the webhook
        const playbackId = '7cr9oniriGGJOBpa01wKdkgfFgAizc6rJqouFyofK01VU'; // Your actual playback ID
        onVideoUploaded(assetId, playbackId);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
        <CardDescription>
          Upload a video for this lesson. The video will be processed and optimized for streaming.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!uploadUrl ? (
          <div className="space-y-4">
            <Button 
              onClick={handleCreateUpload} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Creating Upload URL...' : 'Start Video Upload'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-file">Select Video File</Label>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="mt-2"
              />
            </div>
            
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-brand-secondary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadProgress === 100 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✅ Video uploaded successfully! Processing will complete shortly.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={onNext}
            disabled={uploadProgress < 100}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 