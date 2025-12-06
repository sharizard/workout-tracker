'use client'

import { useState } from 'react'
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
    sets: number
    reps: string
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
    const [selectedWeekId, setSelectedWeekId] = useState<string>(() => weeks.length > 0 ? weeks[0].id : '')
    const [logs, setLogs] = useState<Record<string, Log>>(() => {
        const logMap: Record<string, Log> = {}
        initialLogs.forEach(log => {
            const key = `${log.exercise_id}-${log.day_number}`
            logMap[key] = log
        })
        return logMap
    })
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

    const handleLogChange = (exerciseId: string, dayNumber: number, field: keyof Log, value: string | number) => {
        if (isLocked) return
        const key = `${exerciseId}-${dayNumber}`
        setLogs(prev => {
            const existingLog = prev[key] || {
                exercise_id: exerciseId,
                day_number: dayNumber,
                weight_lifted: '',
                sets: 0,
                reps: '',
                notes: '',
                difficulty: ''
            }
            return {
                ...prev,
                [key]: {
                    ...existingLog,
                    [field]: value
                }
            }
        })
    }

    const handleSaveLog = async (exerciseId: string, dayNumber: number) => {
        if (!selectedWeekId) return
        const key = `${exerciseId}-${dayNumber}`
        const log = logs[key]
        if (!log) return

        setIsSaving(true)
        const result = await saveLog(
            selectedWeekId,
            exerciseId,
            dayNumber,
            log.weight_lifted,
            log.sets ?? 0,
            log.reps ?? '',
            log.notes || '',
            log.difficulty || ''
        )
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
            <div className="flex flex-col md:flex-row justify-between items-center bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-white/5 shadow-sm gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Select value={selectedWeekId} onValueChange={setSelectedWeekId}>
                        <SelectTrigger className="w-full md:w-[240px] bg-black/20 border-white/10 text-white">
                            <SelectValue placeholder="Select Week" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2332] border-white/10 text-white">
                            {weeks.map((week) => (
                                <SelectItem key={week.id} value={week.id} className="focus:bg-white/10 focus:text-white">
                                    Week of {new Date(week.start_date).toLocaleDateString()} {week.is_locked ? '(Completed)' : '(Active)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {!weeks.length && <span className="text-sm text-gray-400">No active weeks</span>}
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" /> Start New Week
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1e293b] border-white/10 text-white sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Start New Week</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                    Select the start date for this week. You can backfill past weeks.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-6">
                                <Label className="mb-2 block text-gray-200">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-black/20 border-white/10 text-white hover:bg-white/5 hover:text-white",
                                                !newWeekDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newWeekDate ? format(newWeekDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#1e293b] border-white/10">
                                        <Calendar
                                            mode="single"
                                            selected={newWeekDate}
                                            onSelect={setNewWeekDate}
                                            initialFocus
                                            className="bg-[#1e293b] text-white rounded-md"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateWeek} disabled={isCreatingWeek} className="bg-primary hover:bg-primary/90 text-white w-full">
                                    {isCreatingWeek ? 'Starting...' : 'Start Week'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {currentWeek && !currentWeek.is_locked && (
                        <Button variant="outline" onClick={handleLockWeek} className="flex-1 md:flex-none border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                            <Lock className="mr-2 h-4 w-4" /> Finish Week
                        </Button>
                    )}
                </div>
            </div>

            {selectedWeekId && (
                <Tabs defaultValue="day-1" className="w-full">
                    <TabsList className="bg-black/20 p-1 rounded-xl mb-6 flex flex-wrap h-auto gap-1">
                        {planDays.map((day) => (
                            <TabsTrigger
                                key={day.id}
                                value={`day-${day.day_order}`}
                                className="flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                            >
                                Day {day.day_order}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {planDays.map((day) => (
                        <TabsContent key={day.id} value={`day-${day.day_order}`} className="space-y-4">
                            <Card className="border-white/5 bg-card/40 backdrop-blur-md shadow-xl">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
                                    <CardTitle className="text-2xl text-white">{day.headline}</CardTitle>
                                    {!isLocked && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => setActiveDayId(day.id)} className="bg-white/5 border-white/10 hover:bg-white/10 text-white">
                                                    <Plus className="mr-2 h-4 w-4" /> Add Exercise
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-[#1e293b] border-white/10 text-white">
                                                <DialogHeader>
                                                    <DialogTitle>Add Exercise</DialogTitle>
                                                    <DialogDescription className="text-gray-400">
                                                        Add a permanent exercise to this day.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                {/* Content similar to previous but styled... skipping detailed inner dialog styling for brevity as pattern repeats */}
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-200">Exercise Name</Label>
                                                        <Input className="bg-black/20 border-white/10 text-white" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} placeholder="e.g. Lunges" />
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div className="space-y-2 flex-1">
                                                            <Label className="text-gray-200">Sets</Label>
                                                            <Input
                                                                className="bg-black/20 border-white/10 text-white"
                                                                type="number"
                                                                value={newExerciseSets || ''}
                                                                onChange={(e) => setNewExerciseSets(parseInt(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2 flex-1">
                                                            <Label className="text-gray-200">Reps</Label>
                                                            <Input
                                                                className="bg-black/20 border-white/10 text-white"
                                                                value={newExerciseReps}
                                                                onChange={(e) => setNewExerciseReps(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={handleAddExercise} disabled={isAddingExercise} className="bg-primary text-white hover:bg-primary/90">
                                                        {isAddingExercise ? 'Adding...' : 'Add Exercise'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    {day.exercises.map((exercise) => {
                                        const key = `${exercise.id}-${day.day_order}`
                                        const log = logs[key] || { weight_lifted: '', sets: 0, reps: '', notes: '', difficulty: '' }
                                        return (
                                            <div key={exercise.id} className="p-6 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-xl text-white tracking-wide">{exercise.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary-foreground">Target</span>
                                                            <span className="text-sm text-gray-400">{exercise.sets} sets x {exercise.reps}</span>
                                                        </div>
                                                    </div>
                                                    {!isLocked && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleSaveLog(exercise.id, day.day_order)}
                                                            disabled={isSaving}
                                                            className="w-full md:w-auto bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/20"
                                                        >
                                                            <Save className="mr-2 h-4 w-4" /> Save Log
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Weight (kg)</Label>
                                                                <Input
                                                                    className="bg-black/40 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                                    placeholder="0"
                                                                    value={log.weight_lifted ?? ''}
                                                                    onChange={(e) => handleLogChange(exercise.id, day.day_order, 'weight_lifted', e.target.value)}
                                                                    disabled={isLocked}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sets</Label>
                                                                <Input
                                                                    type="number"
                                                                    className="bg-black/40 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                                    placeholder="0"
                                                                    value={log.sets || ''}
                                                                    onChange={(e) => handleLogChange(exercise.id, day.day_order, 'sets', parseInt(e.target.value) || 0)}
                                                                    disabled={isLocked}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reps</Label>
                                                                <Input
                                                                    className="bg-black/40 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                                    placeholder="0"
                                                                    value={log.reps ?? ''}
                                                                    onChange={(e) => handleLogChange(exercise.id, day.day_order, 'reps', e.target.value)}
                                                                    disabled={isLocked}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</Label>
                                                            <Input
                                                                className="bg-black/40 border-white/10 text-white focus:border-primary/50 transition-colors"
                                                                placeholder="Add a note..."
                                                                value={log.notes ?? ''}
                                                                onChange={(e) => handleLogChange(exercise.id, day.day_order, 'notes', e.target.value)}
                                                                disabled={isLocked}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 bg-black/20 p-4 rounded-lg border border-white/5">
                                                        <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Perceived Difficulty</Label>
                                                        <RadioGroup
                                                            value={log.difficulty}
                                                            onValueChange={(val) => handleLogChange(exercise.id, day.day_order, 'difficulty', val)}
                                                            disabled={isLocked}
                                                            className="flex flex-col space-y-2"
                                                        >
                                                            {['Easy', 'Medium', 'Difficult'].map((diff) => (
                                                                <div key={diff} className="flex items-center space-x-2">
                                                                    <RadioGroupItem value={diff} id={`${diff}-${exercise.id}`} className="border-white/20 text-primary" />
                                                                    <Label htmlFor={`${diff}-${exercise.id}`} className="font-normal text-gray-300 cursor-pointer hover:text-white transition-colors">
                                                                        {diff}
                                                                    </Label>
                                                                </div>
                                                            ))}
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
