import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT - Update contact
export async function PUT(
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

    const body = await request.json()
    const { name, phone, email, tags, notes, status } = body

    // Check if contact belongs to user
    const existingContact = await db.contact.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Check if phone already exists for another contact
    if (phone && phone !== existingContact.phone) {
      const duplicateContact = await db.contact.findFirst({
        where: {
          userId: user.id,
          phone,
          id: { not: params.id }
        }
      })

      if (duplicateContact) {
        return NextResponse.json(
          { error: 'Phone number already exists' },
          { status: 409 }
        )
      }
    }

    const contact = await db.contact.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(tags !== undefined && { tags }),
        ...(notes !== undefined && { notes }),
        ...(status && { status })
      }
    })

    return NextResponse.json({
      success: true,
      contact
    })
  } catch (error) {
    console.error('Update contact error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete contact
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

    // Check if contact belongs to user
    const existingContact = await db.contact.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    await db.contact.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    })
  } catch (error) {
    console.error('Delete contact error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
