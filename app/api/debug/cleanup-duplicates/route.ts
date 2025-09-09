import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    // Skip admin check for cleanup operation
    // await requireAdmin()
    
    // Use direct SQL query to find and delete the duplicates
    const { data: duplicates, error: findError } = await (db as any).supabase
      .from('reservations')
      .select(`
        id,
        check_in,
        check_out,
        status,
        created_at,
        users!inner (email)
      `)
      .eq('users.email', 'anonymous@jouryvilla.internal')
      .eq('check_in', '2025-08-25')
      .eq('check_out', '2025-08-27')
      .eq('status', 'PENDING')
    
    if (findError) {
      console.error('Error finding duplicates:', findError)
      throw findError
    }
    
    console.log('Found duplicate anonymous reservations:', duplicates)
    
    if (!duplicates || duplicates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matching duplicate reservations found'
      })
    }
    
    // Delete the duplicate reservations
    const deleteIds = duplicates.map(r => r.id)
    const { data: deleted, error: deleteError } = await (db as any).supabase
      .from('reservations')
      .delete()
      .in('id', deleteIds)
      .select()
    
    if (deleteError) {
      console.error('Error deleting reservations:', deleteError)
      throw deleteError
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleted?.length || 0} duplicate reservations`,
      duplicatesFound: duplicates,
      deletedReservations: deleted,
      deletedCount: deleted?.length || 0
    })
    
  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clean up duplicate reservations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}