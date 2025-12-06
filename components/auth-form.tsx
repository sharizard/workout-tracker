'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/app/login/actions'
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



    return (
        <Card className="w-full border-0 shadow-none">
            <form action={handleLogin} className="space-y-4">
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
        </Card>
    )
}
