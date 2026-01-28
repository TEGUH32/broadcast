import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user by token
    const user = await db.user.findFirst({
      where: { whatsappApiKey: token }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get total contacts
    const totalContacts = await db.contact.count({
      where: { userId: user.id }
    })

    // Get total broadcasts
    const totalBroadcasts = await db.broadcast.count({
      where: { userId: user.id }
    })

    // Get all broadcasts with recipient status
    const broadcasts = await db.broadcast.findMany({
      where: { userId: user.id },
      include: {
        recipients: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate sent messages and success rate
    let sentMessages = 0
    let failedMessages = 0

    broadcasts.forEach(broadcast => {
      broadcast.recipients.forEach(recipient => {
        if (recipient.status === 'sent' || recipient.status === 'delivered' || recipient.status === 'read') {
          sentMessages++
        } else if (recipient.status === 'failed') {
          failedMessages++
        }
      })
    })

    const totalMessages = sentMessages + failedMessages
    const successRate = totalMessages > 0 ? Math.round((sentMessages / totalMessages) * 100) : 0

    // Get recent broadcasts
    const recentBroadcasts = await db.broadcast.findMany({
      where: { userId: user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        totalContacts: true,
        sentCount: true,
        failedCount: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      totalContacts,
      totalBroadcasts,
      sentMessages,
      pendingMessages: 0,
      successRate,
      recentBroadcasts
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
