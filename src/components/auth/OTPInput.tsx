'use client'

import { useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'

interface OTPInputProps {
  length?: number // Number of digits (default 4)
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
  autoFocus?: boolean
}

export function OTPInput({
  length = 4,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = true
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(0)

  // Ensure value is padded to the correct length
  const paddedValue = value.padEnd(length, '')

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus()
      setActiveIndex(index)
    }
  }

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.slice(-1) // Take only the last character

    if (!/^\d*$/.test(digit)) {
      return // Only allow digits
    }

    // Update the value
    const newValue = paddedValue.split('')
    newValue[index] = digit
    const finalValue = newValue.join('').replace(/\s/g, '')
    onChange(finalValue)

    // Auto-focus next input if a digit was entered
    if (digit && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace: clear current or move to previous
    if (e.key === 'Backspace') {
      e.preventDefault()

      if (paddedValue[index]) {
        // Clear current digit
        const newValue = paddedValue.split('')
        newValue[index] = ''
        onChange(newValue.join('').replace(/\s/g, ''))
      } else if (index > 0) {
        // Move to previous and clear it
        focusInput(index - 1)
        const newValue = paddedValue.split('')
        newValue[index - 1] = ''
        onChange(newValue.join('').replace(/\s/g, ''))
      }
    }
    // Arrow keys navigation
    else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusInput(index - 1)
    }
    else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      focusInput(index + 1)
    }
    // Home/End keys
    else if (e.key === 'Home') {
      e.preventDefault()
      focusInput(0)
    }
    else if (e.key === 'End') {
      e.preventDefault()
      focusInput(length - 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    const pastedData = e.clipboardData.getData('text/plain')
    const digits = pastedData.replace(/\D/g, '').slice(0, length)

    if (digits.length > 0) {
      onChange(digits)
      // Focus the next empty input or the last input
      const nextIndex = Math.min(digits.length, length - 1)
      focusInput(nextIndex)
    }
  }

  const handleFocus = (index: number) => {
    setActiveIndex(index)
    // Select the content when focused
    inputRefs.current[index]?.select()
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={paddedValue[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          className={`
            w-14 h-14 text-center text-2xl font-bold rounded-lg
            transition-all duration-200
            ${error
              ? 'border-2 border-red-500 text-red-600 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-2 border-gray-200 text-gray-900 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-gray-300'}
            ${activeIndex === index && !error && !disabled ? 'shadow-lg scale-105' : ''}
            outline-none
          `}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
