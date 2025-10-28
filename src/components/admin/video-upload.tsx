'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Upload, Video, X, Link, FileVideo } from 'lucide-react'
import { storage } from '@/lib/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { toast } from 'sonner'

interface VideoUploadProps {
  value: string
  onChange: (url: string) => void
  courseId: string
  lessonId?: string
}

export function VideoUpload({ value, onChange, courseId, lessonId }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [inputType, setInputType] = useState<'url' | 'upload'>(value && !value.startsWith('https://firebasestorage') ? 'url' : 'upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!validTypes.includes(file.type)) {
      toast.error('Csak videó fájlokat tölthet fel (MP4, WebM, OGG, MOV)')
      return
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024 // 500MB in bytes
    if (file.size > maxSize) {
      toast.error('A fájl mérete nem lehet nagyobb mint 500MB')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create a unique file name
      const timestamp = Date.now()
      const fileName = `courses/${courseId}/lessons/${lessonId || 'temp'}/${timestamp}_${file.name}`
      const storageRef = ref(storage, fileName)

      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(Math.round(progress))
        },
        (error) => {
          // Handle upload error
          console.error('Upload error:', error)
          toast.error('Hiba történt a feltöltés során')
          setUploading(false)
          setUploadProgress(0)
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
            onChange(downloadUrl)
            toast.success('Videó sikeresen feltöltve!')
            setUploading(false)
            setUploadProgress(0)
          } catch (error) {
            console.error('Error getting download URL:', error)
            toast.error('Hiba történt a videó URL megszerzése során')
            setUploading(false)
            setUploadProgress(0)
          }
        }
      )
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Hiba történt a feltöltés során')
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const clearVideo = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={inputType === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputType('upload')}
        >
          <FileVideo className="mr-2 h-4 w-4" />
          Fájl feltöltése
        </Button>
        <Button
          type="button"
          variant={inputType === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputType('url')}
        >
          <Link className="mr-2 h-4 w-4" />
          URL megadása
        </Button>
      </div>

      {inputType === 'upload' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="flex-1"
            />
            {value && !uploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearVideo}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {uploading && (
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Feltöltés folyamatban...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </Card>
          )}

          {value && !uploading && value.startsWith('https://firebasestorage') && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Video className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Videó feltöltve</p>
                  <p className="text-xs text-muted-foreground truncate">{value}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearVideo}
                >
                  Törlés
                </Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            type="url"
            value={value}
            onChange={handleUrlChange}
            placeholder="https://example.com/video.mp4 vagy YouTube/Vimeo link"
            disabled={uploading}
          />
          
          {value && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Link className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Külső videó link</p>
                  <p className="text-xs text-muted-foreground truncate">{value}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearVideo}
                >
                  Törlés
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {value && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <Label className="text-sm font-medium mb-2 block">Videó előnézet</Label>
          <video
            controls
            className="w-full max-w-2xl rounded-lg"
            src={value}
          >
            A böngésző nem támogatja a videó lejátszást.
          </video>
        </div>
      )}
    </div>
  )
}