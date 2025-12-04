"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { ScheduleEvent } from "@/lib/types/schedule";
import { cn } from "@/lib/utils";

interface ScheduleCalendarProps {
    events: ScheduleEvent[];
    onDateSelect?: (date: Date) => void;
    selectedDate?: Date | null;
}

export function ScheduleCalendar({ events, onDateSelect, selectedDate }: ScheduleCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: (Date | null)[] = [];

        // Add empty cells for days before the first day of the month
        const startDayOfWeek = firstDay.getDay();
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    }, [currentMonth]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, ScheduleEvent[]>();
        events.forEach((event) => {
            const dateKey = new Date(event.datetime).toDateString();
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(event);
        });
        return map;
    }, [events]);

    const goToPrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
        onDateSelect?.(new Date());
    };

    const isToday = (date: Date) => {
        return date.toDateString() === new Date().toDateString();
    };

    const isSelected = (date: Date) => {
        return selectedDate?.toDateString() === date.toDateString();
    };

    const hasEvents = (date: Date) => {
        return eventsByDate.has(date.toDateString());
    };

    const getEventsForDate = (date: Date) => {
        return eventsByDate.get(date.toDateString()) || [];
    };

    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

    return (
        <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {currentMonth.toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                        })}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToToday}
                            className="text-xs"
                        >
                            今日
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPrevMonth}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNextMonth}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map((day, index) => (
                        <div
                            key={day}
                            className={cn(
                                "text-center text-xs font-medium py-2",
                                index === 0 && "text-red-400",
                                index === 6 && "text-blue-400"
                            )}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {daysInMonth.map((date, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                        >
                            {date ? (
                                <button
                                    onClick={() => onDateSelect?.(date)}
                                    className={cn(
                                        "w-full aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors text-sm",
                                        "hover:bg-accent",
                                        isToday(date) && "bg-primary/20 font-bold",
                                        isSelected(date) && "bg-primary text-primary-foreground",
                                        date.getDay() === 0 && "text-red-400",
                                        date.getDay() === 6 && "text-blue-400"
                                    )}
                                >
                                    <span>{date.getDate()}</span>
                                    {hasEvents(date) && (
                                        <div className="flex gap-0.5">
                                            {getEventsForDate(date).slice(0, 3).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "h-1 w-1 rounded-full",
                                                        isSelected(date) ? "bg-primary-foreground" : "bg-primary"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            ) : (
                                <div className="w-full aspect-square" />
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Selected date events */}
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t"
                    >
                        <h4 className="text-sm font-medium mb-2">
                            {selectedDate.toLocaleDateString("ja-JP", {
                                month: "long",
                                day: "numeric",
                                weekday: "long",
                            })}
                        </h4>
                        {getEventsForDate(selectedDate).length > 0 ? (
                            <div className="space-y-2">
                                {getEventsForDate(selectedDate).map((event) => (
                                    <div
                                        key={event.id}
                                        className="text-sm p-2 rounded bg-accent/50"
                                    >
                                        <div className="font-medium">{event.title}</div>
                                        <div className="text-muted-foreground text-xs">
                                            {new Date(event.datetime).toLocaleTimeString("ja-JP", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                            {event.location && ` @ ${event.location}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                この日の予定はありません
                            </p>
                        )}
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
