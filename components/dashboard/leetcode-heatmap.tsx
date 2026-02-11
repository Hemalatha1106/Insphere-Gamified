'use client'

import { useMemo } from 'react'
import { startOfYear, endOfYear, eachDayOfInterval, format, isSameDay, getDay, subDays, startOfWeek } from 'date-fns'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils'

interface LeetCodeHeatmapProps {
    heatmapData: Record<string, number> | null
}

// Helper to determine color intensity based on submission count
const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/50'
    if (count <= 2) return 'bg-green-900/40' // Less than 3
    if (count <= 5) return 'bg-green-700/60'
    if (count <= 10) return 'bg-green-500/80'
    return 'bg-green-400'
}

export function LeetCodeHeatmap({ heatmapData }: LeetCodeHeatmapProps) {
    // If no data, we could show an empty state, but usually we just show empty grid
    const data = heatmapData || {}

    // Generate days for the grid
    // We explicitly show the last 365 days (rolling window) ending today.
    const days = useMemo(() => {
        const today = new Date()
        const oneYearAgo = subDays(today, 365)
        // Align to start of week (Sunday) to make the grid nice
        const startDate = startOfWeek(oneYearAgo)
        const endDate = today

        return eachDayOfInterval({ start: startDate, end: endDate })
    }, [])

    // Group days by week for rendering columns (vertical weeks)
    const weeks = useMemo(() => {
        const weeksArray: Date[][] = []
        let currentWeek: Date[] = []

        days.forEach((day) => {
            if (getDay(day) === 0 && currentWeek.length > 0) {
                weeksArray.push(currentWeek)
                currentWeek = []
            }
            currentWeek.push(day)
        })
        if (currentWeek.length > 0) weeksArray.push(currentWeek)
        return weeksArray
    }, [days])

    // Process LeetCode data (which is usually UNIX timestamp key -> count)
    // Need to normalize to 'yyyy-MM-dd' for easy lookup
    const normalizedData = useMemo(() => {
        const acc: Record<string, number> = {}
        Object.entries(data).forEach(([timestamp, count]) => {
            // LeetCode timestamps are seconds
            const date = new Date(parseInt(timestamp) * 1000)
            const key = format(date, 'yyyy-MM-dd')
            acc[key] = count
        })
        return acc
    }, [data])

    return (
        <div className="w-full overflow-x-auto pb-2 flex justify-center">
            {/* Use w-fit to avoid stretching and empty space if not needed */}
            <div className="min-w-fit px-2">
                <div className="flex gap-1 justify-between mb-2 px-1">
                    <span className="text-xs text-slate-500 font-mono">
                        {format(days[0], 'MMM yyyy')} - {format(days[days.length - 1], 'MMM yyyy')}
                    </span>
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500 mr-1">Less</span>
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-800/50" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-green-900/40" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-green-700/60" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-green-500/80" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-green-400" />
                        <span className="text-xs text-slate-500 ml-1">More</span>
                    </div>
                </div>

                <div className="flex gap-[3px]">
                    <TooltipProvider>
                        {weeks.map((week, i) => (
                            <div key={i} className="flex flex-col gap-[3px]">
                                {week.map((day) => {
                                    const dateKey = format(day, 'yyyy-MM-dd')
                                    const count = normalizedData[dateKey] || 0
                                    return (
                                        <Tooltip key={dateKey}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={cn(
                                                        "w-3 h-3 rounded-[2px] transition-all hover:ring-1 hover:ring-white/50 hover:scale-110",
                                                        getColor(count)
                                                    )}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs font-medium">{count} submissions on {format(day, 'MMM d, yyyy')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        ))}
                    </TooltipProvider>
                </div>
            </div>
        </div>
    )
}
