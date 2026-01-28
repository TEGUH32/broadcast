'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MessageSquare,
  Users,
  Send,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

interface DashboardStats {
  totalContacts: number
  totalBroadcasts: number
  sentMessages: number
  pendingMessages: number
  successRate: number
  recentBroadcasts: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Selamat datang kembali, {user?.name}!
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Selamat datang kembali, {user?.name}!
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Link href="/dashboard/broadcast">
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2">
              <Send className="w-4 h-4" />
              Buat Broadcast
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Contacts */}
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Kontak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalContacts || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    kontak terdaftar
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Broadcasts */}
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalBroadcasts || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    broadcast dikirim
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sent Messages */}
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pesan Terkirim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.sentMessages || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    berhasil dikirim
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tingkat Keberhasilan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.successRate || 0}%
                  </p>
                  <p className="text-xs text-gray-500">
                    rata-rata keberhasilan
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Broadcasts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Broadcast Terbaru</CardTitle>
            <CardDescription>
              Riwayat broadcast yang baru saja dikirim
            </CardDescription>
          </div>
          <Link href="/dashboard/history">
            <Button variant="outline" size="sm" className="gap-2">
              Lihat Semua
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentBroadcasts && stats.recentBroadcasts.length > 0 ? (
            <div className="space-y-4">
              {stats.recentBroadcasts.map((broadcast: any) => (
                <div
                  key={broadcast.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      broadcast.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                      broadcast.status === 'sending' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      broadcast.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-gray-100 dark:bg-gray-900/30'
                    }`}>
                      {broadcast.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : broadcast.status === 'sending' ? (
                        <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : broadcast.status === 'failed' ? (
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {broadcast.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(broadcast.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {broadcast.sentCount}/{broadcast.totalContacts}
                      </p>
                      <p className="text-xs text-gray-500">
                        terkirim
                      </p>
                    </div>
                    <Badge
                      variant={broadcast.status === 'completed' ? 'default' :
                              broadcast.status === 'sending' ? 'secondary' :
                              broadcast.status === 'failed' ? 'destructive' : 'outline'}
                    >
                      {broadcast.status === 'completed' ? 'Selesai' :
                       broadcast.status === 'sending' ? 'Mengirim' :
                       broadcast.status === 'failed' ? 'Gagal' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Belum ada broadcast
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Mulai buat broadcast pertama Anda
              </p>
              <Link href="/dashboard/broadcast">
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Send className="w-4 h-4 mr-2" />
                  Buat Broadcast
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
