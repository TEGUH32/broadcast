import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await db.user.findFirst({
      where: { whatsappApiKey: token }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get broadcast
    const broadcast = await db.broadcast.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        recipients: {
          include: {
            contact: true
          }
        }
      }
    })

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      )
    }

    if (broadcast.status === 'completed' || broadcast.status === 'sending') {
      return NextResponse.json(
        { error: 'Broadcast is already being processed' },
        { status: 400 }
      )
    }

    // Update broadcast status to sending
    await db.broadcast.update({
      where: { id: params.id },
      data: {
        status: 'sending',
        sentAt: new Date()
      }
    })

    // Process recipients (simulate sending)
    let sentCount = 0
    let failedCount = 0

    for (const recipient of broadcast.recipients) {
      try {
        // Simulate WhatsApp API call
        // In production, you would use the actual WhatsApp Business API
        // Example: await sendWhatsAppMessage(recipient.contact.phone, broadcast.message)

        // For demo purposes, we'll just mark as sent
        await db.broadcastRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            deliveredAt: new Date()
          }
        })

        sentCount++
      } catch (error) {
        await db.broadcastRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'failed',
            errorMessage: 'Failed to send message'
          }
        })
        failedCount++
      }
    }

    // Update broadcast as completed
    const updatedBroadcast = await db.broadcast.update({
      where: { id: params.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        sentCount,
        failedCount,
        pendingCount: 0
      }
    })

    return NextResponse.json({
      success: true,
      broadcast: updatedBroadcast,
      message: `Broadcast completed: ${sentCount} sent, ${failedCount} failed`
    })
  } catch (error) {
    console.error('Send broadcast error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
