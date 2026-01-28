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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Send,
  Clock,
  MessageSquare,
  CheckSquare,
  Square,
  Search
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
      const response = await fetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts.filter((c: Contact) => c.status === 'active'))
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat kontak',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContacts(newSelected)
  }

  const toggleAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)))
    }
  }

  const handleSend = async () => {
    if (!broadcastData.title || !broadcastData.message) {
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

    if (scheduled && (!scheduledDate || !scheduledTime)) {
      toast({
        title: 'Error',
        description: 'Tanggal dan waktu harus diisi untuk jadwal broadcast',
        variant: 'destructive',
      })
      return
    }

    try {
      setSending(true)

      const scheduledAt = scheduled
        ? new Date(`${scheduledDate}T${scheduledTime}`)
        : null

      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastData.title,
          message: broadcastData.message,
          contactIds: Array.from(selectedContacts),
          scheduledAt: scheduledAt?.toISOString()
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Send broadcast immediately if not scheduled
        if (!scheduled) {
          const sendResponse = await fetch(`/api/broadcasts/${data.broadcast.id}/send`, {
            method: 'POST'
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
              description: 'Broadcast dibuat tapi gagal dikirim',
              variant: 'destructive',
            })
          }
        } else {
          toast({
            title: 'Broadcast Dijadwalkan!',
            description: `Broadcast akan dikirim pada ${scheduledAt?.toLocaleDateString('id-ID')} pukul ${scheduledTime}`,
          })
        }

        // Reset form
        setBroadcastData({ title: '', message: '' })
        setSelectedContacts(new Set())
        setScheduled(false)
        setScheduledDate('')
        setScheduledTime('')
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Gagal membuat broadcast',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan jaringan',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

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
              />
              <p className="text-xs text-gray-500">
                Gunakan {{name}} untuk menyebut nama penerima
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="scheduled"
                  checked={scheduled}
                  onCheckedChange={(checked) => setScheduled(checked as boolean)}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Jam</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSend}
              disabled={sending}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {sending ? 'Memproses...' : scheduled ? 'Jadwalkan Broadcast' : 'Kirim Sekarang'}
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
                  {selectedContacts.size} kontak dipilih
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={toggleAll}>
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
                />
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  Memuat kontak...
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Tidak ada kontak
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Belum ada kontak aktif untuk dipilih
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => toggleContact(contact.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedContacts.has(contact.id)
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Checkbox
                        checked={selectedContacts.has(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {contact.name}
                          </h4>
                          {selectedContacts.has(contact.id) && (
                            <Badge className="bg-green-600">Dipilih</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {contact.phone}
                        </p>
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
