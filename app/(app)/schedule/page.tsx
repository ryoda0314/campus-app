"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, CalendarDays } from "lucide-react";
import { ScheduleInput } from "@/components/schedule/ScheduleInput";
import { ScheduleList } from "@/components/schedule/ScheduleList";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";
import { useSchedule } from "@/hooks/useSchedule";

export default function SchedulePage() {
    const { events, loading, refetch } = useSchedule();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [view, setView] = useState<"list" | "calendar">("list");

    // Filter events for selected date in calendar view
    const filteredEvents = selectedDate
        ? events.filter(
            (e) =>
                new Date(e.datetime).toDateString() === selectedDate.toDateString()
        )
        : events;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
                <p className="text-muted-foreground">
                    自然言語で予定を追加・管理できます
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Input */}
                <div>
                    <ScheduleInput onEventAdded={refetch} />
                </div>

                {/* Right: List or Calendar */}
                <div>
                    <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="list" className="gap-2">
                                <List className="h-4 w-4" />
                                リスト
                            </TabsTrigger>
                            <TabsTrigger value="calendar" className="gap-2">
                                <CalendarDays className="h-4 w-4" />
                                カレンダー
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="list" className="mt-0">
                            <ScheduleList
                                events={events}
                                loading={loading}
                                onEventDeleted={refetch}
                            />
                        </TabsContent>

                        <TabsContent value="calendar" className="mt-0 space-y-4">
                            <ScheduleCalendar
                                events={events}
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                            />
                            {selectedDate && (
                                <ScheduleList
                                    events={filteredEvents}
                                    loading={loading}
                                    onEventDeleted={refetch}
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
