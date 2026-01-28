'use client'

import { useEffect, useState, useMemo } from 'react' // Tambah useMemo
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

  // Gunakan useMemo untuk memfilter kontak agar tidak error saat render
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [contacts, searchQuery])

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        // Tambahkan pengaman .filter jika data.contacts undefined
        const activeContacts = (data.contacts || []).filter((c: Contact) => c.status === 'active')
        setContacts(activeContacts)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

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
    if (selectedContacts.size === filteredContacts.length && filteredContacts.length > 0) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)))
    }
  }

  const handleSend = async () => {
    if (!broadcastData.title || !broadcastData.message) {
      toast({ title: 'Error', description: 'Judul dan pesan harus diisi', variant: 'destructive' })
      return
    }

    if (selectedContacts.size === 0) {
      toast({ title: 'Error', description: 'Pilih minimal satu kontak', variant: 'destructive' })
      return
    }

    try {
      setSending(true)
      const scheduledAt = scheduled ? new Date(`${scheduledDate}T${scheduledTime}`) : null

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

      if (response.ok) {
        toast({ title: 'Berhasil', description: 'Broadcast telah diproses' })
        setBroadcastData({ title: '', message: '' })
        setSelectedContacts(new Set())
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal mengirim', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Buat Broadcast</h1>
        <p className="text-gray-500">Kirim pesan WhatsApp ke banyak kontak</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detail Pesan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Broadcast</Label>
              <Input
                value={broadcastData.title}
                onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                placeholder="Contoh: Promo Ramadhan"
              />
            </div>
            <div className="space-y-2">
              <Label>Pesan</Label>
              <Textarea
                value={broadcastData.message}
                onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                placeholder="Halo {name}..."
                rows={5}
              />
            </div>
            
            <div className="flex items-center space-x-2 py-2">
              <Checkbox id="sch" checked={scheduled} onCheckedChange={(s) => setScheduled(!!s)} />
              <Label htmlFor="sch">Jadwalkan</Label>
            </div>

            {scheduled && (
               <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                  <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
               </div>
            )}

            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? 'Mengirim...' : 'Kirim Sekarang'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pilih Kontak</CardTitle>
              <Button size="sm" variant="outline" onClick={toggleAll}>All</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari..." 
                className="pl-8" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-auto">
              {loading ? <p>Loading...</p> : filteredContacts.map(contact => (
                <div 
                  key={contact.id} 
                  className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer"
                  onClick={() => toggleContact(contact.id)}
                >
                  <Checkbox checked={selectedContacts.has(contact.id)} />
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
