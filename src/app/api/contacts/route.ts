import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all contacts
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: any = { userId: user.id }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const contacts = await db.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Get contacts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new contact
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
    const { name, phone, email, tags, notes } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Check if phone already exists for this user
    const existingContact = await db.contact.findFirst({
      where: {
        userId: user.id,
        phone
      }
    })

    if (existingContact) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      )
    }

    const contact = await db.contact.create({
      data: {
        name,
        phone,
        email: email || null,
        tags: tags || null,
        notes: notes || null,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      contact
    })
  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
