import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'

// GET - Get user profile
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
      where: { whatsappApiKey: token },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        companyName: true,
        isActive: true,
        whatsappNumber: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
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
    const { name, phone, companyName, whatsappNumber, currentPassword, newPassword } = body

    // If password change is requested
    if (currentPassword && newPassword) {
      const isValidPassword = await verifyPassword(currentPassword, user.password)

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        )
      }

      const hashedPassword = await hashPassword(newPassword)

      await db.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      })
    }

    // Update profile information
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(companyName !== undefined && { companyName }),
        ...(whatsappNumber !== undefined && { whatsappNumber })
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        companyName: true,
        isActive: true,
        whatsappNumber: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
