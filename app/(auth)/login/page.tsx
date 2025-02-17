'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth/auth-context'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { useState } from 'react'
import { toast } from 'sonner'

export default function LoginPage() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    try {
      setIsLoading(true)
      await login(data.email, data.password)
      toast.success('Logged in successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-6 w-6" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to sign in to your account
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              {...register('email')}
              type="email"
              placeholder="name@example.com"
              disabled={isLoading}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              {...register('password')}
              type="password"
              placeholder="Enter your password"
              disabled={isLoading}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In
          </Button>
        </form>
        <Button variant="outline" className="w-full" disabled={isLoading}>
          <Icons.gitHub className="mr-2 h-4 w-4" />
          Continue with GitHub
        </Button>
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/register"
            className="hover:text-brand underline underline-offset-4"
          >
            Don't have an account? Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
} 