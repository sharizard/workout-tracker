import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PlanWizard from '@/components/plan-wizard'

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
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

    // Sort exercises
    const sortedPlanDays = planDays?.map(day => ({
        ...day,
        exercises: day.exercises.sort((a: any, b: any) => {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
    })) || []

    return <PlanWizard initialPlan={plan} initialDays={sortedPlanDays} isEditing={true} />
}
