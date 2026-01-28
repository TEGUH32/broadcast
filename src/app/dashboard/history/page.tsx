'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Eye,
  Trash2,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react'

interface Broadcast {
  id: string
  title: string
  message: string
  status: string
  totalContacts: number
  sentCount: number
  failedCount: number
  pendingCount: number
  scheduledAt: string | null
  sentAt: string | null
  completedAt: string | null
  createdAt: string
}

interface BroadcastDetail extends Broadcast {
  recipients: Array<{
    status: string
    contact: {
      name: string
      phone: string
      email: string | null
    }
  }>
}

export default function HistoryPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchBroadcasts()
  }, [])

  const fetchBroadcasts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/broadcasts')
      if (response.ok) {
        const data = await response.json()
        setBroadcasts(data.broadcasts)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat broadcast',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBroadcastDetail = async (id: string) => {
    try {
      setDetailLoading(true)
      const response = await fetch(`/api/broadcasts/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedBroadcast(data.broadcast)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat detail broadcast',
        variant: 'destructive',
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/broadcasts/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Broadcast Dihapus',
          description: 'Riwayat broadcast berhasil dihapus',
        })
        fetchBroadcasts()
      } else {
        toast({
          title: 'Error',
          description: 'Gagal menghapus broadcast',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan jaringan',
        variant: 'destructive',
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'sending':
        return <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'scheduled':
        return <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Selesai</Badge>
      case 'sending':
        return <Badge className="bg-blue-600">Mengirim</Badge>
      case 'failed':
        return <Badge variant="destructive">Gagal</Badge>
      case 'scheduled':
        return <Badge className="bg-purple-600">Dijadwalkan</Badge>
      default:
        return <Badge variant="outline">Draft</Badge>
    }
  }

  // Calculate analytics
  const totalBroadcasts = broadcasts.length
  const completedBroadcasts = broadcasts.filter(b => b.status === 'completed').length
  const totalSentMessages = broadcasts.reduce((sum, b) => sum + b.sentCount, 0)
  const totalFailedMessages = broadcasts.reduce((sum, b) => sum + b.failedCount, 0)
  const successRate = totalSentMessages + totalFailedMessages > 0
    ? Math.round((totalSentMessages / (totalSentMessages + totalFailedMessages)) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Riwayat Broadcast
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Pantau dan analisa semua broadcast yang telah Anda kirim
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Total Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalBroadcasts}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {completedBroadcasts} selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Pesan Terkirim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {totalSentMessages}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              berhasil dikirim
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Pesan Gagal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {totalFailedMessages}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              gagal dikirim
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Tingkat Keberhasilan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {successRate}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              rata-rata keberhasilan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast History List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Broadcast</CardTitle>
          <CardDescription>
            Riwayat semua broadcast yang telah dikirim
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Memuat riwayat broadcast...
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Belum ada broadcast
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Mulai buat broadcast pertama Anda
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {broadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-white dark:bg-gray-900">
                        {getStatusIcon(broadcast.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {broadcast.title}
                          </h4>
                          {getStatusBadge(broadcast.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {broadcast.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{broadcast.totalContacts} kontak</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>{broadcast.sentCount} terkirim</span>
                          </div>
                          {broadcast.failedCount > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              <span>{broadcast.failedCount} gagal</span>
                            </div>
                          )}
                          <span>
                            {new Date(broadcast.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detail Broadcast</DialogTitle>
                            <DialogDescription>
                              Informasi lengkap dan status pengiriman
                            </DialogDescription>
                          </DialogHeader>
                          {detailLoading && !selectedBroadcast ? (
                            <div className="text-center py-12 text-gray-500">
                              Memuat detail...
                            </div>
                          ) : selectedBroadcast ? (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">{selectedBroadcast.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {selectedBroadcast.message}
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-blue-600">
                                    {selectedBroadcast.totalContacts}
                                  </p>
                                  <p className="text-xs text-gray-500">Total</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-green-600">
                                    {selectedBroadcast.sentCount}
                                  </p>
                                  <p className="text-xs text-gray-500">Terkirim</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-red-600">
                                    {selectedBroadcast.failedCount}
                                  </p>
                                  <p className="text-xs text-gray-500">Gagal</p>
                                </div>
                              </div>

                              <div>
                                <h5 className="font-semibold mb-3">Status Pengiriman</h5>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                  {selectedBroadcast.recipients.map((recipient, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {recipient.contact.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          {recipient.contact.phone}
                                        </p>
                                      </div>
                                      {recipient.status === 'sent' || recipient.status === 'delivered' || recipient.status === 'read' ? (
                                        <Badge className="bg-green-600">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Terkirim
                                        </Badge>
                                      ) : recipient.status === 'failed' ? (
                                        <Badge variant="destructive">
                                          <AlertCircle className="w-3 h-3 mr-1" />
                                          Gagal
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline">
                                          <Clock className="w-3 h-3 mr-1" />
                                          Pending
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Button onClick={() => fetchBroadcastDetail(broadcast.id)}>
                              Muat Detail
                            </Button>
                          )}
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Riwayat Broadcast?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus riwayat broadcast "{broadcast.title}"? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(broadcast.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
