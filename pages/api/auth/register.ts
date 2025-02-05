import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/mongodb'
import User from '../../../models/User'
import { hashPassword, generateToken, generateRefreshToken } from '../../../lib/authUtils'
import { setInRedis } from '../../../services/redisService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await dbConnect()

  const { name, email, password } = req.body

  try {
    let user = await User.findOne({ email })

    if (user) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const hashedPassword = await hashPassword(password)

    user = new User({
      name,
      email,
      password: hashedPassword,
    })

    await user.save()

    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    // Store refresh token in Redis
    await setInRedis(`refresh_${user._id}`, refreshToken, 7 * 24 * 60 * 60) // 7 days

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
