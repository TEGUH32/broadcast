import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single broadcast with recipients
export async function GET(
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

    return NextResponse.json({ broadcast })
  } catch (error) {
    console.error('Get broadcast error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete broadcast
export async function DELETE(
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

    // Check if broadcast belongs to user
    const existingBroadcast = await db.broadcast.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingBroadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      )
    }

    // Delete broadcast (cascade will delete recipients)
    await db.broadcast.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Broadcast deleted successfully'
    })
  } catch (error) {
    console.error('Delete broadcast error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
