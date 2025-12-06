'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createWeek(planId: string, startDate?: string) {
    const supabase = await createClient()

    // We allow multiple active weeks now to support backfilling
    // But maybe we should warn if there is an exact overlap?
    // For now, let's just create it. User can manage their weeks.

    const { data, error } = await supabase
        .from('weeks')
        .insert({
            plan_id: planId,
            start_date: startDate || new Date().toISOString(),
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/plans/${planId}`)
    return { data }
}

export async function saveLog(weekId: string, exerciseId: string, dayNumber: number, weight: string, sets: number, reps: string, notes: string, difficulty: string) {
    const supabase = await createClient()

    // Check if week is locked
    const { data: week } = await supabase.from('weeks').select('is_locked').eq('id', weekId).single()
    if (week?.is_locked) {
        return { error: 'This week is locked and cannot be edited.' }
    }

    const { error } = await supabase
        .from('logs')
        .upsert({
            week_id: weekId,
            exercise_id: exerciseId,
            day_number: dayNumber,
            weight_lifted: weight,
            sets: sets,
            reps: reps,
            notes: notes,
            difficulty: difficulty
        }, {
            onConflict: 'week_id,exercise_id,day_number'
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/plans/[id]`)
    return { success: true }
}

export async function lockWeek(weekId: string, planId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('weeks')
        .update({ is_locked: true })
        .eq('id', weekId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/plans/${planId}`)
    return { success: true }
}

export async function addAdHocExercise(planId: string, dayId: string, name: string, sets: number, reps: string) {
    const supabase = await createClient()

    // Verify ownership (RLS handles this but good to be explicit if needed, here RLS is enough)

    const { data, error } = await supabase
        .from('exercises')
        .insert({
            day_id: dayId,
            name,
            sets,
            reps
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/plans/${planId}`)
    return { data }
}
