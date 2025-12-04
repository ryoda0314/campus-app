"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { useUpcomingSchedule } from "@/hooks/useSchedule";
import Link from "next/link";

export function UpcomingScheduleWidget() {
    const { events, loading } = useUpcomingSchedule(7);

    const formatDate = (datetime: string) => {
        const date = new Date(datetime);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return "今日";
        }
        if (date.toDateString() === tomorrow.toDateString()) {
            return "明日";
        }
        return date.toLocaleDateString("ja-JP", {
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (datetime: string) => {
        return new Date(datetime).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Upcoming Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-12 rounded bg-muted/50 animate-pulse"
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Upcoming Schedule
                    </span>
                    <Link
                        href="/schedule"
                        className="text-xs text-primary hover:underline"
                    >
                        View All
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {events.length === 0 ? (
                    <div className="text-center py-6">
                        <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">
                            直近の予定はありません
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                            何か追加してみましょう
                        </p>
                        <Link href="/schedule">
                            <Button variant="outline" size="sm" className="mt-3 gap-2">
                                予定ページへ
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {events.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex flex-col items-center min-w-[40px] text-center">
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(event.datetime)}
                                    </span>
                                    <span className="text-lg font-bold">
                                        {new Date(event.datetime).getDate()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {event.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(event.datetime)}
                                        </span>
                                        {event.location && (
                                            <span className="flex items-center gap-1 truncate">
                                                <MapPin className="h-3 w-3" />
                                                {event.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        <Link href="/schedule">
                            <Button variant="ghost" size="sm" className="w-full mt-2 gap-2">
                                予定ページへ
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
