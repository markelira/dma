"use client"

import React, { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Clock, 
  Eye,
  Bookmark,
  Volume2,
  VolumeX,
  Type,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  FileText,
  Highlighter
} from 'lucide-react'

// Import KaTeX CSS and JS for formula rendering
import 'katex/dist/katex.min.css'

interface ResumeContext {
  scrollPercentage?: number
  showResumeNotification?: boolean
  resumeMessage?: string
}

interface RichTextContentRendererProps {
  content: string
  lessonType: 'TEXT' | 'READING'
  title?: string
  estimatedReadingTime?: number
  onProgressUpdate?: (progressPercentage: number, timeSpent: number) => void
  className?: string
  resumeContext?: ResumeContext | null
}

interface ReadingSettings {
  fontSize: number
  lineHeight: number
  fontFamily: string
  theme: 'light' | 'dark' | 'sepia'
  isTextToSpeechEnabled: boolean
  highlightColor: string
}

interface ReadingProgress {
  scrollPercentage: number
  timeSpent: number
  highlights: Array<{
    id: string
    text: string
    color: string
    position: number
    createdAt: Date
  }>
  bookmarks: Array<{
    id: string
    title: string
    position: number
    createdAt: Date
  }>
}

export const RichTextContentRenderer: React.FC<RichTextContentRendererProps> = ({
  content,
  lessonType,
  title,
  estimatedReadingTime,
  onProgressUpdate,
  className = ''
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [startTime] = useState(new Date())
  
  // Reading settings
  const [settings, setSettings] = useState<ReadingSettings>({
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: 'Georgia, serif',
    theme: 'light',
    isTextToSpeechEnabled: false,
    highlightColor: '#fef08a' // yellow-200
  })

  // Reading progress
  const [progress, setProgress] = useState<ReadingProgress>({
    scrollPercentage: 0,
    timeSpent: 0,
    highlights: [],
    bookmarks: []
  })

  // Speech synthesis
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis)
    }
  }, [])

  // Calculate reading progress based on scroll position
  const updateScrollProgress = () => {
    if (!contentRef.current) return

    const element = contentRef.current
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight - element.clientHeight
    const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
    
    const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000)
    
    setProgress(prev => ({
      ...prev,
      scrollPercentage: Math.min(scrollPercentage, 100),
      timeSpent
    }))

    // Report progress up
    if (onProgressUpdate) {
      onProgressUpdate(Math.min(scrollPercentage, 100), timeSpent)
    }
  }

  // Scroll progress tracking
  useEffect(() => {
    const element = contentRef.current
    if (!element) return

    element.addEventListener('scroll', updateScrollProgress)
    return () => element.removeEventListener('scroll', updateScrollProgress)
  }, [onProgressUpdate])

  // Time-based progress tracking
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000)
      setProgress(prev => ({ ...prev, timeSpent }))
      
      // Calculate progress based on estimated reading time
      if (estimatedReadingTime && onProgressUpdate) {
        const timePercentage = Math.min((timeSpent / (estimatedReadingTime * 60)) * 100, 100)
        onProgressUpdate(Math.max(progress.scrollPercentage, timePercentage), timeSpent)
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [estimatedReadingTime, onProgressUpdate, progress.scrollPercentage])

  // Theme styles
  const getThemeStyles = (theme: string) => {
    switch (theme) {
      case 'dark':
        return {
          backgroundColor: '#1f2937',
          color: '#f9fafb',
          '--selection-bg': '#374151'
        }
      case 'sepia':
        return {
          backgroundColor: '#fef7ed',
          color: '#451a03',
          '--selection-bg': '#fed7aa'
        }
      default:
        return {
          backgroundColor: '#ffffff',
          color: '#1f2937',
          '--selection-bg': '#dbeafe'
        }
    }
  }

  // Text-to-speech functions
  const startSpeech = () => {
    if (!speechSynthesis || !contentRef.current) return

    const textContent = contentRef.current.textContent || ''
    const utterance = new SpeechSynthesisUtterance(textContent)
    
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8
    utterance.lang = 'hu-HU'

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      setCurrentUtterance(null)
    }

    speechSynthesis.speak(utterance)
    setCurrentUtterance(utterance)
  }

  const stopSpeech = () => {
    if (speechSynthesis && isSpeaking) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      setCurrentUtterance(null)
    }
  }

  // Font size controls
  const increaseFontSize = () => {
    setSettings(prev => ({ ...prev, fontSize: Math.min(prev.fontSize + 2, 24) }))
  }

  const decreaseFontSize = () => {
    setSettings(prev => ({ ...prev, fontSize: Math.max(prev.fontSize - 2, 12) }))
  }

  // Sanitize and process HTML content
  const processContent = (htmlContent: string) => {
    // Basic HTML sanitization and processing
    let processed = htmlContent
    
    // Ensure proper paragraph spacing
    processed = processed.replace(/<p>/g, '<p class="mb-4">')
    
    // Style headings
    processed = processed.replace(/<h1([^>]*)>/g, '<h1$1 class="text-3xl font-bold mb-6 mt-8">')
    processed = processed.replace(/<h2([^>]*)>/g, '<h2$1 class="text-2xl font-semibold mb-4 mt-6">')
    processed = processed.replace(/<h3([^>]*)>/g, '<h3$1 class="text-xl font-medium mb-3 mt-5">')
    
    // Style lists
    processed = processed.replace(/<ul([^>]*)>/g, '<ul$1 class="list-disc list-inside mb-4 space-y-2">')
    processed = processed.replace(/<ol([^>]*)>/g, '<ol$1 class="list-decimal list-inside mb-4 space-y-2">')
    processed = processed.replace(/<li>/g, '<li class="ml-4">')
    
    // Style blockquotes
    processed = processed.replace(/<blockquote([^>]*)>/g, '<blockquote$1 class="border-l-4 border-blue-400 pl-4 italic my-4 text-gray-600">')
    
    // Style code blocks
    processed = processed.replace(/<pre([^>]*)>/g, '<pre$1 class="bg-gray-100 p-4 rounded-lg my-4 overflow-x-auto">')
    processed = processed.replace(/<code>/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">')
    
    // Style tables
    processed = processed.replace(/<table([^>]*)>/g, '<table$1 class="w-full border-collapse border border-gray-300 my-4">')
    processed = processed.replace(/<th>/g, '<th class="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left">')
    processed = processed.replace(/<td>/g, '<td class="border border-gray-300 px-4 py-2">')
    
    return processed
  }

  // Render KaTeX formulas
  useEffect(() => {
    if (!contentRef.current || !isInitialized) return

    const formulaElements = contentRef.current.querySelectorAll('.ql-formula')
    formulaElements.forEach((element) => {
      const latex = element.getAttribute('data-value')
      if (latex && typeof window !== 'undefined' && (window as any).katex) {
        try {
          (window as any).katex.render(latex, element, {
            throwOnError: false,
            displayMode: element.classList.contains('ql-formula-display')
          })
        } catch (e) {
          element.textContent = latex
        }
      }
    })
  }, [content, isInitialized])

  // Initialize component
  useEffect(() => {
    setIsInitialized(true)
  }, [])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const themeStyles = getThemeStyles(settings.theme)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Reading Controls Header */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50">
                {lessonType === 'READING' ? (
                  <BookOpen className="w-5 h-5 text-blue-600" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <Badge className="text-xs">
                  {lessonType === 'READING' ? 'Olvasmány' : 'Szöveg'}
                </Badge>
                {estimatedReadingTime && (
                  <Badge className="ml-2 text-xs bg-gray-100 text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    ~{estimatedReadingTime} perc
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Eye className="w-4 h-4" />
              <span>{formatTime(progress.timeSpent)}</span>
              <span className="mx-2">•</span>
              <span>{Math.round(progress.scrollPercentage)}% elolvasva</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font size controls */}
            <Button variant="outline" size="sm" onClick={decreaseFontSize}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={increaseFontSize}>
              <ZoomIn className="w-4 h-4" />
            </Button>

            {/* Theme toggle */}            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const themes: ReadingSettings['theme'][] = ['light', 'dark', 'sepia']
                const currentIndex = themes.indexOf(settings.theme)
                const nextTheme = themes[(currentIndex + 1) % themes.length]
                setSettings(prev => ({ ...prev, theme: nextTheme }))
              }}
            >
              <Type className="w-4 h-4" />
            </Button>

            {/* Text-to-speech */}
            {speechSynthesis && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={isSpeaking ? stopSpeech : startSpeech}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Olvasási haladás</span>
            <span>{Math.round(progress.scrollPercentage)}%</span>
          </div>
          <Progress value={progress.scrollPercentage} className="h-2" />
        </div>
      </Card>

      {/* Main Content Area */}
      <Card className="overflow-hidden">
        <div 
          ref={contentRef}
          className="prose prose-lg max-w-none p-8 overflow-y-auto max-h-[70vh]"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            fontFamily: settings.fontFamily,
            ...themeStyles
          }}
        >
          {/* Content Title */}
          {title && (
            <h1 className="text-3xl font-bold mb-6 border-b pb-4">
              {title}
            </h1>
          )}

          {/* Rich Content */}
          <div 
            className="rich-content"
            dangerouslySetInnerHTML={{ 
              __html: processContent(content || 'Nincs tartalom megadva ehhez a leckéhez.') 
            }}
          />

          {/* Reading completion indicator */}
          {progress.scrollPercentage >= 90 && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Olvasás befejezve!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Gratulálunk! Végigolvasta a teljes tartalmat {formatTime(progress.timeSpent)} alatt.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Custom CSS for better typography */}
      <style jsx>{`
        .rich-content ::selection {
          background-color: var(--selection-bg, #dbeafe);
        }
        
        .rich-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        
        .rich-content .ql-custom-table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        
        .rich-content .ql-custom-table td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          min-width: 80px;
        }
        
        .rich-content .ql-formula {
          display: inline-block;
          margin: 0 2px;
        }
        
        .rich-content .ql-code-block {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.4;
          overflow-x: auto;
        }
      `}</style>
    </div>
  )
}