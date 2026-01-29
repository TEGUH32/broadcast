'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Tag,
  User,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users
} from 'lucide-react'

interface Contact {
  id: string
  name: string
  phone: string
  email: string | null
  tags: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt?: string
}

interface FormData {
  name: string
  phone: string
  email: string
  tags: string
  notes: string
}

interface ApiResponse {
  contacts: Contact[]
  error?: string
  message?: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const { toast } = useToast()

  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController | null>(null)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    tags: '',
    notes: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Debug: Log environment variable
  useEffect(() => {
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('Window location origin:', typeof window !== 'undefined' ? window.location.origin : 'undefined')
  }, [])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validasi nama
    if (!formData.name.trim()) {
      errors.name = 'Nama harus diisi'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nama minimal 2 karakter'
    }

    // Validasi nomor telepon
    if (!formData.phone.trim()) {
      errors.phone = 'Nomor telepon harus diisi'
    } else {
      // Hapus semua karakter non-digit kecuali +
      const cleanPhone = formData.phone.replace(/[^\d+]/g, '')
      
      // Cek apakah diawali dengan 62 atau +62 atau 0
      if (!cleanPhone.match(/^(62|\+62|0)\d+$/)) {
        errors.phone = 'Format nomor telepon tidak valid. Gunakan format: 628xxx atau 08xxx'
      } else if (cleanPhone.replace(/^(\+62|62|0)/, '').length < 9) {
        errors.phone = 'Nomor telepon terlalu pendek'
      }
    }

    // Validasi email (opsional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format email tidak valid'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const fetchContacts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)

      // Batalkan request sebelumnya jika ada
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Buat controller baru
      abortControllerRef.current = new AbortController()
      const controller = abortControllerRef.current

      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      // Gunakan base URL yang benar
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : '')
      
      // Cek apakah baseUrl valid
      if (!baseUrl) {
        throw new Error('Base URL tidak ditemukan')
      }

      const url = `${baseUrl}/api/contacts${params.toString() ? `?${params.toString()}` : ''}`
      console.log('Fetching from URL:', url)

      const response = await fetch(url, {
        signal: signal || controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include' // Include cookies jika diperlukan
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        // Coba parse error message dari response
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // Jika response bukan JSON
          if (response.status === 404) {
            errorMessage = 'API endpoint tidak ditemukan. Periksa konfigurasi backend.'
          } else if (response.status === 500) {
            errorMessage = 'Server error. Silakan coba lagi nanti.'
          }
        }
        throw new Error(errorMessage)
      }

      const data: ApiResponse = await response.json()
      console.log('API Response data:', data)

      // Validasi data
      if (data && Array.isArray(data.contacts)) {
        const validContacts = data.contacts.filter((contact: any): contact is Contact => 
          contact && 
          typeof contact === 'object' &&
          typeof contact.id === 'string' &&
          typeof contact.name === 'string' &&
          typeof contact.phone === 'string'
        )
        setContacts(validContacts)
        console.log('Valid contacts loaded:', validContacts.length)
      } else if (data.error) {
        throw new Error(data.error)
      } else {
        console.warn('Invalid data structure from API:', data)
        setContacts([])
        toast({
          title: 'Info',
          description: 'Data kontak kosong atau format tidak sesuai',
          variant: 'default',
        })
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
        return
      }
      
      console.error('Error fetching contacts:', error)
      
      // Tentukan pesan error yang user-friendly
      let userMessage = 'Gagal memuat kontak. Silakan coba lagi.'
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        userMessage = 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.'
      } else if (error.message.includes('404')) {
        userMessage = 'Endpoint API tidak ditemukan. Hubungi administrator.'
      }
      
      setError(userMessage)
      setContacts([])
      
      toast({
        title: 'Error',
        description: userMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [searchQuery, statusFilter, toast])

  useEffect(() => {
    fetchContacts()

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [fetchContacts])

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!initialLoad) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchContacts()
      }, 500)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, statusFilter, fetchContacts, initialLoad])

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validasi Gagal',
        description: 'Harap periksa form yang diisi',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Format nomor telepon
      let formattedPhone = formData.phone.trim()
      // Hapus semua non-digit kecuali +
      formattedPhone = formattedPhone.replace(/[^\d+]/g, '')
      // Konversi ke format 62
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.substring(1)
      } else if (formattedPhone.startsWith('+62')) {
        formattedPhone = formattedPhone.substring(1)
      } else if (!formattedPhone.startsWith('62')) {
        formattedPhone = '62' + formattedPhone
      }

      const payload = {
        name: formData.name.trim(),
        phone: formattedPhone,
        email: formData.email.trim() || null,
        tags: formData.tags.trim() || null,
        notes: formData.notes.trim() || null
      }

      console.log('Saving payload:', payload)

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : '')
      
      if (!baseUrl) {
        throw new Error('Base URL tidak ditemukan')
      }

      const url = editingContact
        ? `${baseUrl}/api/contacts/${editingContact.id}`
        : `${baseUrl}/api/contacts`

      const method = editingContact ? 'PUT' : 'POST'
      console.log(`Sending ${method} request to:`, url)

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('Save response status:', response.status)

      const data = await response.json().catch(() => ({
        error: 'Gagal memparse response'
      }))

      console.log('Save response data:', data)

      if (response.ok) {
        toast({
          title: editingContact ? 'Kontak Diperbarui' : 'Kontak Ditambahkan',
          description: editingContact ? 'Kontak berhasil diperbarui' : 'Kontak baru berhasil ditambahkan',
        })
        
        handleDialogClose()
        fetchContacts()
      } else {
        throw new Error(data.error || data.message || `HTTP ${response.status}`)
      }
    } catch (error: any) {
      console.error('Save error:', error)
      const errorMessage = error.message || 'Terjadi kesalahan jaringan'
      setError(errorMessage)
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      setError(null)

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : '')
      
      if (!baseUrl) {
        throw new Error('Base URL tidak ditemukan')
      }

      console.log('Deleting contact:', id, 'from:', `${baseUrl}/api/contacts/${id}`)

      const response = await fetch(`${baseUrl}/api/contacts/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Delete response status:', response.status)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || data.message || `HTTP ${response.status}`)
      }

      toast({
        title: 'Kontak Dihapus',
        description: 'Kontak berhasil dihapus',
      })
      
      fetchContacts()
    } catch (error: any) {
      console.error('Delete error:', error)
      const errorMessage = error.message || 'Gagal menghapus kontak'
      setError(errorMessage)
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      tags: contact.tags || '',
      notes: contact.notes || ''
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleDialogClose()
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setTimeout(() => {
      setEditingContact(null)
      resetForm()
      setFormErrors({})
    }, 300)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      tags: '',
      notes: ''
    })
  }

  const filteredContacts = contacts.filter(contact => {
    if (!contact || typeof contact !== 'object') return false
    
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      contact.name?.toLowerCase().includes(query) ||
      contact.phone?.includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.tags?.toLowerCase().includes(query)

    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return ''
    // Format: 62-812-3456-7890
    const clean = phone.replace(/\D/g, '')
    if (clean.startsWith('62')) {
      return clean.replace(/(\d{2})(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3-$4')
    }
    return phone
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handleImport = () => {
    toast({
      title: 'Coming Soon',
      description: 'Fitur import akan segera tersedia',
    })
  }

  const handleExport = () => {
    toast({
      title: 'Coming Soon',
      description: 'Fitur export akan segera tersedia',
    })
  }

  const handleRetry = () => {
    fetchContacts()
  }

  // Test API endpoint
  const testApiEndpoint = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const response = await fetch(`${baseUrl}/api/contacts`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('API Test Response:', {
        status: response.status,
        ok: response.ok,
        url: `${baseUrl}/api/contacts`
      })
    } catch (error) {
      console.error('API Test Error:', error)
    }
  }

  // Coba test API saat komponen mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      testApiEndpoint()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Kelola Kontak
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kelola daftar kontak untuk broadcast
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleImport}
            disabled={loading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            disabled={loading || contacts.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <Button 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={() => setDialogOpen(true)}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kontak
            </Button>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? 'Edit Kontak' : 'Tambah Kontak Baru'}
                </DialogTitle>
                <DialogDescription>
                  {editingContact ? 'Edit informasi kontak' : 'Isi informasi kontak baru'}
                </DialogDescription>
              </DialogHeader>
              
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nama *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
                    }}
                    placeholder="John Doe"
                    disabled={saving}
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500">{formErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    No. WhatsApp *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' })
                    }}
                    placeholder="628123456789"
                    disabled={saving}
                    className={formErrors.phone ? 'border-red-500' : ''}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-red-500">{formErrors.phone}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Contoh: 628123456789 atau 08123456789
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (formErrors.email) setFormErrors({ ...formErrors, email: '' })
                    }}
                    placeholder="john@email.com"
                    disabled={saving}
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-500">{formErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags (pisahkan dengan koma)
                  </Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="vip, customer, lead"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan tambahan..."
                    rows={3}
                    disabled={saving}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={handleDialogClose}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  onClick={handleSave}
                  disabled={saving || !formData.name || !formData.phone}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : editingContact ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Kontak'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Debug Info - Hanya tampilkan di development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Debug Info:</strong> Base URL: {process.env.NEXT_PUBLIC_APP_URL || window.location.origin}
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={testApiEndpoint}
                className="mt-2"
              >
                Test API Endpoint
              </Button>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                console.log('Contacts:', contacts)
                console.log('Loading:', loading)
                console.log('Error:', error)
              }}
            >
              Log State
            </Button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Error:</span>
                <span className="ml-2">{error}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Lagi
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh Halaman
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari nama, nomor telepon, email, atau tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
                disabled={loading}
              >
                Semua
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('active')}
                size="sm"
                disabled={loading}
              >
                Aktif
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('inactive')}
                size="sm"
                disabled={loading}
              >
                Non-Aktif
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Kontak</CardTitle>
            <CardDescription>
              {loading ? 'Memuat...' : `${filteredContacts.length} kontak ditemukan`}
            </CardDescription>
          </div>
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          )}
        </CardHeader>
        <CardContent>
          {loading && initialLoad ? (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
              <p className="text-gray-500">Memuat kontak...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Tidak dapat memuat kontak
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleRetry}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
                <Button
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Kontak
                </Button>
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery || statusFilter !== 'all' ? 'Tidak ada kontak ditemukan' : 'Belum ada kontak'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Coba ubah pencarian atau filter'
                  : 'Mulai tambahkan kontak pertama Anda'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Kontak Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {contact.name}
                      </h4>
                      <Badge
                        variant={contact.status === 'active' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {contact.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span className="truncate">{formatPhoneNumber(contact.phone)}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.tags && (
                        <div className="flex items-center gap-2">
                          <Tag className="w-3 h-3 shrink-0" />
                          <div className="flex gap-1 flex-wrap">
                            {contact.tags.split(',').map((tag, index) => (
                              tag.trim() && (
                                <Badge 
                                  key={index} 
                                  variant="outline" 
                                  className="text-xs truncate max-w-[100px]"
                                >
                                  {tag.trim()}
                                </Badge>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                      {contact.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                          {contact.notes}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Ditambahkan: {formatDate(contact.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(contact)}
                      disabled={loading}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          disabled={loading || deletingId === contact.id}
                        >
                          {deletingId === contact.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Kontak?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus kontak <strong>{contact.name}</strong>?
                            <br />
                            <span className="text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deletingId === contact.id}>
                            Batal
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(contact.id)}
                            disabled={deletingId === contact.id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deletingId === contact.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Menghapus...
                              </>
                            ) : (
                              'Hapus'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
