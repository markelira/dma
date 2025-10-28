import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { API_BASE_URL } from '@/constants'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'

interface UniversityLogoUploaderProps {
  universityId: string
  logoUrl?: string | null
  onUploaded: () => void
  onRemoved: () => void
}

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

export function UniversityLogoUploader({ universityId, logoUrl, onUploaded, onRemoved }: UniversityLogoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(logoUrl || null)
  const [progress, setProgress] = useState<number>(0)
  const [uploading, setUploading] = useState<boolean>(false)

  // Keep preview in sync with incoming logoUrl prop (e.g., after page refresh)
  useEffect(() => {
    setPreview(logoUrl || null)
  }, [logoUrl])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validation
    if (file.size > MAX_SIZE) {
      toast.error('A fájl mérete nem haladhatja meg a 2MB-ot')
      return
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error('Csak JPG, PNG vagy WebP formátum engedélyezett')
      return
    }

    // Local preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Firebase Storage
    try {
      setUploading(true)
      setProgress(10)

      // Convert file to base64 for Cloud Function
      const fileReader = new FileReader()
      const fileDataPromise = new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string)
        fileReader.onerror = reject
        fileReader.readAsDataURL(file)
      })

      setProgress(30)
      const fileData = await fileDataPromise

      setProgress(50)

      // Call the upload Cloud Function
      const uploadLogoFn = httpsCallable(functions, 'uploadUniversityLogo')
      const result: any = await uploadLogoFn({
        universityId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData
      })

      setProgress(90)

      if (!result.data.success) {
        throw new Error(result.data.error || 'Hiba a logó feltöltésekor')
      }

      setProgress(100)
      
      // Update preview with the actual uploaded URL
      setPreview(result.data.logoUrl)
      
      toast.success(result.data.message || 'Logó sikeresen feltöltve')
      
      // Notify parent component
      onUploaded()

    } catch (err: any) {
      console.error('Logo upload error:', err)
      
      let errorMessage = 'Hiba a logó feltöltésekor'
      
      if (err?.details?.details) {
        // Validation errors from Cloud Function
        const validationErrors = err.details.details
        errorMessage = validationErrors.map((e: any) => e.message).join(', ')
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      toast.error(errorMessage)
      
      // Revert preview on error
      setPreview(logoUrl || null)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [universityId, logoUrl, onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: MAX_SIZE,
  })

  const handleRemove = async () => {
    try {
      setUploading(true)
      
      // Call the delete logo Cloud Function
      const deleteLogoFn = httpsCallable(functions, 'deleteUniversityLogo')
      const result: any = await deleteLogoFn({ universityId })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Hiba a logó eltávolításakor')
      }
      
      toast.success(result.data.message || 'Logó eltávolítva')
      setPreview(null)
      onRemoved()
    } catch (err: any) {
      console.error('Logo delete error:', err)
      
      let errorMessage = 'Hiba a logó eltávolításakor'
      
      if (err?.details?.details) {
        const validationErrors = err.details.details
        errorMessage = validationErrors.map((e: any) => e.message).join(', ')
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Logó</label>
      <div
        {...getRootProps()}
        className={`relative flex items-center justify-center border-2 border-dashed rounded-md p-4 cursor-pointer transition-colors h-52 w-full md:w-60 
          ${isDragActive ? 'border-primary/80 bg-primary/10' : 'border-muted'}
        `}
      >
        <input {...getInputProps()} />
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 gap-2 text-sm">
            <Spinner />
            <span>Feltöltés...</span>
            <ProgressBar value={progress} className="w-40" />
          </div>
        )}

        {!uploading && (
          <>
            {preview ? (
              (() => {
                const src = preview.startsWith('data:') || preview.startsWith('http')
                  ? preview
                  : `${API_BASE_URL.replace('/api','')}${preview}`
                return <Image src={src} alt="logo preview" width={200} height={200} className="object-contain h-40 w-auto" />
              })()
            ) : (
              <span className="text-muted-foreground text-sm text-center">
                {isDragActive ? 'Dobja ide a logót...' : 'Húzza ide a logót vagy kattintson a feltöltéshez'}
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2 mt-2">
        <Button type="button" onClick={() => {}} variant="outline" size="sm">
          Logó cseréje
        </Button>
        <Button type="button" onClick={handleRemove} variant="destructive" size="sm" disabled={uploading || !preview}>
          Logó eltávolítása
        </Button>
      </div>
    </div>
  )
} 