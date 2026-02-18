'use client'

import { useState, useEffect } from 'react'

interface Option {
  value: string | number
  label: string
}

interface FormSelectProps {
  label?: string
  value: string | number
  onChange: (value: string | number) => void
  options: Option[]
  placeholder?: string
  hint?: string
  error?: string
  required?: boolean
}

export default function FormSelect({ 
  label, value, onChange, options, placeholder, hint, error, required 
}: FormSelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-lg px-4 py-2.5 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
    </div>
  )
}
