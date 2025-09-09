'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  User
} from 'lucide-react'
import { format } from 'date-fns'

interface AuditLog {
  id: string
  action: string
  target_type: string
  target_id: string
  payload?: any
  created_at: string
  users?: {
    email: string
    customer_profiles?: {
      full_name?: string
    }[]
  }
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    // Set default date range (last 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
    setDateTo(now.toISOString().split('T')[0])
    
    fetchAuditLogs()
  }, [])
  
  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users (
            email,
            customer_profiles (
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000)
      
      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59')
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching audit logs:', error)
        return
      }
      
      setLogs(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleRefresh = () => {
    setRefreshing(true)
    fetchAuditLogs().finally(() => setRefreshing(false))
  }
  
  const exportLogs = () => {
    const csvContent = generateCSVExport()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${dateFrom}-to-${dateTo}.csv`
    link.click()
  }
  
  const generateCSVExport = (): string => {
    let csv = 'Timestamp,Action,User,Target Type,Target ID,Details\n'
    
    filteredLogs.forEach(log => {
      const user = log.users?.customer_profiles?.[0]?.full_name || log.users?.email || 'System'
      const details = log.payload ? JSON.stringify(log.payload).replace(/"/g, '""') : ''
      
      csv += `"${format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}","${log.action}","${user}","${log.target_type}","${log.target_id}","${details}"\n`
    })
    
    return csv
  }
  
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.users?.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAction = filterAction === 'all' || log.action.includes(filterAction.toUpperCase())
    
    return matchesSearch && matchesAction
  })
  
  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('APPROVED')) {
      return 'bg-green-100 text-green-800'
    } else if (action.includes('DELETED') || action.includes('CANCELLED') || action.includes('BLOCKED')) {
      return 'bg-red-100 text-red-800'
    } else if (action.includes('UPDATED') || action.includes('MODIFIED')) {
      return 'bg-blue-100 text-blue-800'
    } else if (action.includes('PAYMENT')) {
      return 'bg-purple-100 text-purple-800'
    } else {
      return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getActionIcon = (action: string) => {
    if (action.includes('CREATED') || action.includes('APPROVED')) {
      return <CheckCircle className="w-4 h-4" />
    } else if (action.includes('DELETED') || action.includes('CANCELLED') || action.includes('BLOCKED')) {
      return <AlertTriangle className="w-4 h-4" />
    } else {
      return <Info className="w-4 h-4" />
    }
  }
  
  const formatActionDescription = (log: AuditLog): string => {
    const user = log.users?.customer_profiles?.[0]?.full_name || log.users?.email || 'System'
    const action = log.action.toLowerCase().replace(/_/g, ' ')
    
    return `${user} ${action} ${log.target_type} ${log.target_id}`
  }
  
  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'booking', label: 'Booking Actions' },
    { value: 'payment', label: 'Payment Actions' },
    { value: 'user', label: 'User Actions' },
    { value: 'property', label: 'Property Actions' },
    { value: 'pricing', label: 'Pricing Actions' },
    { value: 'coupon', label: 'Coupon Actions' },
    { value: 'policy', label: 'Policy Actions' }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Track all system activities and administrative actions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportLogs} className="bg-coral hover:bg-coral/90">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today&apos;s Events</p>
                <p className="text-2xl font-bold">
                  {logs.filter(log => 
                    new Date(log.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Events</p>
                <p className="text-2xl font-bold">
                  {logs.filter(log => 
                    log.action.includes('DELETED') || log.action.includes('BLOCKED')
                  ).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">
                  {new Set(logs.map(log => log.users?.email)).size}
                </p>
              </div>
              <User className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search actions, users, or targets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white"
            >
              {actionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
            />
            
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
            />
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {logs.length} events
            </p>
            <Button onClick={fetchAuditLogs} variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
          <CardDescription>
            Chronological list of all system activities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No audit logs found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search terms or date range</p>
              )}
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <div className="space-y-1">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 border-b">
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`p-1 rounded-full ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {formatActionDescription(log)}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-1">
                            <Badge className={getActionColor(log.action)}>
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                            
                            <span className="text-xs text-gray-500">
                              {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                            
                            <span className="text-xs text-gray-500">
                              Target: {log.target_type}
                            </span>
                          </div>
                          
                          {log.payload && Object.keys(log.payload).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                                View details
                              </summary>
                              <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}