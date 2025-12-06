'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePassword } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        const result = await updatePassword(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Password updated successfully')
            router.push('/')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Set Password</CardTitle>
                    <CardDescription>Enter your new password below</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" name="password" type="password" required minLength={6} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
