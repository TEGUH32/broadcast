'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import {
  LayoutDashboard,
  Contact,
  Send,
  History,
  Settings,
  LogOut,
  Menu,
  MessageSquare,
  User
} from 'lucide-react'

function NavLinks({
  navItems,
  pathname,
  setMobileMenuOpen,
}: {
  navItems: any[]
  pathname: string
  setMobileMenuOpen: (open: boolean) => void
}) {
  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.title}</span>
          </Link>
        )
      })}
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/')
        } else {
          setMounted(true)
        }
      } catch (error) {
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logout()
      toast({
        title: 'Logout Berhasil',
        description: 'Anda telah keluar dari sistem',
      })
      router.push('/')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal logout',
        variant: 'destructive',
      })
    }
  }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Kontak',
      href: '/dashboard/contacts',
      icon: Contacts,
    },
    {
      title: 'Buat Broadcast',
      href: '/dashboard/broadcast',
      icon: Send,
    },
    {
      title: 'Riwayat',
      href: '/dashboard/history',
      icon: History,
    },
    {
      title: 'Profil',
      href: '/dashboard/profile',
      icon: User,
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">WA Blast</h2>
                    <p className="text-xs text-gray-500">Broadcast System</p>
                  </div>
                </div>
                <nav className="space-y-2">
                  <NavLinks
                    navItems={navItems}
                    pathname={pathname}
                    setMobileMenuOpen={setMobileMenuOpen}
                  />
                </nav>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-xl text-gray-900 dark:text-white">
                  WA Blast Broadcast
                </h1>
                <p className="text-xs text-gray-500">Platform Broadcast WhatsApp</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span>Pengaturan Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className="hidden md:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-64px)] p-4 sticky top-16 self-start">
          <nav className="space-y-2">
            <NavLinks
              navItems={navItems}
              pathname={pathname}
              setMobileMenuOpen={setMobileMenuOpen}
            />
          </nav>

          <div className="mt-8 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
              Status Akun
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-700 dark:text-green-400">Aktif</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Siap mengirim broadcast
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
