'use client'

import { useRef, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface RichTextProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  hint?: string
  rows?: number
}

export default function RichText({ label, value, onChange, placeholder, error, hint, rows = 4 }: RichTextProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
          
          <div className="w-px h-5 bg-gray-300 mx-1" />
          
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          
          <div className="w-px h-5 bg-gray-300 mx-1" />
          
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          
          <div className="w-px h-5 bg-gray-300 mx-1" />
          
          <button
            type="button"
            onClick={handleLink}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>
        
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="w-full min-h-[100px] p-3 focus:outline-none prose prose-sm max-w-none"
          style={{ minHeight: `${rows * 24}px` }}
          dangerouslySetInnerHTML={{ __html: value }}
          data-placeholder={placeholder}
        />
      </div>
      
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
