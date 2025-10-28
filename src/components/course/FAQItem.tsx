import React, { useState } from 'react'

interface Props {
  q: string
  a: string
}

export const FAQItem: React.FC<Props> = ({ q, a }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b">
      <button
        className="w-full flex justify-between items-center py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium">{q}</span>
        <span className="ml-2">{open ? '-' : '+'}</span>
      </button>
      {open && <p className="pb-4 text-muted text-sm">{a}</p>}
    </div>
  )
} 