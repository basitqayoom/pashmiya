'use client'

import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { useState, useRef, ChangeEvent } from 'react'

interface FileUploadProps {
  label?: string
  value?: string
  onChange: (url: string) => void
  hint?: string
  accept?: string
}

export default function FileUpload({ label, value, onChange, hint, accept = 'image/*' }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      onChange(url)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const removeImage = () => {
    setPreview(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            <span className="text-amber-600 font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
        </div>
      )}
      
      {hint && <p className="text-sm text-gray-500">{hint}</p>}
    </div>
  )
}
