import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET() {
  try {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    
    const result = await db.getMonthlyRevenue(monthStart.toISOString(), monthEnd.toISOString())
    
    return NextResponse.json({
      success: true,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      result
    })
  } catch (error) {
    console.error('Monthly revenue debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}