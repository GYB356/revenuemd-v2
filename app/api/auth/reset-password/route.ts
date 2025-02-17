import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { sendEmail } from "@/lib/email"

// Schema for requesting a password reset
const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
})

// Schema for resetting the password
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
})

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = requestResetSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({
        message: "If an account exists with that email, a password reset link has been sent.",
      })
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    )

    // Store hashed version of token
    const hashedToken = await bcrypt.hash(resetToken, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_API_URL}/reset-password?token=${resetToken}`
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: `Please click the following link to reset your password: ${resetUrl}`,
      html: `
        <p>Please click the following link to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    })

    return NextResponse.json({
      message: "If an account exists with that email, a password reset link has been sent.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Password reset request error:", error)
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    )
  }
}

// Reset password with token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || !user.resetToken || !user.resetTokenExpires) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Verify token hasn't expired
    if (new Date() > user.resetTokenExpires) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      )
    }

    // Verify stored hashed token
    const isValidToken = await bcrypt.compare(token, user.resetToken)
    if (!isValidToken) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      )
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    })

    return NextResponse.json({
      message: "Password has been reset successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
} 