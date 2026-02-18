'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon, Search, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const API_URL = 'http://localhost:8080/api'

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"

interface Product {
  id: number
  name: string
  price: number
  description: string
  image: string
  category_id: number
  category?: { id: number; name: string }
  colors: string[]
  sizes: string[]
  stock: number
  is_featured: boolean
  is_active: boolean
}

interface Catalogue {
  id: number
  name: string
  description: string
  image: string
  status: boolean
  sort_order: number
  products: Product[]
}

export default function Catalogues() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    status: true,
    sort_order: 0,
  })

  useEffect(() => {
    fetchCatalogues()
  }, [])

  const fetchCatalogues = async () => {
    try {
      const res = await fetch(`${API_URL}/catalogues`)
      const data = await res.json()
      setCatalogues(data)
    } catch (err) {
      console.error('Error fetching:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }

    setSaving(true)

    try {
      const url = editingId 
        ? `${API_URL}/catalogues/${editingId}`
        : `${API_URL}/catalogues`
      
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        closeModal()
        fetchCatalogues()
      } else {
        const data = await res.json()
        alert('Error: ' + (data.error || 'Failed to save'))
      }
    } catch (err) {
      console.error('Error saving:', err)
      alert('Error saving catalogue')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (catalogue: Catalogue) => {
    setEditingId(catalogue.id)
    setFormData({
      name: catalogue.name,
      description: catalogue.description || '',
      image: catalogue.image || '',
      status: catalogue.status,
      sort_order: catalogue.sort_order,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this catalogue?')) return
    
    try {
      await fetch(`${API_URL}/catalogues/${id}`, { method: 'DELETE' })
      fetchCatalogues()
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const handleToggleStatus = async (catalogue: Catalogue) => {
    try {
      await fetch(`${API_URL}/catalogues/${catalogue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !catalogue.status }),
      })
      fetchCatalogues()
    } catch (err) {
      console.error('Error toggling:', err)
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      image: '',
      status: true,
      sort_order: 0,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      image: '',
      status: true,
      sort_order: 0,
    })
  }

  const filteredCatalogues = catalogues.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogues</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product collections</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          Add Catalogue
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search catalogues..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredCatalogues.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No catalogues found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Description</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Products</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Sort Order</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCatalogues.map((catalogue) => (
                  <tr key={catalogue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {catalogue.image ? (
                            <img 
                              src={catalogue.image} 
                              alt={catalogue.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                              }}
                            />
                          ) : (
                            <img 
                              src={PLACEHOLDER_IMAGE} 
                              alt="No image" 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{catalogue.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 max-w-xs truncate block">
                        {catalogue.description || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{catalogue.products?.length || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{catalogue.sort_order}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(catalogue)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          catalogue.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {catalogue.status ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {catalogue.status ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(catalogue)}
                          className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(catalogue.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Edit Catalogue' : 'Add New Catalogue'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={e => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="status"
                checked={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.checked })}
                className="rounded border-gray-300 text-amber-600"
              />
              <label htmlFor="status" className="text-sm text-gray-700">Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
