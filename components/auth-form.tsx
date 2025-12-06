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
                    <Label htmlFor="email" className="text-gray-200">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="m@example.com" className="bg-black/20 border-white/10 text-white placeholder:text-gray-500" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-200">Password</Label>
                    <Input id="password" name="password" type="password" required className="bg-black/20 border-white/10 text-white" />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </Button>
            </form>
        </Card>
    )
}
