import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PresenceWidget } from "@/components/features/presence-widget";
import { UpcomingScheduleWidget } from "@/components/dashboard/UpcomingScheduleWidget";
import { ArrowRight, MessageSquare, Users, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();

    // Fetch User
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

    // Fetch Active Rooms (limit 3)
    const { data: rooms } = await supabase
        .from("rooms")
        .select("*")
        .limit(3);

    // Fetch Latest News (limit 3)
    const { data: news } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

    // Fetch Upcoming Projects/Events (limit 3)
    const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .order("date", { ascending: true })
        .limit(3);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {profile?.full_name || user?.email}
                </p>
            </div>

            {/* Main Layout: Content + Sidebar */}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* Left: Main Content */}
                <div className="space-y-6">
                    {/* Cards Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {/* Active Rooms */}
                        <Card className="bg-card/50 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    Active Rooms
                                </CardTitle>
                                <Link href="/rooms" className="text-xs text-primary hover:underline">
                                    View All
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {rooms?.map((room) => (
                                    <div
                                        key={room.id}
                                        className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/50"
                                    >
                                        <div>
                                            <div className="font-medium text-sm">{room.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {room.category}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Users className="h-3 w-3" />
                                            {Math.floor(Math.random() * 20) + 1}
                                        </div>
                                    </div>
                                ))}
                                {(!rooms || rooms.length === 0) && (
                                    <div className="text-sm text-muted-foreground py-4 text-center">
                                        No active rooms
                                    </div>
                                )}
                                <Link href="/rooms">
                                    <Button variant="outline" size="sm" className="w-full">
                                        Join a Room
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Latest News */}
                        <Card className="bg-card/50 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Latest News
                                </CardTitle>
                                <Link href="/news" className="text-xs text-primary hover:underline">
                                    View All
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {news?.map((item) => (
                                    <div key={item.id} className="space-y-1 py-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                {item.tags?.[0] || "News"}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="font-medium text-sm hover:text-primary cursor-pointer line-clamp-2">
                                            {item.title}
                                        </div>
                                    </div>
                                ))}
                                {(!news || news.length === 0) && (
                                    <div className="text-sm text-muted-foreground py-4 text-center">
                                        No news available
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming Projects */}
                        <Card className="bg-card/50 backdrop-blur-sm sm:col-span-2 xl:col-span-1">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Upcoming
                                </CardTitle>
                                <Link href="/projects" className="text-xs text-primary hover:underline">
                                    View All
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {projects?.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-start gap-3 rounded-lg border border-border/50 p-3"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm truncate">{event.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(event.date).toLocaleDateString()} @ {event.location || "TBD"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!projects || projects.length === 0) && (
                                    <div className="text-sm text-muted-foreground py-4 text-center">
                                        No upcoming projects
                                    </div>
                                )}
                                <Link href="/projects">
                                    <Button size="sm" className="w-full gap-2">
                                        Create Project <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right: Sidebar Widgets */}
                <div className="space-y-6">
                    <PresenceWidget userId={user?.id || ""} />
                    <UpcomingScheduleWidget />
                </div>
            </div>
        </div>
    );
}
