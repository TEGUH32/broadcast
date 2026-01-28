import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all broadcasts
export async function GET(request: NextRequest) {
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

    const broadcasts = await db.broadcast.findMany({
      where: { userId: user.id },
      include: {
        template: {
          select: {
            id: true,
            name: true
          }
        },
        recipients: {
          take: 5,
          select: {
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ broadcasts })
  } catch (error) {
    console.error('Get broadcasts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new broadcast
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, message, templateId, contactIds, scheduledAt } = body

    if (!title || !message || !contactIds || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'Title, message, and at least one contact are required' },
        { status: 400 }
      )
    }

    // Create broadcast
    const broadcast = await db.broadcast.create({
      data: {
        title,
        message,
        templateId: templateId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalContacts: contactIds.length,
        pendingCount: contactIds.length,
        userId: user.id,
        recipients: {
          create: contactIds.map((contactId: string) => ({
            contactId,
            status: 'pending'
          }))
        }
      }
    })

    return NextResponse.json({
      success: true,
      broadcast
    })
  } catch (error) {
    console.error('Create broadcast error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
