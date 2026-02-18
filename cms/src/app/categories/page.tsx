'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, Check, ToggleLeft, ToggleRight } from 'lucide-react'

const API_URL = 'http://localhost:8080/api'

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"

interface Category {
  id: number
  name: string
  slug: string
  description: string
  image: string
  is_active: boolean
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    is_active: true,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`)
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error('Error loading:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }

    setSaving(true)
    try {
      const url = editMode && editingCategory 
        ? `${API_URL}/categories/${editingCategory.id}`
        : `${API_URL}/categories`
      
      const method = editMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description,
          image: formData.image,
          is_active: formData.is_active,
        }),
      })

      if (res.ok) {
        resetForm()
        loadCategories()
      } else {
        const data = await res.json()
        alert('Error: ' + (data.error || 'Failed to save'))
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Error saving')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug || '',
      description: category.description || '',
      image: category.image || '',
      is_active: category.is_active !== false,
    })
    setEditMode(true)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return
    
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id))
      } else {
        alert('Error: ' + (data.error || 'Failed to delete'))
        loadCategories()
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Error deleting category')
      loadCategories()
    }
  }

  const handleToggle = async (category: Category) => {
    const newValue = !category.is_active
    setCategories(prev => prev.map(c => 
      c.id === category.id ? { ...c, is_active: newValue } : c
    ))
    try {
      await fetch(`${API_URL}/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newValue }),
      })
    } catch (err) {
      console.error('Error toggling:', err)
      setCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, is_active: !newValue } : c
      ))
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditMode(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      is_active: true,
    })
  }

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product categories</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No categories found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md">
              <div className="h-32 bg-gray-100 relative">
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                  />
                ) : (
                  <img src={PLACEHOLDER_IMAGE} alt="No" className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => handleToggle(category)}
                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      category.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {category.is_active !== false ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-400">/{category.slug}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {category.description || 'No description'}
                </p>
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={resetForm}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editMode ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {formData.image && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE }} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-amber-600"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
