import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import WeekTracker from '@/components/week-tracker'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function PlanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Plan Details
    const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single()

    if (!plan) {
        notFound()
    }

    // Fetch Plan Days and Exercises
    const { data: planDays } = await supabase
        .from('plan_days')
        .select(`
      *,
      exercises (*)
    `)
        .eq('plan_id', id)
        .order('day_order')

    // Fetch Weeks
    const { data: weeks } = await supabase
        .from('weeks')
        .select('*')
        .eq('plan_id', id)
        .order('start_date', { ascending: false })

    // Fetch Logs for the most recent week (or all weeks if needed, but let's start with all for simplicity in client filtering)
    // Actually, fetching logs for ALL weeks might be too much data eventually. 
    // For now, let's fetch logs for the weeks we fetched.
    const weekIds = weeks?.map(w => w.id) || []

    type Log = {
        exercise_id: string
        day_number: number
        weight_lifted: string
        sets: number
        reps: string
        notes: string
        difficulty: string
    }

    let logs: Log[] = []
    if (weekIds.length > 0) {
        const { data: logsData } = await supabase
            .from('logs')
            .select('*')
            .in('week_id', weekIds)
        // Ensure data matches Log structure or cast if DB returns partials (usually full rows)
        logs = (logsData as unknown as Log[]) || []
    }

    // Sort exercises within days just to be safe (though usually created in order)
    const sortedPlanDays = planDays?.map(day => ({
        ...day,
        exercises: day.exercises.sort((a: { created_at: string }, b: { created_at: string }) => {
            // Assuming created_at sort or similar. If no order field, created_at is fine.
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
    })) || []

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-6">
                <Link href="/">
                    <Button variant="ghost" className="pl-0 hover:pl-0 hover:bg-transparent">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold mt-2">{plan.name}</h1>
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">{plan.days_per_week} Days / Week</p>
                    <Link href={`/plans/${plan.id}/edit`}>
                        <Button variant="outline" size="sm">Edit Plan</Button>
                    </Link>
                </div>
            </div>

            <WeekTracker
                planId={plan.id}
                planDays={sortedPlanDays}
                weeks={weeks || []}
                initialLogs={logs}
            />
        </div>
    )
}
