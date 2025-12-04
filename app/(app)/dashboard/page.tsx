import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActivityRank } from "@/components/features/activity-rank";
import { PresenceWidget } from "@/components/features/presence-widget";
import { ArrowRight, MessageSquare, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DailyGoalCard } from "@/components/features/daily-goal-card";

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
        <div className="space-y-8">
            {/* Welcome & Status Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                            <p className="text-muted-foreground">
                                Welcome back, {profile?.full_name || user?.email}.
                            </p>
                        </div>
                        <ActivityRank rank={profile?.rank || "Bronze"} size="lg" />
                    </div>

                    <DailyGoalCard
                        initialGoal={profile?.goal || ""}
                        userId={user?.id || ""}
                    />
                </div>
                <div className="col-span-1">
                    <PresenceWidget userId={user?.id || ""} />
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Active Rooms */}
                <Card className="col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl">Active Rooms</CardTitle>
                        <Link href="/rooms" className="text-sm text-primary hover:underline">
                            View All
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {rooms?.map((room) => (
                            <div
                                key={room.id}
                                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
                            >
                                <div>
                                    <div className="font-medium">{room.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {room.category}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    {/* Mock member count for now as it requires join query */}
                                    {Math.floor(Math.random() * 20) + 1}
                                </div>
                            </div>
                        ))}
                        {(!rooms || rooms.length === 0) && (
                            <div className="text-sm text-muted-foreground">No active rooms.</div>
                        )}
                        <Button variant="outline" className="w-full">
                            Join a Room
                        </Button>
                    </CardContent>
                </Card>

                {/* Latest News */}
                <Card className="col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl">Latest News</CardTitle>
                        <Link href="/news" className="text-sm text-primary hover:underline">
                            View All
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {news?.map((item) => (
                            <div key={item.id} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">
                                        {item.tags?.[0] || "News"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {item.source} • {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="font-medium hover:text-primary cursor-pointer">
                                    {item.title}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MessageSquare className="h-3 w-3" />
                                    {/* Mock comment count */}
                                    {Math.floor(Math.random() * 10)} comments
                                </div>
                            </div>
                        ))}
                        {(!news || news.length === 0) && (
                            <div className="text-sm text-muted-foreground">No news available.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card className="col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl">Upcoming</CardTitle>
                        <Link
                            href="/projects"
                            className="text-sm text-primary hover:underline"
                        >
                            View All
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {projects?.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-start gap-3 rounded-lg border p-3"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-medium">{event.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(event.date).toLocaleDateString()} @ {event.location || "TBD"}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!projects || projects.length === 0) && (
                            <div className="text-sm text-muted-foreground">No upcoming projects.</div>
                        )}
                        <Button className="w-full gap-2">
                            Create Project <ArrowRight className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
