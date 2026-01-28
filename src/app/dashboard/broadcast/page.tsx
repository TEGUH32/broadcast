'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  Send,
  Clock,
  MessageSquare,
  Search,
  AlertCircle
} from 'lucide-react'

interface Contact {
  id: string
  name: string
  phone: string
  email: string | null
  status: string
}

export default function BroadcastPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: ''
  })

  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Gunakan absolute URL untuk menghindari path error
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const response = await fetch(`${baseUrl}/api/contacts`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Validasi data yang diterima
      if (data && Array.isArray(data.contacts)) {
        const activeContacts = data.contacts.filter((c: Contact) => 
          c && c.status === 'active' && c.id && c.name
        )
        setContacts(activeContacts)
      } else {
        setContacts([])
        console.warn('Invalid contacts data structure:', data)
      }
      
    } catch (error: any) {
      console.error('Error fetching contacts:', error)
      setError('Gagal memuat kontak. Silakan coba lagi.')
      setContacts([])
      
      toast({
        title: 'Error',
        description: 'Gagal memuat kontak',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Gunakan useMemo untuk menghindari perhitungan ulang yang tidak perlu
  const filteredContacts = contacts.filter(contact => {
    if (!contact || typeof contact !== 'object') return false
    
    const query = searchQuery.toLowerCase()
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.phone?.includes(query) ||
      contact.email?.toLowerCase().includes(query)
    )
  })

  const toggleContact = (contactId: string) => {
    if (!contactId) return
    
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContacts(newSelected)
  }

  const toggleAll = () => {
    if (!filteredContacts.length) return
    
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set())
    } else {
      // Hanya pilih kontak yang valid
      const validIds = filteredContacts
        .filter(c => c && c.id)
        .map(c => c.id)
      setSelectedContacts(new Set(validIds))
    }
  }

  const handleSend = async () => {
    // Validasi input
    if (!broadcastData.title?.trim() || !broadcastData.message?.trim()) {
      toast({
        title: 'Error',
        description: 'Judul dan pesan broadcast harus diisi',
        variant: 'destructive',
      })
      return
    }

    if (selectedContacts.size === 0) {
      toast({
        title: 'Error',
        description: 'Pilih minimal satu kontak',
        variant: 'destructive',
      })
      return
    }

    if (scheduled) {
      const today = new Date()
      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      
      if (!scheduledDate || !scheduledTime) {
        toast({
          title: 'Error',
          description: 'Tanggal dan waktu harus diisi untuk jadwal broadcast',
          variant: 'destructive',
        })
        return
      }
      
      if (selectedDateTime < today) {
        toast({
          title: 'Error',
          description: 'Waktu jadwal tidak boleh di masa lalu',
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setSending(true)
      setError(null)

      const scheduledAt = scheduled
        ? new Date(`${scheduledDate}T${scheduledTime}`)
        : null

      // Validasi contactIds
      const contactIds = Array.from(selectedContacts).filter(id => id)
      
      const payload = {
        title: broadcastData.title.trim(),
        message: broadcastData.message.trim(),
        contactIds,
        scheduledAt: scheduledAt?.toISOString()
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const response = await fetch(`${baseUrl}/api/broadcasts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok && data.broadcast) {
        if (!scheduled) {
          // Kirim segera jika tidak dijadwalkan
          try {
            const sendResponse = await fetch(`${baseUrl}/api/broadcasts/${data.broadcast.id}/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            })

            const sendData = await sendResponse.json()

            if (sendResponse.ok) {
              toast({
                title: 'Broadcast Berhasil!',
                description: sendData.message || 'Broadcast berhasil dikirim',
              })
            } else {
              toast({
                title: 'Warning',
                description: sendData.error || 'Broadcast dibuat tapi gagal dikirim',
                variant: 'destructive',
              })
            }
          } catch (sendError) {
            console.error('Error sending broadcast:', sendError)
            toast({
              title: 'Warning',
              description: 'Broadcast dibuat tapi ada masalah saat pengiriman',
              variant: 'destructive',
            })
          }
        } else {
          toast({
            title: 'Broadcast Dijadwalkan!',
            description: `Broadcast akan dikirim pada ${scheduledAt?.toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} pukul ${scheduledTime}`,
          })
        }

        // Reset form
        setBroadcastData({ title: '', message: '' })
        setSelectedContacts(new Set())
        setScheduled(false)
        setScheduledDate('')
        setScheduledTime('')
      } else {
        throw new Error(data.error || 'Gagal membuat broadcast')
      }
    } catch (error: any) {
      console.error('Broadcast error:', error)
      setError(error.message || 'Terjadi kesalahan')
      
      toast({
        title: 'Error',
        description: error.message || 'Terjadi kesalahan jaringan',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  // Set default waktu untuk jadwal (minimal 5 menit dari sekarang)
  useEffect(() => {
    if (scheduled && !scheduledDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setScheduledDate(tomorrow.toISOString().split('T')[0])
      
      // Set waktu default ke jam 9 pagi
      if (!scheduledTime) {
        setScheduledTime('09:00')
      }
    }
  }, [scheduled, scheduledDate, scheduledTime])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Buat Broadcast
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Buat dan kirim pesan broadcast WhatsApp ke banyak kontak sekaligus
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Broadcast</CardTitle>
            <CardDescription>
              Informasi dan pesan broadcast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Judul Broadcast *
              </Label>
              <Input
                id="title"
                value={broadcastData.title}
                onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                placeholder="Promo Spesial Hari Ini"
                maxLength={100}
                disabled={sending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Pesan Broadcast *
              </Label>
              <Textarea
                id="message"
                value={broadcastData.message}
                onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                placeholder="Halo {name}, kami punya promo spesial untuk Anda..."
                rows={6}
                maxLength={1000}
                disabled={sending}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Gunakan {"{name}"} untuk menyebut nama penerima</span>
                <span>{broadcastData.message.length}/1000</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="scheduled"
                  checked={scheduled}
                  onCheckedChange={(checked) => setScheduled(checked as boolean)}
                  disabled={sending}
                />
                <Label htmlFor="scheduled" className="flex items-center gap-2 cursor-pointer">
                  <Clock className="w-4 h-4" />
                  Jadwalkan Broadcast
                </Label>
              </div>

              {scheduled && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={sending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Jam</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      disabled={sending}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSend}
              disabled={sending}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <span className="animate-pulse">Memproses...</span>
                </>
              ) : scheduled ? (
                'Jadwalkan Broadcast'
              ) : (
                'Kirim Sekarang'
              )}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Select Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pilih Penerima</CardTitle>
                <CardDescription>
                  {selectedContacts.size} dari {filteredContacts.length} kontak dipilih
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleAll}
                disabled={loading || !filteredContacts.length || sending}
              >
                {selectedContacts.size === filteredContacts.length ? 'Batal Semua' : 'Pilih Semua'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari kontak..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={loading || sending}
                />
              </div>

              {loading ? (
                <div className="text-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-500">Memuat kontak...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">{error}</p>
                  <Button 
                    variant="outline" 
                    onClick={fetchContacts}
                    className="mt-4"
                  >
                    Coba Lagi
                  </Button>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchQuery ? 'Kontak tidak ditemukan' : 'Tidak ada kontak aktif'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ? 'Coba dengan kata kunci lain' : 'Belum ada kontak aktif untuk dipilih'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => !sending && toggleContact(contact.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedContacts.has(contact.id)
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Checkbox
                        checked={selectedContacts.has(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        disabled={sending}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {contact.name}
                          </h4>
                          {selectedContacts.has(contact.id) && (
                            <Badge className="bg-green-600 text-xs">Dipilih</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {contact.phone}
                        </p>
                        {contact.email && (
                          <p className="text-xs text-gray-500 truncate">
                            {contact.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
