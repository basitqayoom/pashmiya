'use client'

import { X, Plus } from 'lucide-react'
import { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  label?: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  hint?: string
}

export default function TagInput({ label, value, onChange, placeholder = 'Add tag', hint }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInput('')
    }
  }

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 bg-white">
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-amber-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[100px] outline-none bg-transparent text-sm py-1"
          />
        </div>
      </div>
      {hint && <p className="text-sm text-gray-500">{hint}</p>}
    </div>
  )
}
