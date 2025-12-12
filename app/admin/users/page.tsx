'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'

// Helper function to safely format dates
const formatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return format(date, formatStr)
  } catch {
    return 'Invalid date'
  }
}
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserX,
  UserCheck,
  Mail,
  Calendar,
  Shield,
  AlertTriangle,
  Download,
  Eye,
  Edit
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useTranslation } from '@/lib/use-translation'

interface User {
  id: string
  email: string
  role: string
  state: string
  customer_profiles?: {
    full_name?: string
    phone?: string
    country?: string
  } | {
    full_name?: string
    phone?: string
    country?: string
  }[] | null
  reservations?: {
    id: string
    total: number
    status: string
  }[]
}

export default function AdminUsersPage() {
  const { t } = useTranslation('admin')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const supabase = createClientComponentClient()

  // Helper function to get customer profile data (handles both object and array formats)
  const getProfile = (user: User) => {
    if (!user.customer_profiles) return null
    if (Array.isArray(user.customer_profiles)) {
      return user.customer_profiles[0] || null
    }
    return user.customer_profiles
  }
  
  useEffect(() => {
    console.log('🔧 Component mounted - fetching users with bookings')
    fetchUsers()
  }, [])
  
  const fetchUsers = async () => {
    setLoading(true)
    try {
      console.log('🔍 Fetching users via API...')
      const response = await fetch(`/api/admin/users?t=${Date.now()}`)
      const result = await response.json()
      
      console.log('📊 API response:', result)
      
      if (!response.ok) {
        console.error('❌ API error:', result)
        alert(`${t('users.alerts.apiError')} ${result.error || 'Unknown error'}`)
        return
      }
      
      console.log('✅ Users fetched successfully:', result.users?.length || 0, 'users')
      setUsers(result.users || [])
    } catch (error) {
      console.error('❌ Fetch error:', error)
      alert(`${t('users.alerts.fetchError')} ${error}`)
    } finally {
      setLoading(false)
    }
  }
  
  const toggleUserBlock = async (userId: string, currentState: string) => {
    const newState = currentState === 'blocked' ? 'active' : 'blocked'
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, state: newState })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('Error updating user:', result)
        alert(`Error: ${result.error || 'Unknown error'}`)
        return
      }
      
      fetchUsers()
      alert(currentState === 'blocked' ? t('users.alerts.userUnblocked') : t('users.alerts.userBlocked'))
    } catch (error) {
      console.error('Error:', error)
      alert(`Error: ${error}`)
    }
  }
  
  const sendEmail = async (userEmail: string, subject: string, message: string) => {
    // This would integrate with your email service (Resend)
    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject,
          message
        })
      })
      
      if (response.ok) {
        alert(t('users.alerts.emailSent'))
      } else {
        alert(t('users.alerts.emailFailed'))
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert(t('users.alerts.emailError'))
    }
  }

  const deleteAccount = async (userId: string, userEmail: string) => {
    const confirmed = confirm(`Are you sure you want to delete the account for ${userEmail}? This action cannot be undone.`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error deleting user:', result)
        alert(`Error: ${result.error || 'Unknown error'}`)
        return
      }

      fetchUsers()
      alert('Account deleted successfully')
    } catch (error) {
      console.error('Error:', error)
      alert(`Error: ${error}`)
    }
  }
  
  const filteredUsers = users.filter(user => {
    const profile = getProfile(user)
    const matchesSearch = searchTerm === '' ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'blocked' && user.state === 'blocked') ||
      (filterStatus === 'active' && user.state === 'active')

    return matchesSearch && matchesRole && matchesStatus
  })
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'CUSTOMER': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getStatusColor = (state: string) => {
    return state === 'blocked'
      ? 'bg-red-100 text-red-800' 
      : 'bg-green-100 text-green-800'
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('users.title')}</h1>
          <p className="text-gray-600">{t('users.subtitle')}</p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('users.statistics.totalUsers')}</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('users.statistics.activeUsers')}</p>
                <p className="text-2xl font-bold">{users.filter(u => u.state === 'active').length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('users.statistics.blockedUsers')}</p>
                <p className="text-2xl font-bold">{users.filter(u => u.state === 'blocked').length}</p>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('users.statistics.admins')}</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('users.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white"
            >
              <option value="all">{t('users.filters.role.all')}</option>
              <option value="ADMIN">{t('users.filters.role.admin')}</option>
              <option value="CUSTOMER">{t('users.filters.role.customer')}</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white"
            >
              <option value="all">{t('users.filters.status.all')}</option>
              <option value="active">{t('users.filters.status.active')}</option>
              <option value="blocked">{t('users.filters.status.blocked')}</option>
            </select>
          </div>
        </CardContent>
      </Card>
      
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('users.table.title')}</CardTitle>
          <CardDescription>
            {t('users.table.description').replace('{filtered}', filteredUsers.length.toString()).replace('{total}', users.length.toString())}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('users.table.loading')}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('users.table.noUsers')}</p>
              {searchTerm && (
                <p className="text-sm">{t('users.table.adjustSearch')}</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">{t('users.table.headers.user')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('users.table.headers.role')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('users.table.headers.status')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('users.table.headers.bookings')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('users.table.headers.lastLogin')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('users.table.headers.joined')}</th>
                    <th className="text-right p-4 font-medium text-gray-700">{t('users.table.headers.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const profile = getProfile(user)
                    return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {profile?.full_name || t('users.table.userInfo.noName')}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          {profile?.phone && (
                            <div className="text-sm text-gray-500">
                              {profile.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(user.state)}>
                          {user.state === 'blocked' ? t('users.table.statusText.blocked') : t('users.table.statusText.active')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{user.reservations?.length || 0} {t('users.table.bookingInfo.bookings')}</div>
                          <div className="text-gray-500">
                            ₪{(user.reservations?.reduce((sum, reservation) => sum + reservation.total, 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('users.table.bookingInfo.spent')}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          {t('users.table.statusText.never')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          N/A
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{t('users.dialog.title')}</DialogTitle>
                                <DialogDescription>
                                  {t('users.dialog.description').replace('{email}', selectedUser?.email || '')}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedUser && (() => {
                                const selectedProfile = getProfile(selectedUser)
                                return (
                                <div className="space-y-6">
                                  {/* User Information */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-lg border-b pb-2">{t('users.dialog.basicInfo')}</h4>
                                      <div className="space-y-2">
                                        <div>
                                          <p className="text-sm text-gray-500">{t('users.dialog.name')}</p>
                                          <p className="font-medium">{selectedProfile?.full_name || t('users.dialog.notProvided')}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">{t('users.dialog.email')}</p>
                                          <p className="font-medium break-all">{selectedUser.email}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">{t('users.dialog.phone')}</p>
                                          <p className="font-medium">{selectedProfile?.phone || t('users.dialog.notProvided')}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Country</p>
                                          <p className="font-medium">{selectedProfile?.country || t('users.dialog.notProvided')}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">{t('users.dialog.role')}</p>
                                          <Badge className={getRoleColor(selectedUser.role)}>{selectedUser.role}</Badge>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">User ID</p>
                                          <p className="font-mono text-xs break-all">{selectedUser.id}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-lg border-b pb-2">{t('users.dialog.accountStats')}</h4>
                                      <div className="space-y-2">
                                        <div>
                                          <p className="text-sm text-gray-500">{t('users.dialog.status')}</p>
                                          <Badge className={getStatusColor(selectedUser.state)}>
                                            {selectedUser.state === 'blocked' ? t('users.table.statusText.blocked') : t('users.table.statusText.active')}
                                          </Badge>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">{t('users.dialog.bookings')}</p>
                                          <p className="font-medium text-2xl">{selectedUser.reservations?.length || 0}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">{t('users.dialog.totalSpent')}</p>
                                          <p className="font-medium text-2xl">₪{(selectedUser.reservations?.reduce((sum, reservation) => sum + reservation.total, 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Booking History */}
                                  {selectedUser.reservations && selectedUser.reservations.length > 0 && (
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-lg border-b pb-2">Booking History</h4>
                                      <div className="space-y-2">
                                        {selectedUser.reservations.map((reservation, index) => (
                                          <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                              <p className="font-medium">Booking #{index + 1}</p>
                                              <p className="text-sm text-gray-600">ID: {reservation.id.slice(0, 8)}...</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-medium">₪{reservation.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                              <Badge className={
                                                reservation.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                reservation.status === 'DECLINED' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                              }>
                                                {reservation.status}
                                              </Badge>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                )
                              })()}
                            </DialogContent>
                          </Dialog>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('users.actions.title')}</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => toggleUserBlock(user.id, user.state)}
                              >
                                {user.state === 'blocked' ? <UserCheck className="w-4 h-4 mr-2" /> : <UserX className="w-4 h-4 mr-2" />}
                                {user.state === 'blocked' ? t('users.actions.unblockUser') : t('users.actions.blockUser')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const subject = prompt(t('users.alerts.emailSubject'))
                                  const message = prompt(t('users.alerts.emailMessage'))
                                  if (subject && message) {
                                    sendEmail(user.email, subject, message)
                                  }
                                }}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                {t('users.actions.sendEmail')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteAccount(user.id, user.email)}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {t('users.actions.deleteAccount')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}