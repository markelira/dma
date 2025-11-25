"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Printer,
  Search,
  Bookmark,
  MessageSquare,
  Highlighter,
  Clock,
  X,
  Plus,
  Edit3,
  Trash2,
  Save,
  Type,
  Square,
  Circle,
  ArrowRight,
  Palette,
  StickerIcon,
  Tag,
  Filter,
  Settings,
  Share2,
  Copy,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  List,
  Grid3X3,
  BookOpen,
  Star,
  Heart,
  Flag
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PDFViewerProps {
  pdfUrl: string
  title?: string
  onProgressUpdate?: (progressPercentage: number, timeSpent: number) => void
  onPageChange?: (currentPage: number, totalPages: number) => void
  enableAnnotations?: boolean
  enableDownload?: boolean
  className?: string
}

interface PDFAnnotation {
  id: string
  page: number
  x: number
  y: number
  width?: number
  height?: number
  text: string
  type: 'highlight' | 'note' | 'bookmark' | 'drawing' | 'text' | 'shape' | 'stamp'
  color?: string
  backgroundColor?: string
  borderColor?: string
  fontSize?: number
  fontFamily?: string
  opacity?: number
  author?: string
  createdAt: Date
  updatedAt?: Date
  replies?: PDFAnnotationReply[]
  tags?: string[]
  category?: string
  isPrivate?: boolean
  shape?: 'rectangle' | 'circle' | 'arrow' | 'line'
}

interface PDFAnnotationReply {
  id: string
  author: string
  text: string
  createdAt: Date
}

interface SearchResult {
  page: number
  text: string
  context: string
  position: { x: number; y: number }
  matchIndex: number
}

interface PDFBookmark {
  id: string
  page: number
  title: string
  description?: string
  createdAt: Date
  color?: string
  category?: string
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  title,
  onProgressUpdate,
  onPageChange,
  enableAnnotations = true,
  enableDownload = true,
  className = ''
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [viewProgress, setViewProgress] = useState(0)
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([])
  const [bookmarks, setBookmarks] = useState<PDFBookmark[]>([])
  const [timeSpent, setTimeSpent] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [selectedTool, setSelectedTool] = useState<'select' | 'highlight' | 'note' | 'drawing' | 'text' | 'shape'>('select')
  const [annotationColor, setAnnotationColor] = useState('#FFD700')
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingPath, setDrawingPath] = useState<Array<{x: number, y: number}>>([])
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const [annotationFilter, setAnnotationFilter] = useState<string>('all')
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false)
  const [newAnnotationText, setNewAnnotationText] = useState('')
  const [editingAnnotation, setEditingAnnotation] = useState<PDFAnnotation | null>(null)
  
  const viewerRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<Date>(new Date())
  const pagesViewedRef = useRef<Set<number>>(new Set())

  // Load PDF.js library dynamically
  useEffect(() => {
    const loadPdfJs = async () => {
      if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
        script.async = true
        document.head.appendChild(script)
        
        const workerScript = document.createElement('script')
        workerScript.textContent = `
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
        `
        
        script.onload = () => {
          document.head.appendChild(workerScript)
          loadPDF()
        }
      } else {
        loadPDF()
      }
    }
    
    loadPdfJs()
  }, [pdfUrl])

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => {
        const newTime = prev + 1
        const progress = (pagesViewedRef.current.size / totalPages) * 100
        onProgressUpdate?.(progress, newTime)
        return newTime
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [totalPages, onProgressUpdate])

  const loadPDF = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch PDF data
      const response = await fetch(pdfUrl)
      if (!response.ok) throw new Error('PDF betöltése sikertelen')
      
      const data = await response.arrayBuffer()
      setPdfData(data)
      
      // Load PDF with PDF.js
      const pdfjsLib = (window as any).pdfjsLib
      if (!pdfjsLib) {
        throw new Error('PDF.js könyvtár nem található')
      }
      
      const pdf = await pdfjsLib.getDocument({ data }).promise
      setTotalPages(pdf.numPages)
      
      // Render first page
      await renderPage(pdf, 1)
      setLoading(false)
      
    } catch (err) {
      console.error('PDF loading error:', err)
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba')
      setLoading(false)
    }
  }

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale, rotation })
      
      // Create canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      // Add to viewer
      if (viewerRef.current) {
        viewerRef.current.innerHTML = ''
        viewerRef.current.appendChild(canvas)
      }
      
      // Track page view
      pagesViewedRef.current.add(pageNum)
      setViewProgress((pagesViewedRef.current.size / totalPages) * 100)
      
      // Notify parent
      onPageChange?.(pageNum, totalPages)
      
    } catch (err) {
      console.error('Page render error:', err)
    }
  }

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages && pdfData) {
      setCurrentPage(pageNum)
      const pdfjsLib = (window as any).pdfjsLib
      pdfjsLib.getDocument({ data: pdfData }).promise.then((pdf: any) => {
        renderPage(pdf, pageNum)
      })
    }
  }

  const handleZoom = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale + delta))
    setScale(newScale)
    if (pdfData) goToPage(currentPage)
  }

  const handleRotate = () => {
    setRotation((rotation + 90) % 360)
    if (pdfData) goToPage(currentPage)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = title || 'document.pdf'
    link.click()
  }

  const handlePrint = () => {
    window.open(pdfUrl, '_blank')?.print()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Enhanced search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim() || !pdfData) return

    setIsSearching(true)
    setSearchQuery(query)
    
    try {
      const pdfjsLib = (window as any).pdfjsLib
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
      const results: SearchResult[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        const textItems = textContent.items
        const pageText = textItems.map((item: any) => item.str).join(' ')
        
        const regex = new RegExp(query, 'gi')
        let match
        let matchIndex = 0

        while ((match = regex.exec(pageText)) !== null) {
          const contextStart = Math.max(0, match.index - 30)
          const contextEnd = Math.min(pageText.length, match.index + match[0].length + 30)
          const context = pageText.slice(contextStart, contextEnd)

          results.push({
            page: pageNum,
            text: match[0],
            context: context,
            position: { x: 0, y: 0 }, // Would need more complex calculation for exact positioning
            matchIndex: matchIndex++
          })
        }
      }

      setSearchResults(results)
      setCurrentSearchIndex(0)
      
      if (results.length > 0) {
        goToPage(results[0].page)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Navigation through search results
  const navigateSearchResults = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return

    let newIndex = currentSearchIndex
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1
    }

    setCurrentSearchIndex(newIndex)
    goToPage(searchResults[newIndex].page)
  }

  // Add annotation
  const addAnnotation = (x: number, y: number, width: number = 100, height: number = 20) => {
    const newAnnotation: PDFAnnotation = {
      id: `annotation-${Date.now()}`,
      page: currentPage,
      x,
      y,
      width,
      height,
      text: newAnnotationText || 'New annotation',
      type: selectedTool === 'highlight' ? 'highlight' : selectedTool === 'note' ? 'note' : 'text',
      color: annotationColor,
      backgroundColor: selectedTool === 'highlight' ? annotationColor + '40' : 'transparent',
      author: 'Current User',
      createdAt: new Date(),
      tags: [],
      isPrivate: false
    }

    setAnnotations(prev => [...prev, newAnnotation])
    setNewAnnotationText('')
    setShowAnnotationDialog(false)
  }

  // Edit annotation
  const editAnnotation = (annotation: PDFAnnotation) => {
    setEditingAnnotation(annotation)
    setNewAnnotationText(annotation.text)
    setShowAnnotationDialog(true)
  }

  // Update annotation
  const updateAnnotation = (updatedAnnotation: PDFAnnotation) => {
    setAnnotations(prev => 
      prev.map(annotation => 
        annotation.id === updatedAnnotation.id ? updatedAnnotation : annotation
      )
    )
    setEditingAnnotation(null)
    setShowAnnotationDialog(false)
  }

  // Delete annotation
  const deleteAnnotation = (annotationId: string) => {
    setAnnotations(prev => prev.filter(annotation => annotation.id !== annotationId))
    setSelectedAnnotation(null)
  }

  // Add bookmark
  const addBookmark = () => {
    const newBookmark: PDFBookmark = {
      id: `bookmark-${Date.now()}`,
      page: currentPage,
      title: `Bookmark - Page ${currentPage}`,
      description: '',
      createdAt: new Date(),
      color: '#3B82F6',
      category: 'general'
    }

    setBookmarks(prev => [...prev, newBookmark])
  }

  // Filter annotations
  const filteredAnnotations = annotations.filter(annotation => {
    if (annotationFilter === 'all') return true
    if (annotationFilter === 'page') return annotation.page === currentPage
    return annotation.type === annotationFilter
  })

  // Handle canvas click for annotations
  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'select') return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    if (selectedTool === 'note' || selectedTool === 'text') {
      setShowAnnotationDialog(true)
      // Store position for when dialog is submitted
      event.currentTarget.dataset.pendingX = x.toString()
      event.currentTarget.dataset.pendingY = y.toString()
    } else if (selectedTool === 'highlight') {
      addAnnotation(x, y, 150, 20)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto"></div>
          <p className="text-gray-600">PDF betöltése...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <FileText className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-red-600">Hiba: {error}</p>
          <Button onClick={() => loadPDF()} variant="outline">
            Újrapróbálás
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">{title || 'PDF dokumentum'}</h3>
            <Badge variant="secondary">
              {currentPage} / {totalPages} oldal
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
        
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Megtekintett oldalak</span>
            <span>{Math.round(viewProgress)}%</span>
          </div>
          <Progress value={viewProgress} className="h-1.5" />
        </div>
      </div>

      {/* Enhanced Toolbar */}
      <div className="bg-white border-b">
        {/* Main toolbar */}
        <div className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Navigation */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-sm text-center border rounded"
              />
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <div className="w-px h-6 bg-gray-300 mx-2" />
              
              {/* Zoom controls */}
              <Button size="sm" variant="ghost" onClick={() => handleZoom(-0.1)}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <span className="text-sm text-gray-600 px-2">
                {Math.round(scale * 100)}%
              </span>
              
              <Button size="sm" variant="ghost" onClick={() => handleZoom(0.1)}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <div className="w-px h-6 bg-gray-300 mx-2" />
              
              {/* Tool selection */}
              {enableAnnotations && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant={selectedTool !== 'select' ? 'default' : 'ghost'}>
                        {selectedTool === 'highlight' && <Highlighter className="w-4 h-4" />}
                        {selectedTool === 'note' && <MessageSquare className="w-4 h-4" />}
                        {selectedTool === 'text' && <Type className="w-4 h-4" />}
                        {selectedTool === 'drawing' && <Edit3 className="w-4 h-4" />}
                        {selectedTool === 'shape' && <Square className="w-4 h-4" />}
                        {selectedTool === 'select' && <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedTool('select')}>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Kiválasztás
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedTool('highlight')}>
                        <Highlighter className="w-4 h-4 mr-2" />
                        Kiemelés
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedTool('note')}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Jegyzet
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedTool('text')}>
                        <Type className="w-4 h-4 mr-2" />
                        Szöveg
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedTool('drawing')}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Rajz
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedTool('shape')}>
                        <Square className="w-4 h-4 mr-2" />
                        Alakzat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Color picker */}
                  <input
                    type="color"
                    value={annotationColor}
                    onChange={(e) => setAnnotationColor(e.target.value)}
                    className="w-8 h-8 border rounded cursor-pointer"
                    title="Szín választás"
                  />

                  <Button size="sm" variant="ghost" onClick={addBookmark} title="Könyvjelző">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                </>
              )}
              
              {/* Other controls */}
              <Button size="sm" variant="ghost" onClick={handleRotate}>
                <RotateCw className="w-4 h-4" />
              </Button>
              
              <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Annotation visibility */}
              {enableAnnotations && (
                <>
                  <Button
                    size="sm"
                    variant={showAnnotations ? 'default' : 'ghost'}
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    title="Jegyzetelés mutatása/elrejtése"
                  >
                    {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant={showBookmarks ? 'default' : 'ghost'}
                    onClick={() => setShowBookmarks(!showBookmarks)}
                    title="Könyvjelzők mutatása/elrejtése"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                </>
              )}
              
              <Button size="sm" variant="ghost" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
              </Button>
              
              {enableDownload && (
                <Button size="sm" variant="ghost" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-2 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Keresés a dokumentumban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="pl-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-secondary"></div>
                </div>
              )}
            </div>
            
            <Button size="sm" onClick={() => handleSearch(searchQuery)} disabled={isSearching}>
              Keresés
            </Button>

            {searchResults.length > 0 && (
              <>
                <div className="text-sm text-gray-600">
                  {currentSearchIndex + 1} / {searchResults.length}
                </div>
                <Button size="sm" variant="outline" onClick={() => navigateSearchResults('prev')}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigateSearchResults('next')}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex">
        {/* Main PDF Viewer */}
        <div className="flex-1">
          <div 
            ref={viewerRef}
            className="bg-gray-100 overflow-auto relative"
            style={{ height: isFullscreen ? '100vh' : '600px' }}
            onClick={handleCanvasClick}
          >
            {/* PDF content will be rendered here */}
            
            {/* Annotations overlay */}
            {showAnnotations && filteredAnnotations
              .filter(annotation => annotation.page === currentPage)
              .map((annotation) => (
                <div
                  key={annotation.id}
                  className={cn(
                    "absolute border-2 cursor-pointer transition-all duration-200",
                    selectedAnnotation === annotation.id ? "ring-2 ring-brand-secondary" : "",
                    annotation.type === 'highlight' ? "bg-yellow-200/60 border-yellow-400" :
                    annotation.type === 'note' ? "bg-brand-secondary/20/60 border-brand-secondary" :
                    "bg-gray-200/60 border-gray-400"
                  )}
                  style={{
                    left: `${annotation.x}%`,
                    top: `${annotation.y}%`,
                    width: `${annotation.width || 100}px`,
                    height: `${annotation.height || 20}px`,
                    backgroundColor: annotation.backgroundColor || annotation.color + '40',
                    borderColor: annotation.color || '#6B7280'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedAnnotation(
                      selectedAnnotation === annotation.id ? null : annotation.id
                    )
                  }}
                  title={annotation.text}
                >
                  {annotation.type === 'note' && (
                    <div className="absolute -top-6 left-0 bg-white text-xs px-2 py-1 rounded shadow-lg border max-w-xs z-10">
                      {annotation.text}
                    </div>
                  )}
                  
                  {selectedAnnotation === annotation.id && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border p-3 min-w-64 z-20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{annotation.type === 'highlight' ? 'Kiemelés' : 'Jegyzet'}</h4>
                          <p className="text-xs text-gray-500">
                            {annotation.author} • {annotation.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editAnnotation(annotation)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteAnnotation(annotation.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm">{annotation.text}</p>
                      {annotation.tags && annotation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {annotation.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

            {/* Search result highlights */}
            {searchResults.length > 0 && searchResults
              .filter(result => result.page === currentPage)
              .map((result, index) => (
                <div
                  key={`search-${index}`}
                  className={cn(
                    "absolute bg-yellow-300/80 border border-yellow-500 pointer-events-none",
                    index === currentSearchIndex ? "bg-orange-300/80 border-orange-500" : ""
                  )}
                  style={{
                    left: `${result.position.x}%`,
                    top: `${result.position.y}%`,
                    width: '150px',
                    height: '20px'
                  }}
                />
              ))}
          </div>
        </div>

        {/* Sidebar for annotations and bookmarks */}
        {(showAnnotations || showBookmarks) && (
          <div className="w-80 border-l bg-gray-50">
            <div className="p-4">
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant={showAnnotations ? 'default' : 'outline'}
                  onClick={() => {
                    setShowAnnotations(true)
                    setShowBookmarks(false)
                  }}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Jegyzetek ({filteredAnnotations.length})
                </Button>
                <Button
                  size="sm"
                  variant={showBookmarks ? 'default' : 'outline'}
                  onClick={() => {
                    setShowBookmarks(true)
                    setShowAnnotations(false)
                  }}
                  className="flex-1"
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Könyvjelzők ({bookmarks.length})
                </Button>
              </div>

              {/* Annotations panel */}
              {showAnnotations && (
                <div className="space-y-3">
                  {/* Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        <Filter className="w-4 h-4 mr-2" />
                        {annotationFilter === 'all' ? 'Összes' :
                         annotationFilter === 'page' ? 'Ez az oldal' :
                         annotationFilter === 'highlight' ? 'Kiemelések' :
                         annotationFilter === 'note' ? 'Jegyzetek' : 'Szűrő'}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem onClick={() => setAnnotationFilter('all')}>
                        Összes jegyzet
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAnnotationFilter('page')}>
                        Aktuális oldal
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setAnnotationFilter('highlight')}>
                        <Highlighter className="w-4 h-4 mr-2" />
                        Kiemelések
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAnnotationFilter('note')}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Jegyzetek
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Annotations list */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredAnnotations.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">
                        Még nincsenek jegyzetek
                      </p>
                    ) : (
                      filteredAnnotations.map((annotation) => (
                        <div
                          key={annotation.id}
                          className="p-3 bg-white rounded border hover:shadow-sm cursor-pointer"
                          onClick={() => {
                            goToPage(annotation.page)
                            setSelectedAnnotation(annotation.id)
                          }}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {annotation.type === 'highlight' ? (
                                <Highlighter className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <MessageSquare className="w-4 h-4 text-brand-secondary" />
                              )}
                              <span className="text-xs text-gray-500">Oldal {annotation.page}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Settings className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => editAnnotation(annotation)}>
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Szerkesztés
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteAnnotation(annotation.id)}>
                                  <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                                  Törlés
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-sm line-clamp-3">{annotation.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {annotation.createdAt.toLocaleDateString()}
                            </span>
                            {annotation.tags && annotation.tags.length > 0 && (
                              <div className="flex gap-1">
                                {annotation.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Bookmarks panel */}
              {showBookmarks && (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {bookmarks.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">
                        Még nincsenek könyvjelzők
                      </p>
                    ) : (
                      bookmarks.map((bookmark) => (
                        <div
                          key={bookmark.id}
                          className="p-3 bg-white rounded border hover:shadow-sm cursor-pointer"
                          onClick={() => goToPage(bookmark.page)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: bookmark.color }}
                            />
                            <span className="font-medium text-sm">{bookmark.title}</span>
                            <span className="text-xs text-gray-500 ml-auto">
                              Oldal {bookmark.page}
                            </span>
                          </div>
                          {bookmark.description && (
                            <p className="text-xs text-gray-600">{bookmark.description}</p>
                          )}
                          <span className="text-xs text-gray-400">
                            {bookmark.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Annotation Dialog */}
      <Dialog open={showAnnotationDialog} onOpenChange={setShowAnnotationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAnnotation ? 'Jegyzet szerkesztése' : 'Új jegyzet'}
            </DialogTitle>
            <DialogDescription>
              Adjon hozzá megjegyzést vagy jegyzetet ehhez a PDF-hez.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Írja be a jegyzet szövegét..."
              value={newAnnotationText}
              onChange={(e) => setNewAnnotationText(e.target.value)}
              rows={4}
            />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Szín:</label>
                <input
                  type="color"
                  value={annotationColor}
                  onChange={(e) => setAnnotationColor(e.target.value)}
                  className="w-8 h-8 border rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnnotationDialog(false)}>
              Mégse
            </Button>
            <Button 
              onClick={() => {
                if (editingAnnotation) {
                  updateAnnotation({
                    ...editingAnnotation,
                    text: newAnnotationText,
                    color: annotationColor,
                    updatedAt: new Date()
                  })
                } else {
                  const container = document.querySelector('[data-pending-x]') as HTMLElement
                  if (container) {
                    const x = parseFloat(container.dataset.pendingX || '50')
                    const y = parseFloat(container.dataset.pendingY || '50')
                    addAnnotation(x, y)
                    delete container.dataset.pendingX
                    delete container.dataset.pendingY
                  }
                }
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Mentés
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}