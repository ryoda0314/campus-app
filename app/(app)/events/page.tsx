import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateEventDialog } from "@/components/features/create-event-dialog";

export default async function EventsPage() {
    const supabase = await createClient();

    const { data: events } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Events</h2>
                    <p className="text-muted-foreground">
                        Discover and join exciting events.
                    </p>
                </div>
                <CreateEventDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events?.map((event) => (
                    <Card key={event.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary">
                                    <CalendarDays className="h-3 w-3 mr-1" /> Event
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    Open
                                </span>
                            </div>
                            <CardTitle className="mt-2 text-xl">{event.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="mt-auto space-y-4">
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {event.date ? new Date(event.date).toLocaleDateString() : "TBD"}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {event.location || "Online"}
                                </div>
                            </div>
                            <Link href={`/events/${event.id}`}>
                                <Button variant="outline" className="w-full gap-2">
                                    View Details <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
                {(!events || events.length === 0) && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No events found. Be the first to create one!
                    </div>
                )}
            </div>
        </div>
    );
}
