'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth'
import {
  User,
  Mail,
  Phone,
  Building,
  Lock,
  Save,
  CheckCircle
} from 'lucide-react'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { setUser } = useAuthStore()

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    whatsappNumber: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        const user = data.user
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          companyName: user.companyName || '',
          whatsappNumber: user.whatsappNumber || ''
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat profil',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          companyName: profileData.companyName,
          whatsappNumber: profileData.whatsappNumber
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Profil Diperbarui!',
          description: 'Informasi profil Anda berhasil diperbarui',
        })
        setUser(data.user)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Gagal memperbarui profil',
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
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Password baru tidak cocok',
        variant: 'destructive',
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password baru minimal 6 karakter',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Password Berhasil Diubah!',
          description: 'Password Anda telah diperbarui',
        })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Gagal mengubah password',
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
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Memuat profil...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Profil Pengguna
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Kelola informasi profil dan keamanan akun Anda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>
              Foto profil Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600">
              <AvatarFallback className="text-4xl font-semibold text-white">
                {profileData.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {profileData.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {profileData.email}
              </p>
            </div>
            <Button variant="outline" className="w-full">
              Ganti Foto
            </Button>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Informasi Profil</TabsTrigger>
                <TabsTrigger value="security">Keamanan</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Informasi Pribadi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        <User className="w-4 h-4 inline mr-2" />
                        Nama Lengkap *
                      </Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-gray-100 dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500">
                        Email tidak dapat diubah
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <Phone className="w-4 h-4 inline mr-2" />
                        No. Telepon
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="628123456789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">
                        <Phone className="w-4 h-4 inline mr-2" />
                        No. WhatsApp Aktif
                      </Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={profileData.whatsappNumber}
                        onChange={(e) => setProfileData({ ...profileData, whatsappNumber: e.target.value })}
                        placeholder="628123456789"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="company">
                        <Building className="w-4 h-4 inline mr-2" />
                        Nama Perusahaan
                      </Label>
                      <Input
                        id="company"
                        value={profileData.companyName}
                        onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                        placeholder="PT. Example"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {saving ? 'Menyimpan...' : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Simpan Perubahan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Ubah Password
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Password Saat Ini *
                      </Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Password Baru *
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Minimal 6 karakter"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Konfirmasi Password Baru *
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Ulangi password baru"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {saving ? 'Memproses...' : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Ubah Password
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tips Keamanan
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Gunakan password minimal 6 karakter dengan kombinasi huruf dan angka</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Jangan berbagi password dengan orang lain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Ganti password secara berkala untuk keamanan lebih baik</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
