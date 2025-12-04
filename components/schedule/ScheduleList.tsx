"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trash2, Clock } from "lucide-react";
import { ScheduleEvent } from "@/lib/types/schedule";
import { useDeleteSchedule } from "@/hooks/useSchedule";

interface ScheduleListProps {
    events: ScheduleEvent[];
    loading?: boolean;
    onEventDeleted?: () => void;
}

export function ScheduleList({ events, loading, onEventDeleted }: ScheduleListProps) {
    const { deleteEvent, loading: deleting } = useDeleteSchedule();

    const handleDelete = async (id: string) => {
        try {
            await deleteEvent(id);
            onEventDeleted?.();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const formatDate = (datetime: string) => {
        const date = new Date(datetime);
        return date.toLocaleDateString("ja-JP", {
            month: "short",
            day: "numeric",
            weekday: "short",
        });
    };

    const formatTime = (datetime: string) => {
        const date = new Date(datetime);
        return date.toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isToday = (datetime: string) => {
        const eventDate = new Date(datetime).toDateString();
        return eventDate === new Date().toDateString();
    };

    const isTomorrow = (datetime: string) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const eventDate = new Date(datetime).toDateString();
        return eventDate === tomorrow.toDateString();
    };

    const getDateLabel = (datetime: string) => {
        if (isToday(datetime)) return "今日";
        if (isTomorrow(datetime)) return "明日";
        return formatDate(datetime);
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-20 rounded-lg bg-muted/50 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <Card className="bg-card/50 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                        スケジュールがありません
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        上の入力欄から予定を追加してみましょう
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {events.map((event, index) => (
                <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card className="bg-card/50 backdrop-blur-sm hover:bg-accent/30 transition-colors group">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center min-w-[60px] text-center">
                                        <span className={`text-xs font-medium ${isToday(event.datetime) ? "text-primary" : "text-muted-foreground"}`}>
                                            {getDateLabel(event.datetime)}
                                        </span>
                                        <span className="text-2xl font-bold">
                                            {new Date(event.datetime).getDate()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-foreground">
                                            {event.title}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(event.datetime)}
                                            </span>
                                            {event.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>
                                        {event.description && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {event.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(event.id)}
                                    disabled={deleting}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
