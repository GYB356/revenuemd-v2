import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, GitlabIcon as GitlabLogo, Mail } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-xl font-bold">RevenueMD</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900">
            Contact
          </Link>
          <Link href="/signup" className="text-sm text-gray-600 hover:text-gray-900">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Log in to RevenueMD</CardTitle>
            <CardDescription>Choose your preferred login method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={() => {}}>
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {}}>
                <GitlabLogo className="mr-2 h-4 w-4" />
                Continue with GitLab
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {}}>
                <Image
                  src="https://sjc.microlink.io/6M6JCiZ5uJ7dVlee80_Y1UfacpDBWro3GWijA-MJrkw0AwlnuHED7EwVqlKy0nsLfNKIrZUO4eNb6JOiI-x58w.jpeg"
                  alt="Bitbucket"
                  width={16}
                  height={16}
                  className="mr-2"
                />
                Continue with Bitbucket
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={() => {}}>
                <Mail className="mr-2 h-4 w-4" />
                Continue with Email
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {}}>
                Continue with SAML SSO
              </Button>
            </div>

            <div className="text-center text-sm">
              <Link href="/signup" className="text-primary hover:underline">
                Don't have an account? Sign Up
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

