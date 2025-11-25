'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { login, signup } from '@/app/login/actions'
import { toast } from 'sonner'

export default function AuthForm() {
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (formData: FormData) => {
        setIsLoading(true)
        const result = await login(formData)
        setIsLoading(false)
        if (result?.error) {
            toast.error(result.error)
        }
    }

    const handleSignup = async (formData: FormData) => {
        setIsLoading(true)
        const result = await signup(formData)
        setIsLoading(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Check your email to confirm your account')
        }
    }

    return (
        <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <form action={handleLogin} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required placeholder="m@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            </TabsContent>
            <TabsContent value="signup">
                <form action={handleSignup} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" name="fullName" type="text" required placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" name="email" type="email" required placeholder="m@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" name="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing up...' : 'Sign Up'}
                    </Button>
                </form>
            </TabsContent>
        </Tabs>
    )
}
