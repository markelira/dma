import React, { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useCourseList } from '@/hooks/useCourseQueries'
import { Category } from '@/types'
import { University } from '@/types'

interface Suggestion {
  label: string
  type: 'category' | 'university' | 'course'
  value: string
}

interface Props {
  value: string
  onChange: (val: string) => void
  categories: Category[]
  universities: University[]
  onSelectSuggestion: (s: Suggestion) => void
}

export const SearchAutocomplete: React.FC<Props> = ({ value, onChange, categories, universities, onSelectSuggestion }) => {
  const [focused, setFocused] = useState(false)
  const debounced = useDebounce(value, 300)
  const { data } = useCourseList({ limit: 5, offset: 0, search: debounced, status: 'PUBLISHED' })
  const courses = data?.courses || []

  const suggestions: Suggestion[] = []
  if (debounced.trim().length > 0) {
    // match categories
    categories.forEach(c => {
      if (c.name.toLowerCase().includes(debounced.toLowerCase())) {
        suggestions.push({ label: c.name, type: 'category', value: c.id })
      }
    })
    // match universities
    universities.forEach(u => {
      if (u.name.toLowerCase().includes(debounced.toLowerCase())) {
        suggestions.push({ label: u.name, type: 'university', value: u.id })
      }
    })
    // courses
    courses.forEach(cs => {
      suggestions.push({ label: cs.title, type: 'course', value: cs.slug || cs.id })
    })
  }

  // handle click outside to close list
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full sm:w-80">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-transform ${focused ? 'text-primary scale-110' : 'text-gray-400'}`} />
      <input
        type="text"
        value={value}
        placeholder="Keresés tartalmak között..."
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          e.preventDefault()
          onChange(e.target.value)
        }}
        className={`w-full pl-10 pr-4 py-2 rounded-lg shadow-sm focus:outline-none border transition-all ${focused ? 'border-primary ring-2 ring-primary/50' : 'border-gray-300'}`}
      />
      {focused && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto animate-fade-in">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSelectSuggestion(s)
                setFocused(false)
              }}
              className="px-4 py-2 cursor-pointer hover:bg-primary/10 flex justify-between text-sm"
            >
              <span>{s.label}</span>
              <span className="text-gray-400">{s.type === 'category' ? 'Kategória' : s.type === 'university' ? 'Egyetem' : 'Tartalom'}</span>
            </li>
          ))}
        </ul>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </div>
  )
} 