'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { createWeek, saveLog, lockWeek, addAdHocExercise } from '@/app/plans/[id]/actions'
import { toast } from 'sonner'
import { Lock, Plus, Save, Calendar as CalendarIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type Exercise = {
    id: string
    name: string
    sets: number
    reps: string
    day_id: string
}

type PlanDay = {
    id: string
    day_order: number
    headline: string
    exercises: Exercise[]
}

type Log = {
    exercise_id: string
    day_number: number
    weight_lifted: string
    notes: string
    difficulty: string
}

type Week = {
    id: string
    start_date: string
    is_locked: boolean
}

interface WeekTrackerProps {
    planId: string
    planDays: PlanDay[]
    weeks: Week[]
    initialLogs: Log[]
}

export default function WeekTracker({ planId, planDays, weeks, initialLogs }: WeekTrackerProps) {
    const [selectedWeekId, setSelectedWeekId] = useState<string>(weeks.length > 0 ? weeks[0].id : '')
    const [logs, setLogs] = useState<Record<string, Log>>({})
    const [isSaving, setIsSaving] = useState(false)

    // Ad-hoc exercise state
    const [isAddingExercise, setIsAddingExercise] = useState(false)
    const [newExerciseName, setNewExerciseName] = useState('')
    const [newExerciseSets, setNewExerciseSets] = useState(3)
    const [newExerciseReps, setNewExerciseReps] = useState('8-12')
    const [activeDayId, setActiveDayId] = useState<string | null>(null)

    // New Week state
    const [isCreatingWeek, setIsCreatingWeek] = useState(false)
    const [newWeekDate, setNewWeekDate] = useState<Date | undefined>(new Date())

    // Initialize logs state from props
    useEffect(() => {
        const logMap: Record<string, Log> = {}
        initialLogs.forEach(log => {
            const key = `${log.exercise_id}-${log.day_number}`
            logMap[key] = log
        })
        setLogs(logMap)
    }, [initialLogs])

    // Update selected week if new weeks come in (e.g. after creation)
    useEffect(() => {
        if (!selectedWeekId && weeks.length > 0) {
            setSelectedWeekId(weeks[0].id)
        }
    }, [weeks, selectedWeekId])

    const currentWeek = weeks.find(w => w.id === selectedWeekId)
    const isLocked = currentWeek?.is_locked ?? false

    const handleCreateWeek = async () => {
        setIsCreatingWeek(true)
        const result = await createWeek(planId, newWeekDate?.toISOString())
        setIsCreatingWeek(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('New week started!')
            setSelectedWeekId(result.data.id)
        }
    }

    const handleLockWeek = async () => {
        if (!selectedWeekId) return
        if (confirm('Are you sure you want to finish this week? You won\'t be able to edit it anymore.')) {
            const result = await lockWeek(selectedWeekId, planId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Week completed!')
            }
        }
    }

    const handleLogChange = (exerciseId: string, dayNumber: number, field: keyof Log, value: string) => {
        if (isLocked) return
        const key = `${exerciseId}-${dayNumber}`
        setLogs(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                exercise_id: exerciseId,
                day_number: dayNumber,
                [field]: value
            }
        }))
    }

    const handleSaveLog = async (exerciseId: string, dayNumber: number) => {
        if (!selectedWeekId) return
        const key = `${exerciseId}-${dayNumber}`
        const log = logs[key]
        if (!log) return

        setIsSaving(true)
        const result = await saveLog(selectedWeekId, exerciseId, dayNumber, log.weight_lifted, log.notes || '', log.difficulty || '')
        setIsSaving(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Saved')
        }
    }

    const handleAddExercise = async () => {
        if (!activeDayId) return
        if (!newExerciseName) {
            toast.error('Please enter an exercise name')
            return
        }

        setIsAddingExercise(true)
        const result = await addAdHocExercise(planId, activeDayId, newExerciseName, newExerciseSets, newExerciseReps)
        setIsAddingExercise(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Exercise added to plan!')
            setNewExerciseName('')
            setNewExerciseSets(3)
            setNewExerciseReps('8-12')
            setActiveDayId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Select value={selectedWeekId} onValueChange={setSelectedWeekId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Week" />
                        </SelectTrigger>
                        <SelectContent>
                            {weeks.map((week, index) => (
                                <SelectItem key={week.id} value={week.id}>
                                    Week of {new Date(week.start_date).toLocaleDateString()} {week.is_locked ? '(Completed)' : '(Active)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {!weeks.length && <span className="text-sm text-gray-500">No active weeks</span>}
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Start New Week
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Start New Week</DialogTitle>
                                <DialogDescription>
                                    Select the start date for this week. You can backfill past weeks.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Label className="mb-2 block">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !newWeekDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newWeekDate ? format(newWeekDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={newWeekDate}
                                            onSelect={setNewWeekDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateWeek} disabled={isCreatingWeek}>
                                    {isCreatingWeek ? 'Starting...' : 'Start Week'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {currentWeek && !currentWeek.is_locked && (
                        <Button variant="outline" onClick={handleLockWeek}>
                            <Lock className="mr-2 h-4 w-4" /> Finish Week
                        </Button>
                    )}
                </div>
            </div>

            {selectedWeekId && (
                <Tabs defaultValue="day-1" className="w-full">
                    <TabsList className="flex flex-wrap h-auto">
                        {planDays.map((day) => (
                            <TabsTrigger key={day.id} value={`day-${day.day_order}`} className="flex-1 min-w-[100px]">
                                Day {day.day_order}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {planDays.map((day) => (
                        <TabsContent key={day.id} value={`day-${day.day_order}`} className="space-y-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>{day.headline}</CardTitle>
                                    {!isLocked && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => setActiveDayId(day.id)}>
                                                    <Plus className="mr-2 h-4 w-4" /> Add Exercise
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add Exercise to Day {day.day_order}</DialogTitle>
                                                    <DialogDescription>
                                                        This will add a new exercise to this day in your plan permanently.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Exercise Name</Label>
                                                        <Input value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} placeholder="e.g. Lunges" />
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div className="space-y-2 flex-1">
                                                            <Label>Sets</Label>
                                                            <Input type="number" value={newExerciseSets} onChange={(e) => setNewExerciseSets(parseInt(e.target.value))} />
                                                        </div>
                                                        <div className="space-y-2 flex-1">
                                                            <Label>Reps</Label>
                                                            <Input value={newExerciseReps} onChange={(e) => setNewExerciseReps(e.target.value)} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={handleAddExercise} disabled={isAddingExercise}>
                                                        {isAddingExercise ? 'Adding...' : 'Add Exercise'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {day.exercises.map((exercise) => {
                                        const key = `${exercise.id}-${day.day_order}`
                                        const log = logs[key] || { weight_lifted: '', notes: '', difficulty: '' }
                                        return (
                                            <div key={exercise.id} className="border-b pb-6 last:border-0 last:pb-0">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-semibold text-lg">{exercise.name}</h4>
                                                        <p className="text-sm text-gray-500">{exercise.sets} sets x {exercise.reps}</p>
                                                    </div>
                                                    {!isLocked && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleSaveLog(exercise.id, day.day_order)}
                                                            disabled={isSaving}
                                                        >
                                                            <Save className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Weight Lifted</Label>
                                                            <Input
                                                                placeholder="e.g. 100kg"
                                                                value={log.weight_lifted}
                                                                onChange={(e) => handleLogChange(exercise.id, day.day_order, 'weight_lifted', e.target.value)}
                                                                disabled={isLocked}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Notes</Label>
                                                            <Input
                                                                placeholder="How did it feel?"
                                                                value={log.notes}
                                                                onChange={(e) => handleLogChange(exercise.id, day.day_order, 'notes', e.target.value)}
                                                                disabled={isLocked}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label>Difficulty</Label>
                                                        <RadioGroup
                                                            value={log.difficulty}
                                                            onValueChange={(val) => handleLogChange(exercise.id, day.day_order, 'difficulty', val)}
                                                            disabled={isLocked}
                                                            className="flex flex-col space-y-1"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="Easy" id={`easy-${exercise.id}`} />
                                                                <Label htmlFor={`easy-${exercise.id}`} className="font-normal cursor-pointer">Easy</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="Medium" id={`medium-${exercise.id}`} />
                                                                <Label htmlFor={`medium-${exercise.id}`} className="font-normal cursor-pointer">Medium</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="Difficult" id={`difficult-${exercise.id}`} />
                                                                <Label htmlFor={`difficult-${exercise.id}`} className="font-normal cursor-pointer">Difficult</Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            )}
        </div>
    )
}
