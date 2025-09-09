import { requireAdmin } from '@/lib/admin-auth'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="pl-64">
        <AdminHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}